import {createResource, Entity} from '@data-client/rest';
import {Cartesian3} from 'cesium';
import {RaceDate} from "@classes/RaceDate";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class CourseNode extends Entity {
    name: string | undefined = undefined;
    lat: number = 0;
    lon: number = 0;

    pk(): string {
        return [this.name, this.lat, this.lon].filter(Boolean).join(',');
    }

    toCartesian3(height: number | undefined = undefined): Cartesian3 {
        return Cartesian3.fromDegrees(this.lon, this.lat, height);
    }
}

// aptain
// :
// "Paul Larson"
// colour
// :
// "00FFFF"
// country
// :
// "Switzerland"
// finishedAt
// :
// 1708559465
// flag
// :
// "CH"
// id
// :
// 1
// img
// :
// "https://ti.yb.tl/1024/2024216-427438e8.jpg"
// markerText
// :
// "1"
// maxLaps
// :
// 1
// model
// :
// "Custom"
// name
// :
// "ALLEGRA"
// owner
// :
// "Adrian Keller"
// sail
// :
// "SUI888"
// start
// :
// 1708356600
// started
// :
// true
// status
// :
// "RACING"
// tags
// :
// (2) [70183, 70197]
// tcf1
// :
// "1.000"
// tcf2
// :
// "1.000"
// tcf3
// :
// "1.408"
// thumb
// :
// "https://ti.yb.tl/256/2024216-86d28e80.jpg"
// type
// :
// "CAT_L"
// url
// :
// ""

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
        finishedAt: Number,
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
