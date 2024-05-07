import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import {
    ClockRange,
    ClockStep,
    Color,
    PolylineArrowMaterialProperty,
    Resource,
} from 'cesium';
import { Viewer, CameraFlyTo, Entity, Globe, Model, Clock } from 'resium';

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

    // TODO: For race nodes use race.poi.lines instead of raceSetup.courseNodes()

    const courseNodes = useMemo(() => raceSetup.courseNodes(), [raceSetup]);
    const courseMainNodes = useMemo(() => raceSetup.courseMainNodes(), [raceSetup]);
    const courseStartNode = useMemo(() => raceSetup.courseStartNode(), [raceSetup]);
    const cameraDestination = useMemo(() => courseStartNode.toCartesian3(100000), [courseStartNode]);

    console.log(teamsPositions[0]);
    return (
        <Viewer
            id={id}
            geocoder={false} // search bar
            homeButton={false} // home button
            navigationHelpButton={false} // navigation help
            // sceneModePicker={false} // 3D/2D
            // baseLayerPicker={false} // map type
            full
            onUpdate={(...args) => {
                console.log('onUpdate', args);
            }}
        >
            <Globe enableLighting />

            <Clock
                startTime={raceSetup.start.toJulianDate()}
                stopTime={raceSetup.stop.toJulianDate()}
                currentTime={raceSetup.stop.toJulianDate()}
                clockRange={ClockRange.CLAMPED}
                clockStep={ClockStep.SYSTEM_CLOCK_MULTIPLIER}
                // multiplier={4000} // how much time to advance each tick
                // shouldAnimate // Animation on by default
                onTick={(...args) => {
                    console.log('onTick', args);
                }}
            />

            <CameraFlyTo
                duration={5}
                destination={cameraDestination}
                once
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
                if (team.id !== 2) {
                    return null;
                }
                const teamPositions = teamsPositions.find((position: TeamPosition) => position.id === team.id);
                if (!teamPositions) {
                    return null;
                }
                const teamPosition = teamPositions.positionAt(Date.now());
                const teamOrientation = teamPositions.orientationAt(Date.now());
                return (
                    <Entity
                        key={teamPositions.pk()}
                        name={team.name}
                        position={teamPosition.toCartesian3()}
                        // point={teamPoint}
                    >
                        <Model
                            url={modelUrl}
                            modelMatrix={teamOrientation}
                            // minimumPixelSize={30}
                            // maximumScale={200}
                            minimumPixelSize={96}
                            maximumScale={500}
                            onClick={(...args) => {
                                console.log('onModelClick', args);
                            }}
                        />
                    </Entity>
                );
            })}
        </Viewer>
    )
};

export default Race;
