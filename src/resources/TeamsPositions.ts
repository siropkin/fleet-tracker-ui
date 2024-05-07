import { Entity, createResource } from '@data-client/rest';
import {
    Cartesian3,
    Math as CesiumMath,
    Transforms,
    HeadingPitchRoll,
    Matrix4
} from 'cesium';
import { RaceDate } from "@classes/RaceDate";

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

    toCartesian3(height: number | undefined = undefined): Cartesian3 {
        return Cartesian3.fromDegrees(this.lon, this.lat, height);
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
        return this.moments.reduce((acc: Moment, moment: Moment) => {
            if (Math.abs(moment.at.toMilliseconds() - at) < Math.abs(acc.at.toMilliseconds() - at)) {
                return moment;
            }
            return acc;
        }, this.moments[0]);
    }

    trackAt(at: number): Moment[] {
        return this.moments
            .filter((moment: Moment) => moment.at.toMilliseconds() <= at)
            .sort((a: Moment, b: Moment) => a.at.toMilliseconds() - b.at.toMilliseconds());
    }

    orientationAt(at: number): Matrix4 {
        const track = this.trackAt(at);

        const lastMoment = track[track.length - 1];
        const previousMoment = track[track.length - 2];

        const angleDeg = Math.atan2(lastMoment.lat - previousMoment.lat, lastMoment.lon - previousMoment.lon) * 180 / Math.PI;

        const heading = CesiumMath.toRadians(angleDeg);
        const pitch = CesiumMath.toRadians(0.0);
        const roll = CesiumMath.toRadians(0.0);
        const hpr = new HeadingPitchRoll(heading, pitch, roll);

        return Transforms.headingPitchRollToFixedFrame(previousMoment.toCartesian3(), hpr);
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
