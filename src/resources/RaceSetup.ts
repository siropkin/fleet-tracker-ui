import { createResource, Entity } from '@data-client/rest';
import L from 'leaflet';
import { distanceConverter } from '@utils/distanceConverter';

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
  moments: RaceMoment[];

  pk(): string {
    return `${this.id}`;
  }

  finishedAtInMilliseconds(): number {
    if (!this.finishedAt) {
      return 0;
    }
    return this.finishedAt * 1000;
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
    tags: [Number],
    tcf1: String,
    tcf2: String,
    tcf3: String,
    thumb: String,
    type: String,
    url: String,
  };

  static key = 'Team';
}

export class Tag extends Entity {
  handicap: string = '';
  id: number = 0;
  laps: number = 0;
  lb: boolean = false;
  name: string = '';
  show: number = 0;
  sort: number = 0;

  pk(): string {
    return `${this.id}`;
  }

  static schema = {
    handicap: String,
    id: Number,
    laps: Number,
    lb: Boolean,
    name: String,
    show: Number,
    sort: Number,
  };

  static key = 'Tag';
}

export class RaceSetup extends Entity {
  id = '';
  title = '';
  course = {
    nodes: [],
    distance: 0,
  };
  start: number | null = null;
  stop: number | null = null;
  teams = [];
  tags = [];
  logo = {
    x: 0,
    y: 0,
    href: '',
    url: '',
  };

  pk(): string {
    return `${this.id}`;
  }

  courseNodes(): CourseNode[] {
    return this.course.nodes;
  }

  courseMainNodes(): CourseNode[] {
    const nodesObj = this.course.nodes.reduce(
      (acc: Record<string, CourseNode>, node: CourseNode) => {
        if (!node.name) {
          return acc;
        }
        acc[node.pk()] = node;
        return acc;
      },
      {},
    );
    return Object.values(nodesObj);
  }

  courseStartNode(): CourseNode {
    return (
      this.course.nodes.find((node: CourseNode) => node.name === 'Start') ||
      this.course.nodes[0]
    );
  }

  courseFinishNode(): CourseNode {
    return (
      this.course.nodes.find((node: CourseNode) => node.name === 'Finish') ||
      this.course.nodes[this.course.nodes.length - 1]
    );
  }

  courseDistance(units?: string): number {
    if (!this.course.distance) {
      return 0;
    }
    return distanceConverter(this.course.distance * 1000, units);
  }

  startInMilliseconds(): number {
    if (!this.start) {
      return 0;
    }
    return this.start * 1000;
  }

  stopInMilliseconds(): number {
    if (!this.stop) {
      return 0;
    }
    return this.stop * 1000;
  }

  static schema = {
    id: String,
    title: String,
    course: {
      nodes: [CourseNode],
      distance: Number,
    },
    start: Number,
    stop: Number,
    teams: [Team],
    tags: [Tag],
    logo: Object,
  };

  static key = 'RaceSetup';
}

export const RaceSetupResource = createResource({
  urlPrefix: `${API_BASE_URL}/api/v1/races`,
  path: '/:id/setup',
  schema: RaceSetup,
});
