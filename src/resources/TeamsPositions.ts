import { createResource, Entity } from '@data-client/rest';
import L from 'leaflet';
import { distanceConverter } from '@utils/distanceConverter.ts';

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
  at: number = 0;
  lat: number = 0;
  lon: number = 0;
  dtf: number = 0;
  pc: number = 0;
  alt?: number;
  lap?: number;

  constructor(moment: RaceMomentInterface) {
    super();
    this.at = moment.at;
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

  atInMilliseconds(): number {
    if (!this.at) {
      return 0;
    }
    return this.at * 1000;
  }

  distanceToFinish(units?: string): number {
    return distanceConverter(this.dtf, units);
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
        Math.abs(moment.atInMilliseconds() - at) <
        Math.abs(acc.atInMilliseconds() - at)
      ) {
        return moment;
      }
      return acc;
    }, this.moments[0]);
  }

  positionsAt(at: number): RaceMoment[] {
    at = at > 10000000000 ? at / 1000 : at;
    return this.moments.filter((moment: RaceMoment) => moment.at <= at);
  }

  orientationAt(at: number): number {
    // TODO: Not finished
    const track = this.positionsAt(at);
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

  static key = 'TeamPosition';

  static schema = {
    id: Number,
    moments: (value: RaceMomentInterface[]) =>
      value.map((moment: RaceMomentInterface) => new RaceMoment(moment)),
  };

  static merge(existing: any, incoming: any) {
    let wasModified = false;
    const nextMoments = [...existing.moments];
    incoming.moments.forEach((moment: RaceMoment) => {
      const isMomentExists = nextMoments.some(
        (nextMoment: RaceMoment) => nextMoment.at === moment.at,
      );
      if (!isMomentExists) {
        wasModified = true;
        nextMoments.push(moment);
      }
    });
    if (!wasModified) {
      return existing;
    }
    return {
      id: existing.id,
      moments: nextMoments.sort((a: RaceMoment, b: RaceMoment) => a.at - b.at),
    };
  }
}

export const TeamsPositionsAllResource = createResource({
  urlPrefix: `${API_BASE_URL}/api/v1/races`,
  path: '/:id/teams-positions-all',
  schema: [TeamPosition],
});

export const TeamsPositionsLatestResource = createResource({
  urlPrefix: `${API_BASE_URL}/api/v1/races`,
  path: '/:id/teams-positions-latest',
  schema: [TeamPosition],
  pollFrequency: 60000,
});
