import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import { Cartesian3, Color, PolylineDashMaterialProperty } from 'cesium';
import { Viewer, Entity, PolylineGraphics, CameraFlyTo } from 'resium';

import { RaceSetupResource } from '@resources/RaceSetup';

const raceNodesMaterial = new PolylineDashMaterialProperty({ color: Color.CYAN });
const pointGraphics = { pixelSize: 10 };

const Race = () => {
    const { id } = useParams();
    const raceSetup = useSuspense(RaceSetupResource.get, { id });

    const raceStartPosition = useMemo(
        () => {
            const startNode = raceSetup?.course?.nodes?.find((node: { name: string; }) => node.name === "Start");
            if (!startNode) {
                return undefined;
            }
            return Cartesian3.fromDegrees(startNode.lon, startNode.lat, 100);
        },
        [raceSetup?.course?.nodes],
    );

    const raceTrackPositions = useMemo(
        () => {
            const coordinates = raceSetup?.course?.nodes?.flatMap((node: { lon: number; lat: number; }) => [node.lon, node.lat]);
            if (!coordinates?.length) {
                return undefined;
            }
            return Cartesian3.fromDegreesArray(coordinates);
        },
        [raceSetup?.course?.nodes],
    );

    return (
        <Viewer id="root" full>
            <CameraFlyTo duration={0} destination={raceStartPosition} />
            <Entity
                name="Race Track"
                description="Race Track"
                position={raceStartPosition}
                point={pointGraphics}
            >
                <PolylineGraphics
                    positions={raceTrackPositions}
                    width={4}
                    material={raceNodesMaterial}
                />
            </Entity>
        </Viewer>
    )
};

export default Race;
