import { createResource, Entity } from '@data-client/rest';
import L from 'leaflet';
import { RaceDate } from '@classes/RaceDate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface RaceMomentInterface {
  at: number;
  lat: number;
  lon: number;
  dtf: number;
  pc: number;
  alt?: number;
  lap?: number;
}

export class RaceMoment extends Entity {
  at = RaceDate.fromJS();
  lat: number = 0;
  lon: number = 0;
  dtf: number = 0;
  pc: number = 0;
  alt?: number;
  lap?: number;

  constructor(moment: RaceMomentInterface) {
    super();
    this.at = new RaceDate(moment.at);
    this.lat = moment.lat;
    this.lon = moment.lon;
    this.dtf = moment.dtf;
    this.pc = moment.pc;
    this.alt = moment.alt;
    this.lap = moment.lap;
  }

  pk(): string {
    return `${this.at}`;
  }

  toLatLng(): L.LatLng {
    return L.latLng(this.lat, this.lon);
  }

  // static schema = {
  //     at: (value: number) => new RaceDate(value),
  //     lat: Number,
  //     lon: Number,
  //     dtf: Number,
  //     pc: Number,
  //     alt: Number,
  //     lap: Number,
  // }

  static key = 'RaceMoment';
}

export class TeamPosition extends Entity {
  id: number = 0;
  moments = [];

  pk(): string {
    return `${this.id}`;
  }

  positionAt(at: number) {
    return this.moments.reduce((acc: RaceMoment, moment: RaceMoment) => {
      if (
        Math.abs(moment.at.toMilliseconds() - at) <
        Math.abs(acc.at.toMilliseconds() - at)
      ) {
        return moment;
      }
      return acc;
    }, this.moments[0]);
  }

  trackAt(at: number): RaceMoment[] {
    return this.moments
      .filter((moment: RaceMoment) => moment.at.toMilliseconds() <= at)
      .sort(
        (a: RaceMoment, b: RaceMoment) =>
          a.at.toMilliseconds() - b.at.toMilliseconds(),
      );
  }

  orientationAt(at: number): number {
    // TODO: Not finished
    const track = this.trackAt(at);
    if (track.length < 2) {
      return 0;
    }

    const lastMoment = track[track.length - 1];
    const previousMoment = track[track.length - 2];
    return (
      (Math.atan2(
        lastMoment.lat - previousMoment.lat,
        lastMoment.lon - previousMoment.lon,
      ) *
        180) /
      Math.PI
    );
  }

  static schema = {
    id: Number,
    moments: (value: RaceMomentInterface[]) =>
      value.map((moment: RaceMomentInterface) => new RaceMoment(moment)),
  };

  static key = 'TeamPosition';
}

export const TeamsPositionsResource = createResource({
  urlPrefix: `${API_BASE_URL}/api/v1/races`,
  path: '/:id/teams-positions-all',
  schema: [TeamPosition],
});
