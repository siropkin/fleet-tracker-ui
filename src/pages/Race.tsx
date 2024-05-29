import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import {
  Card,
  CardHeader,
  Image,
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

  useEffect(() => {
    if (ts == null) {
      setSearchParams((prevValue) => {
        const ts = raceSetup.stop.toMilliseconds()
          ? raceSetup.stop.toMilliseconds()
          : Date.now();
        prevValue.set('ts', `${ts}`);
        return prevValue;
      });
      return;
    }
  }, [raceSetup.stop, setSearchParams, ts]);

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
            <span>{node.name}</span>
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

        const isFinished = team.finishedAt * 1000 < ts;

        return (
          <Fragment key={team.id}>
            <CircleMarker center={teamPositionLatLon} radius={5} color="blue">
              <Popup>
                <Card className="col-span-12 sm:col-span-4 h-[300px] w-[300px]">
                  <CardHeader className="absolute z-10 top-1 flex-col !items-start drop-shadow-md">
                    <ReactCountryFlag
                      style={{ width: '3em', height: '3em' }}
                      countryCode={team.flag}
                      svg
                    />
                    <p className="text-tiny text-white/60 uppercase font-bold drop-shadow-md">
                      {team.name}
                    </p>
                    <h4 className="text-white font-medium text-large drop-shadow-md">
                      {team.captain}
                    </h4>
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

            {!isFinished && (
              <Polyline positions={teamTrackLatLon} color="blue" weight={1} />
            )}
          </Fragment>
        );
      })}

      <Slider
        className="absolute z-999 bottom-10 left-0 right-0 mx-auto max-w-md"
        label="Time"
        aria-label="Time"
        size="sm"
        step={6000}
        minValue={raceSetup.start.toMilliseconds()}
        maxValue={raceSetup.stop.toMilliseconds()}
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
