import { useParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import { Color, PolylineArrowMaterialProperty } from 'cesium';
import { Viewer, CameraFlyTo, Entity } from 'resium';

import { RaceSetupResource, CourseNode } from '@resources/RaceSetup';

const courseMainNodeGraphics = { pixelSize: 5 };

const courseNodesMaterial = new PolylineArrowMaterialProperty(
    Color.fromCssColorString("#2bb3c0")
);
const courseNodesWidth = 10.0;

const Race = () => {
    const { id } = useParams();
    const raceSetup = useSuspense(RaceSetupResource.get, { id: `${id}` });

    const courseNodes = raceSetup.courseNodes();
    const courseMainNodes = raceSetup.courseMainNodes();
    const courseStartNode = raceSetup.courseStartNode();

    return (
        <Viewer id="root" full>
            {courseMainNodes.map((point: CourseNode) => (
                <Entity
                    key={point.pk()}
                    name={point.name}
                    position={point.toCartesian3(100)}
                    point={courseMainNodeGraphics}
                />
            ))}

            <Entity
                polyline={{
                    positions: courseNodes.map((point: CourseNode) => point.toCartesian3(100)),
                    material: courseNodesMaterial,
                    width: courseNodesWidth,
                }}
            />

            {courseStartNode && (
                <CameraFlyTo
                    duration={5}
                    destination={courseStartNode.toCartesian3(100000)}
                />
            )}
        </Viewer>
    )
};

export default Race;
