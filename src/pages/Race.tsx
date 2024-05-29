import {Fragment, useCallback, useEffect, useMemo, useState} from 'react';
import { useParams, useSearchParams  } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import {Card, CardHeader, CardBody, CardFooter, Divider, Link, Image, Slider} from "@nextui-org/react";
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, CircleMarker } from "react-leaflet";
import ReactCountryFlag from "react-country-flag"
import L from 'leaflet';

import { RaceSetupResource, CourseNode, Team } from '@resources/RaceSetup';
import { TeamsPositionsResource, TeamPosition } from '@resources/TeamsPositions';

import "leaflet/dist/leaflet.css";

const Race = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const raceSetup = useSuspense(RaceSetupResource.get, { id: `${id}` });
    const teamsPositions = useSuspense(TeamsPositionsResource.get, { id: `${id}` });

    const ts = useMemo(() => {
        const time = searchParams.get('ts');
        return time ? parseInt(time) : undefined;
    }, [searchParams]);

    const teamType = useMemo(() => {
        const teamClass = searchParams.get('team_type');
        return teamClass ? teamClass : undefined;
    }, [searchParams]);

    const teamId = useMemo(() => {
        const teamId = searchParams.get('team_id');
        return teamId ? parseInt(teamId) : undefined;
    }, [searchParams]);

    const teamName = useMemo(() => {
        const teamName = searchParams.get('team_name');
        return teamName ? teamName : undefined;
    }, [searchParams]);

    const courseNodes = useMemo(() => raceSetup.courseNodes().map((node) => node.toLatLng()), [raceSetup]);
    const courseMainNodes = useMemo(() => raceSetup.courseMainNodes(), [raceSetup]);
    const courseStartNode = useMemo(() => raceSetup.courseStartNode(), [raceSetup]);

    useEffect(() => {
        if (ts == null) {
            setSearchParams({ t: `${Date.now()}` });
            return;
        }
    }, [setSearchParams, ts]);

    return (
        <MapContainer
            style={{minHeight: "100vh", minWidth: "100vw"}}
            bounds={L.latLngBounds(courseNodes)}
            boundsOptions={{padding: [1, 1]}}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Polygon positions={courseNodes} fillRule="nonzero"/>

            {courseMainNodes.map((node, index) => (
                <CircleMarker key={index} center={node.toLatLng()} radius={5} color="red">
                    <Popup>
                        <span>{node.name}</span>
                    </Popup>
                </CircleMarker>
            ))}

            {raceSetup.teams.map((team: Team) => {

                if (!ts) {
                    return null;
                }
                if (teamType != null && team.type.toLowerCase() !== teamType.toLowerCase()) {
                    return null;
                }
                if (teamId != null && team.id !== teamId) {
                    return null;
                }
                if (teamName != null && team.name.toLowerCase() !== teamName.toLowerCase()) {
                    return null;
                }
                const teamPositions = teamsPositions.find((position: TeamPosition) => position.id === team.id);
                if (!teamPositions) {
                    return null;
                }
                const teamPosition = teamPositions.positionAt(ts)?.toLatLng();
                if (!teamPosition) {
                    return null;
                }
                console.log(ts, teamPosition);
                // const teamOrientation = teamPositions.orientationAt(ts);
                // const teamTrack = teamPositions.trackAt(ts).map((moment) => moment.toLatLng());
                // if (teamTrack.length > 10) {
                //     teamTrack.splice(0, teamTrack.length - 10);
                // }
                // const isFinished = team.finishedAt.toMilliseconds() < ts;
                return (
                    <Fragment key={team.id}>
                        <CircleMarker
                            center={teamPosition}
                            radius={5}
                            color="blue">
                            <Popup>
                                <Card className="col-span-12 sm:col-span-4 h-[300px] w-[300px]">
                                    <CardHeader className="absolute z-10 top-1 flex-col !items-start drop-shadow-md">
                                        <p className="text-tiny text-white/60 uppercase font-bold drop-shadow-md">
                                            <ReactCountryFlag
                                                className="emojiFlag"
                                                countryCode={team.country}
                                            />
                                        </p>
                                        <p className="text-tiny text-white/60 uppercase font-bold drop-shadow-md">
                                            {team.name}
                                        </p>
                                        <h4 className="text-white font-medium text-large drop-shadow-md">{team.captain}</h4>
                                    </CardHeader>
                                    <Image
                                        removeWrapper
                                        alt={team.name}
                                        className="z-0 w-full h-full object-cover"
                                        src={team.thumb}
                                    />
                                </Card>
                            </Popup>
                        </CircleMarker>

                        {/*{!isFinished && (*/}
                        {/*    <Polyline positions={teamTrack} color="blue" weight={1} />*/}
                        {/*)}*/}
                    </Fragment>
                );
            })}

            <Slider
                label={new Date(ts || 0).toLocaleString()}
                className="max-w-md z-999 absolute bottom-10 left-0 right-0 mx-auto"
                aria-label="Time"
                size="sm"
                step={6000}
                minValue={raceSetup.start.toMilliseconds()}
                maxValue={raceSetup.stop.toMilliseconds()}
                defaultValue={ts}
                // showSteps
                onChange={(value) => {
                    setSearchParams((prevValue) => {
                        prevValue.set('ts', `${value}`);
                        return prevValue;
                    });
                }}
            />
        </MapContainer>
    );
};

export default Race;
