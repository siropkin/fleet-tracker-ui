import { useParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import { Color, PolylineArrowMaterialProperty, Resource, Transforms } from 'cesium';
import { Viewer, CameraFlyTo, Entity, Globe, Model } from 'resium';

import { RaceSetupResource, CourseNode, Team } from '@resources/RaceSetup';
import { TeamsPositionsResource, TeamPosition } from '@resources/TeamsPositions';

const courseMainNodePoint = { pixelSize: 5 };
const courseNodesMaterial = new PolylineArrowMaterialProperty(Color.fromCssColorString("#2bb3c0"));
const courseNodesWidth = 10.0;
// const teamPoint = { pixelSize: 15 };

// const origin = Cartesian3.fromDegrees(-95.0, 40.0, 200000.0);
// const modelMatrix = Transforms.eastNorthUpToFixedFrame(origin);
const modelUrl = Promise.resolve(new Resource(`${window.location.origin}/models/Cesium_Air.glb`));

const Race = () => {
    const { id } = useParams();
    const raceSetup = useSuspense(RaceSetupResource.get, { id: `${id}` });
    const teamsPositions = useSuspense(TeamsPositionsResource.get, { id: `${id}` });

    const courseNodes = raceSetup.courseNodes();
    const courseMainNodes = raceSetup.courseMainNodes();
    const courseStartNode = raceSetup.courseStartNode();

    return (
        <Viewer
            id={id}
            full
            geocoder={false} // search bar
            homeButton={false} // home button
            navigationHelpButton={false} // navigation help
            // sceneModePicker={false} // 3D/2D
            // baseLayerPicker={false} // map type
        >
            <Globe enableLighting />

            <CameraFlyTo
                duration={5}
                destination={courseStartNode.toCartesian3(100000)}
            />

            {courseMainNodes.map((point: CourseNode) => (
                <Entity
                    key={point.pk()}
                    name={point.name}
                    position={point.toCartesian3()}
                    point={courseMainNodePoint}
                />
            ))}

            <Entity
                polyline={{
                    positions: courseNodes.map((point: CourseNode) => point.toCartesian3()),
                    material: courseNodesMaterial,
                    width: courseNodesWidth,
                }}
            />

            {raceSetup.teams.map((team: Team) => {
                const teamPositions = teamsPositions.find((position: TeamPosition) => position.id === team.id);
                if (!teamPositions) {
                    return null;
                }
                const teamPosition = teamPositions.closestPosition(Date.now());
                const modelMatrix = Transforms.eastNorthUpToFixedFrame(teamPosition.toCartesian3());
                return (
                    <Entity
                        key={teamPositions.pk()}
                        name={team.name}
                        position={teamPosition.toCartesian3()}
                        // point={teamPoint}
                    >
                        <Model
                            url={modelUrl}
                            modelMatrix={modelMatrix}
                            // minimumPixelSize={30}
                            // maximumScale={200}
                            minimumPixelSize={96}
                            maximumScale={500}
                        />
                    </Entity>
                );
            })}
        </Viewer>
    )
};

export default Race;
