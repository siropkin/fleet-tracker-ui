import {createResource, Entity} from '@data-client/rest';
import {RaceDate} from "@classes/RaceDate";
import L from 'leaflet';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class CourseNode extends Entity {
    name: string | undefined = undefined;
    lat: number = 0;
    lon: number = 0;

    pk(): string {
        return [this.name, this.lat, this.lon].filter(Boolean).join(',');
    }

    toLatLng(): L.LatLng {
        return L.latLng(this.lat, this.lon);
    }
}

export class Team extends Entity {
    id: number = 0;
    name: string = '';
    captain: string = '';
    colour: string = '';
    country: string = '';
    finishedAt: number = 0;
    flag: string = '';
    img: string = '';
    markerText: string = '';
    maxLaps: number = 0;
    model: string = '';
    owner: string = '';
    sail: string = '';
    start: number = 0;
    started: boolean = false;
    status: string = '';
    tags: number[] = [];
    tcf1: string = '';
    tcf2: string = '';
    tcf3: string = '';
    thumb: string = '';
    type: string = '';
    url: string = '';

    pk(): string {
        return `${this.id}`;
    }

    static schema = {
        id: Number,
        name: String,
        captain: String,
        colour: String,
        country: String,
        finishedAt: (value: number) => new RaceDate(value),
        flag: String,
        img: String,
        markerText: String,
        maxLaps: Number,
        model: String,
        owner: String,
        sail: String,
        start: Number,
        started: Boolean,
        status: String,
        tags: Array,
        tcf1: String,
        tcf2: String,
        tcf3: String,
        thumb: String,
        type: String,
        url: String,
    }

    static key = 'Team';
}

export class RaceSetup extends Entity {
    id = '';
    course = {
        nodes: [],
        distance: 0,
    };
    teams = [];
    start = RaceDate.fromJS();
    stop = RaceDate.fromJS();

    pk(): string {
        return `${this.id}`;
    }

    courseNodes(): CourseNode[] {
        return this.course.nodes;
    }

    courseMainNodes(): CourseNode[] {
        const nodesObj = this.course.nodes.reduce((acc: Record<string, CourseNode>, node: CourseNode) => {
            if (!node.name) {
                return acc;
            }
            acc[node.pk()] = node;
            return acc;
        }, {});
        return Object.values(nodesObj);
    }

    courseStartNode(): CourseNode {
        return this.course.nodes.find((node: CourseNode) => node.name === 'Start') || this.course.nodes[0];
    }

    courseFinishNode(): CourseNode {
        return this.course.nodes.find((node: CourseNode) => node.name === 'Finish') || this.course.nodes[this.course.nodes.length - 1];
    }

    courseDistance(): number {
        return this.course.distance;
    }

    static schema = {
        id: String,
        course: {
            nodes: [CourseNode],
            distance: Number,
        },
        teams: [Team],
        start: (value: number) => new RaceDate(value),
        stop: (value: number) => new RaceDate(value),
    }

    static key = 'RaceSetup';
}

export const RaceSetupResource = createResource({
    urlPrefix: `${API_BASE_URL}/api/v1/races`,
    path: '/:id/setup',
    schema: RaceSetup,
});
