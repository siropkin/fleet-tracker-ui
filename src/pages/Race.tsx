import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import {
  Card,
  CardHeader,
  CardFooter,
  Image,
  Progress,
  Slider,
  SliderValue,
} from '@nextui-org/react';
import ReactCountryFlag from 'react-country-flag';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Popup,
  CircleMarker,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { RaceSetupResource, Team } from '@resources/RaceSetup';
import {
  TeamsPositionsResource,
  TeamPosition,
  RaceMoment,
} from '@resources/TeamsPositions';

const formatSliderValue = (value: SliderValue) => {
  if (!value) {
    return '';
  }
  const v = Array.isArray(value) ? value[0] : value;
  return new Date(v).toLocaleString();
};

const Race = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const raceSetup = useSuspense(RaceSetupResource.get, { id: `${id}` });
  const teamsPositions = useSuspense(TeamsPositionsResource.get, {
    id: `${id}`,
  });

  const ts = useMemo(() => {
    const time = searchParams.get('ts');
    return time ? parseInt(time) : undefined;
  }, [searchParams]);

  const teamType = useMemo(() => {
    const teamClass = searchParams.get('team_type');
    return teamClass ? teamClass.toLowerCase() : undefined;
  }, [searchParams]);

  const teamId = useMemo(() => {
    const teamId = searchParams.get('team_id');
    return teamId ? parseInt(teamId) : undefined;
  }, [searchParams]);

  const teamName = useMemo(() => {
    const teamName = searchParams.get('team_name');
    return teamName ? teamName.toLowerCase() : undefined;
  }, [searchParams]);

  const courseNodes = useMemo(
    () => raceSetup.courseNodes().map((node) => node.toLatLng()),
    [raceSetup],
  );
  const courseMainNodes = useMemo(
    () => raceSetup.courseMainNodes(),
    [raceSetup],
  );
  // const courseStartNode = useMemo(() => raceSetup.courseStartNode(), [raceSetup]);

  const teams = useMemo(
    () =>
      raceSetup.teams.filter((team: Team) => {
        if (!ts) {
          return null;
        }
        if (teamType != null && team.type.toLowerCase() !== teamType) {
          return null;
        }
        if (teamId != null && team.id !== teamId) {
          return null;
        }
        if (teamName != null && team.name.toLowerCase() !== teamName) {
          return null;
        }
        return team;
      }),
    [raceSetup.teams, ts, teamType, teamId, teamName],
  );

  const teamPositionsHash = useMemo(() => {
    return teamsPositions.reduce(
      (acc, position) => {
        acc[position.id] = position;
        return acc;
      },
      {} as Record<number, TeamPosition>,
    );
  }, [teamsPositions]);

  const mapBounds = useMemo(() => {
    return L.latLngBounds(courseNodes);
  }, [courseNodes]);

  const onSliderChange = useCallback(
    (value: SliderValue) => {
      if (!value) {
        return;
      }
      const v = Array.isArray(value) ? value[0] : value;
      setSearchParams((prevValue) => {
        prevValue.set('ts', `${v}`);
        return prevValue;
      });
    },
    [setSearchParams],
  );

  const raceStop = raceSetup.stopInMilliseconds();
  useEffect(() => {
    if (ts == null) {
      setSearchParams((prevValue) => {
        const ts = raceStop ? raceStop : Date.now();
        prevValue.set('ts', `${ts}`);
        return prevValue;
      });
      return;
    }
  }, [raceStop, setSearchParams, ts]);

  return (
    <MapContainer
      style={{ minHeight: '100vh', minWidth: '100vw' }}
      boundsOptions={{ padding: [1, 1] }}
      bounds={mapBounds}
      scrollWheelZoom={true}
    >
      <Polygon positions={courseNodes} fillRule="nonzero" />

      {courseMainNodes.map((node, index) => (
        <CircleMarker
          key={index}
          center={node.toLatLng()}
          radius={5}
          color="red"
        >
          <Popup>
            <Card className="w-[200px] h-[100px]">
              <CardHeader className="bg-teal-400 w-full h-full">
                <h4 className="text-large font-medium">{node.name}</h4>
              </CardHeader>
            </Card>
          </Popup>
        </CircleMarker>
      ))}

      {teams.map((team: Team) => {
        if (!ts) {
          return null;
        }

        const teamPositions = teamPositionsHash[team.id];
        if (!teamPositions) {
          return null;
        }

        const teamTrack = teamPositions.trackAt(ts);
        if (teamTrack.length === 0) {
          return null;
        }

        if (teamTrack.length > 50) {
          teamTrack.splice(0, teamTrack.length - 50);
        }
        const teamPosition = teamTrack[teamTrack.length - 1];
        const teamPositionLatLon = L.latLng(teamPosition.lat, teamPosition.lon);
        const teamTrackLatLon = teamTrack.map((moment: RaceMoment) =>
          moment.toLatLng(),
        );

        const distanceLeft = raceSetup.courseDistance() - teamPosition.dtf;
        const distanceLabel =
          teamPosition.dtf > 0
            ? `${Math.round(teamPosition.dtf / 100)} NM`
            : 'Finish';
        return (
          <Fragment key={team.id}>
            <CircleMarker
              center={teamPositionLatLon}
              radius={8}
              color={`#${team.colour}`}
            >
              <Popup>
                <Card className="w-[310px] h-[300px]">
                  <Image
                    className="absolute top-0 bottom-0 w-full h-5/6 object-cover"
                    alt={team.name}
                    src={team.thumb}
                    removeWrapper
                    radius="none"
                  />
                  <CardHeader className="w-full h-5/6 flex-col !items-start bg-gradient-to-r from-gray-500">
                    <ReactCountryFlag
                      style={{ width: '3em', height: '3em' }}
                      countryCode={team.flag}
                      svg
                    />
                    <p className="text-tiny text-white/60 uppercase font-bold drop-shadow-xl">
                      {team.name}
                    </p>
                    <h4 className="text-white font-medium text-large drop-shadow-xl">
                      {team.captain}
                    </h4>
                    {/*<p className="text-white/60 text-tiny drop-shadow-xl">*/}
                    {/*  {team.model}*/}
                    {/*</p>*/}
                  </CardHeader>

                  <CardFooter className="w-full h-full flex !items-start ">
                    <Progress
                      classNames={{
                        base: 'w-full self-center',
                        track: 'bg-gray-300',
                      }}
                      size="sm"
                      label="Distance left"
                      aria-label="Distance left"
                      valueLabel={distanceLabel}
                      value={distanceLeft}
                      maxValue={raceSetup.courseDistance()}
                      showValueLabel={true}
                    />
                  </CardFooter>
                </Card>
              </Popup>
            </CircleMarker>

            {!!teamPosition.dtf && (
              <Polyline
                positions={teamTrackLatLon}
                color={`#${team.colour}`}
                weight={2}
              />
            )}
          </Fragment>
        );
      })}

      <Slider
        classNames={{
          base: 'absolute z-999 bottom-10 left-0 right-0 w-3/5 mx-auto',
          track: 'bg-gray-400',
          label: 'font-medium text-medium',
          value: 'font-medium text-medium',
        }}
        label="Time"
        aria-label="Time"
        size="sm"
        step={6000}
        minValue={raceSetup.startInMilliseconds()}
        maxValue={raceSetup.stopInMilliseconds()}
        defaultValue={ts}
        getValue={formatSliderValue}
        onChange={onSliderChange}
      />

      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default Race;
