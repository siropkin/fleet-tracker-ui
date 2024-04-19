import { Entity, createResource } from '@data-client/rest';
import { Cartesian3 } from 'cesium';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class Moment extends Entity {
    at: number = 0;
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
}

export class TeamPosition extends Entity {
    id: number = 0;
    moments: Moment[] = [];

    pk(): string {
        return `${this.id}`;
    }

    closestPosition(at: number): Moment {
        return this.moments.reduce((acc: Moment, moment: Moment) => {
            if (Math.abs(moment.at - at) < Math.abs(acc.at - at)) {
                return moment;
            }
            return acc;
        }, this.moments[0]);
    }

    static schema = {
        id: Number,
        moments: [Moment],
    }

    static key = 'TeamPosition';
}

export const TeamsPositionsResource = createResource({
    urlPrefix: `${API_BASE_URL}/v1/races`,
    path: '/:id/teams-positions-all',
    schema: [TeamPosition],
});
