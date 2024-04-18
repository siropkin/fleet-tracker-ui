import { Entity, createResource } from '@data-client/rest';
import { Cartesian3 } from 'cesium';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class CourseNode extends Entity {
    name: string | undefined = undefined;
    lat: number = 0;
    lon: number = 0;

    pk(): string {
        return [this.name, this.lat, this.lon].filter(Boolean).join(',');
    }

    toCartesian3(height: number): Cartesian3 {
        return Cartesian3.fromDegrees(this.lon, this.lat, height);
    }
}

export class RaceSetup extends Entity {
    id = '';
    course = {
        nodes: [],
        distance: 0,
    };

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
    }

    static key = 'RaceSetup';
}

export const RaceSetupResource = createResource({
    urlPrefix: `${API_BASE_URL}/v1/races`,
    path: '/:id/setup',
    schema: RaceSetup,
});
