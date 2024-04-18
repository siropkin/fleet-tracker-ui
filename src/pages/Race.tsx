import { useParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import { Color, PolylineArrowMaterialProperty} from 'cesium';
import { Viewer, CameraFlyTo, Entity, Globe  } from 'resium';

import { RaceSetupResource, CourseNode } from '@resources/RaceSetup';
import { TeamsPositionsResource, TeamPosition } from '@resources/TeamsPositions';

const courseMainNodePoint = { pixelSize: 5 };
const courseNodesMaterial = new PolylineArrowMaterialProperty(Color.fromCssColorString("#2bb3c0"));
const courseNodesWidth = 10.0;
const teamPoint = { pixelSize: 15 };

const Race = () => {
    const { id } = useParams();
    const raceSetup = useSuspense(RaceSetupResource.get, { id: `${id}` });
    const teamsPositions = useSuspense(TeamsPositionsResource.get, { id: `${id}` });

    const courseNodes = raceSetup.courseNodes();
    const courseMainNodes = raceSetup.courseMainNodes();
    const courseStartNode = raceSetup.courseStartNode();

    return (
        <Viewer id="root" full navigationInstructionsInitiallyVisible={false}>
            <Globe enableLighting />

            <CameraFlyTo
                duration={5}
                destination={courseStartNode.toCartesian3(100000)}
            />

            {courseMainNodes.map((point: CourseNode) => (
                <Entity
                    key={point.pk()}
                    name={point.name}
                    position={point.toCartesian3(100)}
                    point={courseMainNodePoint}
                />
            ))}

            <Entity
                polyline={{
                    positions: courseNodes.map((point: CourseNode) => point.toCartesian3(100)),
                    material: courseNodesMaterial,
                    width: courseNodesWidth,
                }}
            />

            {teamsPositions.map((position: TeamPosition) => {
                const moment = position.closestMoment(Date.now());
                const teamId = position.teamId();
                const teamInfo = raceSetup.teamInfo(teamId);
                return (
                    <Entity
                        key={position.pk()}
                        name={teamInfo?.name}
                        position={moment.toCartesian3(0)}
                        point={teamPoint}
                    />
                );
            })}
        </Viewer>
    )
};

export default Race;
