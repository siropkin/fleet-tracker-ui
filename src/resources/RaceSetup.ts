import { Entity, createResource } from '@data-client/rest';

const HOST = 'http://localhost:5000/v1';

export class RaceSetup extends Entity {
    id = '';
    course = {
        nodes: [],
        distance: 0,
    };

    pk() {
        return `${this.id}`;
    }
    
    static key = 'RaceSetup';
}

export const RaceSetupResource = createResource({
    urlPrefix: `${HOST}/races`,
    path: '/:id/setup',
    schema: RaceSetup,
});
