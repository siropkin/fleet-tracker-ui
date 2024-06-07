import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSuspense } from '@data-client/react';
import {
  Button,
  Card,
  CardHeader,
  Selection,
  Slider,
  SliderValue,
  useDisclosure,
} from '@nextui-org/react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { SearchIcon } from '@icons/SearchIcon';
import { NotificationIcon } from '@icons/NotificationIcon';

import { RaceSetupResource, Tag, Team } from '@resources/RaceSetup';
import {
  RaceMoment,
  TeamPosition,
  TeamsPositionsResource,
} from '@resources/TeamsPositions';
import { TeamCard } from '@pages/Race/components/TeamCard';
import { Container } from '@pages/Race/components/Container';
import { TeamSearchBar } from '@pages/Race/components/TeamSearchBar';
import { renderToStaticMarkup } from 'react-dom/server';

const formatSliderValue = (value: SliderValue) => {
  if (!value) {
    return '';
  }
  const v = Array.isArray(value) ? value[0] : value;
  return new Date(v).toLocaleString();
};

const makeTeamMarkerIconHtml = (team: Team, index: number) => {
  return renderToStaticMarkup(
    <div
      style={{
        // width: '100%',
        // minWidth: '50px',
        // maxWidth: '100px',
        // overflow: 'hidden',
        // whiteSpace: 'nowrap',
        // textOverflow: 'ellipsis',
        backgroundColor: `#${team.colour}`,
      }}
      className="w-fit min-w-[50px] max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap text-medium text-white pr-6"
    >
      {team.name}
    </div>,
  );
};

const Race = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const raceSetup = useSuspense(RaceSetupResource.get, { id: `${id}` });
  const teamsPositions = useSuspense(TeamsPositionsResource.get, {
    id: `${id}`,
  });

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [teamIdFilterSearch, setTeamIdFilterSearch] = useState([]);

  const courseMainNodes = useMemo(
    () => raceSetup.courseMainNodes(),
    [raceSetup],
  );

  const mapBounds = useMemo(
    () => L.latLngBounds(courseMainNodes),
    [courseMainNodes],
  );

  const tsFilter = useMemo(() => {
    const value = searchParams.get('ts');
    return parseInt(value ?? '');
  }, [searchParams]);

  // const teamClassFilter = useMemo(() => {
  //   const value = searchParams.getAll('class');
  //   return value.map((v) => parseInt(v));
  // }, [searchParams]);

  const teamIdFilter = useMemo(() => {
    const value = searchParams.getAll('id');
    return value.map((v) => parseInt(v));
  }, [searchParams]);

  console.log('teamIdFilter', teamIdFilter);

  const tagsHash = useMemo(() => {
    return raceSetup.tags.reduce(
      (acc, tag: Tag) => {
        acc[tag.id] = tag;
        return acc;
      },
      {} as Record<number, Tag>,
    );
  }, [raceSetup.tags]);

  const teamsPositionsAtHash = useMemo(() => {
    return teamsPositions.reduce(
      (acc, positions: TeamPosition) => {
        acc[positions.id] = tsFilter ? positions.positionsAt(tsFilter) : [];
        return acc;
      },
      {} as Record<number, RaceMoment[]>,
    );
  }, [teamsPositions, tsFilter]);

  // const teamsFiltered = useMemo(() => {
  //   return raceSetup.teams.filter((team: Team) => {
  //     if (teamClassFilter.length) {
  //       if (!team.tags.some((tag: number) => teamClassFilter.includes(tag))) {
  //         return null;
  //       }
  //     }
  //     return team;
  //   });
  // }, [raceSetup.teams, teamClassFilter]);
  //
  // const teamsSorted = useMemo(() => {
  //   return teamsFiltered.sort((a: Team, b: Team) => {
  //     const aPositions = teamsPositionsAtHash[a.id];
  //     const bPositions = teamsPositionsAtHash[b.id];
  //
  //     if (!aPositions?.length || !bPositions?.length) {
  //       return 0;
  //     }
  //
  //     const aPosition = aPositions[aPositions.length - 1];
  //     const bPosition = bPositions[bPositions.length - 1];
  //
  //     return aPosition.dtf - bPosition.dtf;
  //   });
  // }, [teamsFiltered, teamsPositionsAtHash]);

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

  const onTeamClick = useCallback(
    (teamId: number) => {
      setSearchParams((prevValue) => {
        const ids = prevValue.getAll('id');
        const index = ids.indexOf(`${teamId}`);
        if (index === -1) {
          ids.push(`${teamId}`);
        } else {
          ids.splice(index, 1);
        }
        prevValue.delete('id');
        ids.forEach((id) => prevValue.append('id', id));
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

  // useEffect(() => {
  //   // clear id search params if a team is not in the selected class
  //   if (!teamClassFilter.length) {
  //     return;
  //   }
  //   setSearchParams((prevValue) => {
  //     const ids = prevValue.getAll('id');
  //     const newIds = ids.filter((id) => {
  //       const parsedId = parseInt(id);
  //       const team = teamsSorted.find((team: Team) => team.id === parsedId);
  //       if (!team) {
  //         return false;
  //       }
  //       return team.tags.some((tag: number) => teamClassFilter.includes(tag));
  //     });
  //     prevValue.delete('id');
  //     newIds.forEach((id) => prevValue.append('id', id));
  //     return prevValue;
  //   });
  // }, [teamsSorted, teamClassFilter, setSearchParams]);

  const raceStop = raceSetup.stopInMilliseconds();
  useEffect(() => {
    if (!tsFilter) {
      setSearchParams((prevValue) => {
        const ts = raceStop ? raceStop : Date.now();
        prevValue.set('ts', `${ts}`);
        return prevValue;
      });
      return;
    }
  }, [raceStop, setSearchParams, tsFilter]);

  return (
    <Container>
      <MapContainer
        style={{ minHeight: '100vh', minWidth: '100vw' }}
        boundsOptions={{ padding: [1, 1] }}
        bounds={mapBounds}
        scrollWheelZoom={true}
        zoomControl={false} // TODO: Turn them on to the right middle?
      >
        <Polygon
          positions={courseMainNodes}
          fillRule="nonzero"
          opacity={0.6}
          fillOpacity={0.2}
        />

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

        {raceSetup.teams.map((team: Team, index) => {
          const teamPositions = teamsPositionsAtHash[team.id];
          if (!teamPositions) {
            return null;
          }

          if (teamPositions.length === 0) {
            return null;
          }

          // const isTeamSelected =
          //   teamIdFilter.length === 0 || teamIdFilter.includes(team.id);

          const isTeamSelected =
            isOpen && teamIdFilterSearch.length
              ? teamIdFilterSearch.includes(team.id)
              : teamIdFilter.includes(team.id);

          const teamRadius = isTeamSelected ? 8 : 4;
          const teamColor = isTeamSelected ? `#${team.colour}` : 'gray';
          const teamOpacity = isTeamSelected ? 1 : 0.3;
          const teamMaxPositionsLength = isTeamSelected ? 50 : 10;

          if (teamPositions.length > teamMaxPositionsLength) {
            teamPositions.splice(
              0,
              teamPositions.length - teamMaxPositionsLength,
            );
          }
          const teamPosition = teamPositions[teamPositions.length - 1];
          const teamPositionLatLon = L.latLng(
            teamPosition.lat,
            teamPosition.lon,
          );
          const teamTrackLatLon = teamPositions.map((moment: RaceMoment) =>
            moment.toLatLng(),
          );

          const distanceLeft = raceSetup.courseDistance() - teamPosition.dtf;
          const distanceLabel =
            teamPosition.dtf > 0
              ? `${Math.round(teamPosition.dtf / 100)} NM`
              : 'Finish';

          return (
            <Fragment key={team.pk() + isTeamSelected}>
              {isTeamSelected && (
                <Marker
                  position={teamPositionLatLon}
                  opacity={teamOpacity}
                  icon={L.divIcon({
                    className: `text-xl font-bold text-white cursor-default`,
                    // html: `<div style="width: 100%; background-color: ${teamColor}">${index + 1}</div>`,
                    // iconSize: [34, 34],
                    // iconAnchor: [17, 50],
                    html: makeTeamMarkerIconHtml(team, index),
                    // iconSize: [34, 34],
                    iconAnchor: [-5, 40],
                  })}
                />
              )}

              {!!teamPosition.dtf && (
                <Polyline
                  positions={teamTrackLatLon}
                  color={teamColor}
                  opacity={teamOpacity}
                  fillOpacity={teamOpacity}
                  fillColor={teamColor}
                  weight={2}
                />
              )}

              <CircleMarker
                center={teamPositionLatLon}
                radius={teamRadius}
                color={teamColor}
                opacity={teamOpacity}
                fillColor={teamColor}
                fillOpacity={teamOpacity}
              >
                <Popup>
                  <TeamCard
                    team={team}
                    tagsHash={tagsHash}
                    distanceLabel={distanceLabel}
                    distanceLeft={distanceLeft}
                    distanceMax={raceSetup.courseDistance()}
                    onClassButtonClick={onClassButtonClick}
                    onTeamClick={onTeamClick}
                  />
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}

        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      <Button
        className="absolute z-500 top-5 left-5"
        // color="warning"
        variant="light"
        size="lg"
        aria-label="Search"
        onPress={onOpen}
        isIconOnly
      >
        <SearchIcon />
      </Button>

      <Button
        className="absolute z-500 top-5 right-5"
        // color="warning"
        variant="light"
        size="lg"
        aria-label="Notifications"
        isIconOnly
      >
        <NotificationIcon />
      </Button>

      {/*<ButtonGroup*/}
      {/*  className="absolute z-999 top-10 left-0 right-0 w-3/5 mx-auto"*/}
      {/*  size="sm"*/}
      {/*>*/}
      {/*  {raceSetup.tags*/}
      {/*    .sort((a: Tag, b: Tag) => a.sort - b.sort)*/}
      {/*    .map((tag: Tag) => {*/}
      {/*      let color;*/}
      {/*      if (teamClassFilter.length) {*/}
      {/*        color = teamClassFilter.includes(tag.id)*/}
      {/*          ? 'primary'*/}
      {/*          : 'default';*/}
      {/*      } else {*/}
      {/*        color = 'primary';*/}
      {/*      }*/}
      {/*      return (*/}
      {/*        <Button*/}
      {/*          key={tag.pk()}*/}
      {/*          color={color}*/}
      {/*          onClick={() => onClassButtonClick(tag)}*/}
      {/*        >*/}
      {/*          {tag.name}*/}
      {/*        </Button>*/}
      {/*      );*/}
      {/*    })}*/}
      {/*</ButtonGroup>*/}

      {/*<Listbox*/}
      {/*  classNames={{*/}
      {/*    base: 'absolute z-999 top-0 bottom-0 right-10 max-w-xs my-auto py-20',*/}
      {/*    list: 'max-h-full overflow-y-auto my-auto px-1',*/}
      {/*  }}*/}
      {/*  // variant="flat"*/}
      {/*  variant="faded"*/}
      {/*  label="Teams"*/}
      {/*  selectionMode="multiple"*/}
      {/*  selectedKeys={teamIdFilter.map((id) => `${id}`)}*/}
      {/*  onSelectionChange={onTeamButtonClick}*/}
      {/*>*/}
      {/*  <ListboxSection title="Teams">*/}
      {/*    {teamsSorted.map((team: Team, index: number) => (*/}
      {/*      <ListboxItem key={team.pk()} startContent={index + 1}>*/}
      {/*        {team.name}*/}
      {/*      </ListboxItem>*/}
      {/*    ))}*/}
      {/*  </ListboxSection>*/}
      {/*</Listbox>*/}

      <TeamSearchBar
        teams={raceSetup.teams}
        selectedTeams={teamIdFilter}
        tagsHash={tagsHash}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onTeamClick={onTeamClick}
        onFilteredChange={setTeamIdFilterSearch}
      />

      <Slider
        classNames={{
          base: 'absolute z-500 bottom-10 left-0 right-0 w-3/5 mx-auto',
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
        value={tsFilter}
        step={6000}
        onChange={onTimeSliderChange}
      />
    </Container>
  );
};

export default Race;
