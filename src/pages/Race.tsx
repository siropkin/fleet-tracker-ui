import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardFooter,
  Image,
  Progress,
  Slider,
  SliderValue,
  Listbox,
  ListboxItem,
  ListboxSection,
  Selection,
} from '@nextui-org/react';
import ReactCountryFlag from 'react-country-flag';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Popup,
  CircleMarker,
  Marker,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { RaceSetupResource, Tag, Team } from '@resources/RaceSetup';
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

  const courseMainNodes = useMemo(
    () => raceSetup.courseMainNodes(),
    [raceSetup],
  );
  const mapBounds = useMemo(
    () => L.latLngBounds(courseMainNodes),
    [courseMainNodes],
  );

  const teamPositionsHash = useMemo(() => {
    return teamsPositions.reduce(
      (acc, positions: TeamPosition) => {
        acc[positions.id] = positions;
        acc[positions.id].moments.sort(
          (a: RaceMoment, b: RaceMoment) => a.at - b.at,
        );
        return acc;
      },
      {} as Record<number, TeamPosition>,
    );
  }, [teamsPositions]);

  const ts = useMemo(() => {
    const value = searchParams.get('ts');
    return value ? parseInt(value) : undefined;
  }, [searchParams]);

  const teamClasses = useMemo(() => {
    const value = searchParams.getAll('class');
    return value.map((v) => parseInt(v));
  }, [searchParams]);

  const teamIds = useMemo(() => {
    const value = searchParams.getAll('id');
    return value.map((v) => parseInt(v));
  }, [searchParams]);

  const teams = useMemo(() => {
    // TODO: Not optimal code
    const value = raceSetup.teams.filter((team: Team) => {
      if (teamClasses.length) {
        if (!team.tags.some((tag: number) => teamClasses.includes(tag))) {
          return null;
        }
      }
      return team;
    });

    return value.sort((a: Team, b: Team) => {
      if (!ts) {
        return 0;
      }

      const aPositions = teamPositionsHash[a.id];
      const bPositions = teamPositionsHash[b.id];
      if (!aPositions || !bPositions) {
        return 0;
      }

      const aTrack = aPositions.trackAt(ts);
      const bTrack = bPositions.trackAt(ts);

      const aPosition = aTrack[aTrack.length - 1];
      const bPosition = bTrack[bTrack.length - 1];

      return aPosition.dtf - bPosition.dtf;
    });
  }, [raceSetup.teams, teamClasses, teamPositionsHash, ts]);

  const onClassButtonClick = useCallback(
    (tag: Tag) => {
      setSearchParams((prevValue) => {
        const classes = prevValue.getAll('class');
        const index = classes.indexOf(`${tag.id}`);
        if (index === -1) {
          classes.push(`${tag.id}`);
        } else {
          classes.splice(index, 1);
        }
        prevValue.delete('class');
        classes.forEach((c) => prevValue.append('class', c));
        return prevValue;
      });
    },
    [setSearchParams],
  );

  const onTeamButtonClick = useCallback(
    (teamIds: Selection) => {
      setSearchParams((prevValue) => {
        prevValue.delete('id');
        [...teamIds].forEach((id) => prevValue.append('id', `${id}`));
        return prevValue;
      });
    },
    [setSearchParams],
  );

  const onTimeSliderChange = useCallback(
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
    // clear id search params if a team is not in the selected class
    if (!teamClasses.length) {
      return;
    }
    setSearchParams((prevValue) => {
      const ids = prevValue.getAll('id');
      const newIds = ids.filter((id) => {
        const parsedId = parseInt(id);
        const team = teams.find((team: Team) => team.id === parsedId);
        if (!team) {
          return false;
        }
        return team.tags.some((tag: number) => teamClasses.includes(tag));
      });
      prevValue.delete('id');
      newIds.forEach((id) => prevValue.append('id', id));
      return prevValue;
    });
  }, [teams, teamClasses, setSearchParams]);

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
      <Polygon positions={courseMainNodes} fillRule="nonzero" />

      {courseMainNodes.map((node, index) => (
        <CircleMarker key={index} center={node.toLatLng()} radius={5}>
          <Popup>
            <Card className="w-[210px] h-[100px]">
              <CardHeader className="w-full h-full">
                <h4 className="text-large font-medium">{node.name}</h4>
              </CardHeader>
            </Card>
          </Popup>
        </CircleMarker>
      ))}

      {teams.map((team: Team, index) => {
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

        const isTeamSelected =
          teamIds.length === 0 || teamIds.includes(team.id);
        const teamRadius = isTeamSelected ? 8 : 6;
        const teamColor = isTeamSelected ? `#${team.colour}` : 'gray';
        const teamOpacity = isTeamSelected ? 1 : 0.3;

        return (
          <Fragment key={team.pk() + isTeamSelected}>
            <Marker
              position={teamPositionLatLon}
              opacity={teamOpacity}
              icon={L.divIcon({
                className: 'text-xl font-bold text-white cursor-default',
                html: `<div style="width: 100%; background-color: ${teamColor}">${index + 1}</div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 50],
              })}
            />

            <CircleMarker
              center={teamPositionLatLon}
              radius={teamRadius}
              color={teamColor}
              opacity={teamOpacity}
              fillColor={teamColor}
              fillOpacity={teamOpacity}
            >
              <Popup>
                <Card className="w-[310px] h-[300px] border-transparent">
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

                  <CardFooter className="w-full h-full flex !items-start border-transparent">
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
                className="team-track"
                positions={teamTrackLatLon}
                color={teamColor}
                opacity={teamOpacity}
                fillOpacity={teamOpacity}
                fillColor={teamColor}
                weight={2}
              />
            )}
          </Fragment>
        );
      })}

      <ButtonGroup
        className="absolute z-999 top-10 left-0 right-0 w-3/5 mx-auto"
        size="sm"
      >
        {raceSetup.tags
          .sort((a: Tag, b: Tag) => a.sort - b.sort)
          .map((tag: Tag) => {
            let color;
            if (teamClasses.length) {
              color = teamClasses.includes(tag.id) ? 'primary' : 'default';
            } else {
              color = 'primary';
            }
            return (
              <Button
                key={tag.pk()}
                color={color}
                onClick={() => onClassButtonClick(tag)}
              >
                {tag.name}
              </Button>
            );
          })}
      </ButtonGroup>

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
        getValue={formatSliderValue}
        minValue={raceSetup.startInMilliseconds()}
        maxValue={raceSetup.stopInMilliseconds()}
        value={ts}
        step={6000}
        onChange={onTimeSliderChange}
      />

      <Listbox
        classNames={{
          base: 'absolute z-999 top-0 bottom-0 right-10 max-w-xs my-auto py-20',
          list: 'max-h-full overflow-y-auto my-auto px-1',
        }}
        // variant="flat"
        variant="faded"
        label="Teams"
        selectionMode="multiple"
        selectedKeys={teamIds.map((id) => `${id}`)}
        onSelectionChange={onTeamButtonClick}
      >
        <ListboxSection title="Teams">
          {teams.map((team: Team, index: number) => (
            <ListboxItem key={team.pk()} startContent={index + 1}>
              {team.name}
            </ListboxItem>
          ))}
        </ListboxSection>
      </Listbox>

      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default Race;
