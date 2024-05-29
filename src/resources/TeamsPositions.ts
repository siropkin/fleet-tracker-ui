import { Entity, createResource } from '@data-client/rest';
import { RaceDate } from "@classes/RaceDate";
import { AvlTree } from "@classes/AvlTree";
import L from 'leaflet';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class Moment extends Entity {
    at = RaceDate.fromJS();
    lat: number = 0;
    lon: number = 0;
    dtf: number = 0;
    pc: number = 0;

    pk(): string {
        return `${this.at}`;
    }

    toLatLng(): L.LatLng {
        return L.latLng(this.lat, this.lon);
    }

    static schema = {
        at: (value: number) => new RaceDate(value),
        lat: Number,
        lon: Number,
        dtf: Number,
        pc: Number,
    }
}

export class TeamPosition extends Entity {
    id: number = 0;
    moments: Moment[] = [];

    pk(): string {
        return `${this.id}`;
    }

    positionAt(at: number): Moment {
        // return this.moments.reduce((acc: Moment, moment: Moment) => {
        //     if (Math.abs(moment.at.toMilliseconds() - at) < Math.abs(acc.at.toMilliseconds() - at)) {
        //         return moment;
        //     }
        //     return acc;
        // }, this.moments[0]);

        const e = new AvlTree((a, b) => {
            return a.at < b.at ? -1 : a.at > b.at ? 1 : a
        })
        e.teamId = this.id
        this.moments.reverse().forEach(function(moment) {
            // var i = {};
            // i.r7latlng = new R7LatLng(moment.lat,moment.lon),
            //     i.time = moment.at,
            //     i.dtf = moment.dtf,
            //     i.alt = moment.alt,
            //     i.pc = moment.pc / 100,
            //     i.lap = moment.lap,
            // (null == viewer.latestRawTime || moment.at > viewer.latestRawTime) && (viewer.latestRawTime = moment.at),
            console.log('moment', moment);
            if (moment.at.toMilliseconds() <= at) {
                e.add(moment)
            }
        })
        // t.teamPositionsAvlTree = e
        console.log('positionAt', e);

        return e.root?.value;
    }

    trackAt(at: number): Moment[] {
        return this.moments
            .filter((moment: Moment) => moment.at.toMilliseconds() <= at)
            .sort((a: Moment, b: Moment) => a.at.toMilliseconds() - b.at.toMilliseconds());
    }

    orientationAt(at: number): number {
        const track = this.trackAt(at);
        if (track.length < 2) {
            return 0;
        }

        const lastMoment = track[track.length - 1];
        const previousMoment = track[track.length - 2];

        const angleDeg = Math.atan2(lastMoment.lat - previousMoment.lat, lastMoment.lon - previousMoment.lon) * 180 / Math.PI;

        return angleDeg;
    }

    static schema = {
        id: Number,
        moments: [Moment],
    }

    static key = 'TeamPosition';
}

export const TeamsPositionsResource = createResource({
    urlPrefix: `${API_BASE_URL}/api/v1/races`,
    path: '/:id/teams-positions-all',
    schema: [TeamPosition],
});
