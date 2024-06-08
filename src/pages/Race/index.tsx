import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSuspense } from '@data-client/react';
import {
  Button,
  Card,
  CardHeader,
  Chip,
  Input,
  Link,
  Selection,
  Slider,
  SliderValue,
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

import { RaceSetupResource, Tag, Team } from '@resources/RaceSetup';
import {
  RaceMoment,
  TeamPosition,
  TeamsPositionsResource,
} from '@resources/TeamsPositions';

import { SearchIcon } from '@icons/SearchIcon';
import { NotificationIcon } from '@icons/NotificationIcon';
import { EyeIcon } from '@icons/EyeIcon';

import {
  Sidebar,
  SidebarBody,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useDisclosure,
} from '@components/Sidebar.tsx';

import { TeamCard } from './components/TeamCard';

const watchlistTagId = 'watchlist';

const formatSliderValue = (value: SliderValue) => {
  if (!value) {
    return '';
  }
  const v = Array.isArray(value) ? value[0] : value;
  return new Date(v).toLocaleString();
};

const makeTeamMarkerIconHtml = (team: Team) => {
  return renderToStaticMarkup(
    <div
      style={{ backgroundColor: `#${team.colour}` }}
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

  const [teamsSearchText, setTeamsSearchText] = useState('' as string);
  const [teamsSearchTags, setTeamsSearchTags] = useState(
    Array<number | string>,
  );
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const courseMainNodes = useMemo(
    () => raceSetup.courseMainNodes(),
    [raceSetup],
  );

  const mapBounds = useMemo(
    () => L.latLngBounds(courseMainNodes),
    [courseMainNodes],
  );

  const ts = useMemo(() => {
    const value = searchParams.get('ts');
    return parseInt(value ?? '');
  }, [searchParams]);

  const watchlist = useMemo(() => {
    const value = searchParams.getAll('id');
    return value.map((v) => parseInt(v));
  }, [searchParams]);

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
        acc[positions.id] = ts ? positions.positionsAt(ts) : [];
        return acc;
      },
      {} as Record<number, RaceMoment[]>,
    );
  }, [teamsPositions, ts]);

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

  const teamsSearchResult = useMemo(() => {
    if (!teamsSearchText && !teamsSearchTags.length) {
      return raceSetup.teams.map((team: Team) => team.id);
    }
    const textFilterFixed = teamsSearchText.trim().toLowerCase();
    return raceSetup.teams.reduce((acc: number[], team: Team) => {
      let textMatch = !textFilterFixed;
      let tagsMatch = !teamsSearchTags.length;

      if (
        !textMatch &&
        textFilterFixed &&
        team.name.toLowerCase().includes(textFilterFixed)
      ) {
        textMatch = true;
      }

      if (
        !textMatch &&
        textFilterFixed &&
        team.captain.toLowerCase().includes(textFilterFixed)
      ) {
        textMatch = true;
      }

      if (
        !textMatch &&
        textFilterFixed &&
        team.country.toLowerCase().includes(textFilterFixed)
      ) {
        textMatch = true;
      }

      if (
        !textMatch &&
        textFilterFixed &&
        team.flag.toLowerCase().includes(textFilterFixed)
      ) {
        textMatch = true;
      }

      if (
        !textMatch &&
        textFilterFixed &&
        team.model.toLowerCase().includes(textFilterFixed)
      ) {
        textMatch = true;
      }

      const checkForWatchlist =
        teamsSearchTags.length && teamsSearchTags.includes(watchlistTagId);
      const searchTags = teamsSearchTags.filter(
        (tag) => tag !== watchlistTagId,
      );

      if (!tagsMatch && checkForWatchlist) {
        tagsMatch = watchlist.includes(team.id);
      }

      if (!tagsMatch && searchTags.length) {
        tagsMatch = team.tags.some((tag: number) => searchTags.includes(tag));
      }

      if (textMatch && tagsMatch) {
        acc.push(team.id);
      }

      return acc;
    }, []);
  }, [raceSetup.teams, watchlist, teamsSearchTags, teamsSearchText]);

  const onTeamSearchTagClick = useCallback((tagId: number | string) => {
    setTeamsSearchTags((prevValue) => {
      const next = [...prevValue];
      const index = next.indexOf(tagId);
      if (index === -1) {
        next.push(tagId);
      } else {
        next.splice(index, 1);
      }
      return next;
    });
  }, []);

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
    if (!ts) {
      setSearchParams((prevValue) => {
        const ts = raceStop ? raceStop : Date.now();
        prevValue.set('ts', `${ts}`);
        return prevValue;
      });
      return;
    }
  }, [raceStop, setSearchParams, ts]);

  console.log(raceSetup);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        style={{ minHeight: '100vh', minWidth: '100vw' }}
        boundsOptions={{ padding: [1, 1] }}
        bounds={mapBounds}
        scrollWheelZoom={true}
        zoomControl={false} // TODO: Turn them on to the right middle?
        attributionControl={false}
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

        {raceSetup.teams.map((team: Team) => {
          const teamPositionsAt = teamsPositionsAtHash[team.id];
          if (!teamPositionsAt?.length) {
            return null;
          }

          const isTeamSelected = isOpen
            ? teamsSearchResult.includes(team.id)
            : watchlist.includes(team.id);

          const teamRadius = isTeamSelected ? 8 : 4;
          const teamColor = isTeamSelected ? `#${team.colour}` : 'gray';
          const teamOpacity = isTeamSelected ? 1 : 0.3;
          const teamMaxPositionsLength = isTeamSelected ? 50 : 10;

          if (teamPositionsAt.length > teamMaxPositionsLength) {
            teamPositionsAt.splice(
              0,
              teamPositionsAt.length - teamMaxPositionsLength,
            );
          }
          const teamPosition = teamPositionsAt[teamPositionsAt.length - 1];
          const teamPositionLatLon = L.latLng(
            teamPosition.lat,
            teamPosition.lon,
          );
          const teamTrackLatLon = teamPositionsAt.map((moment: RaceMoment) =>
            moment.toLatLng(),
          );

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
                    html: makeTeamMarkerIconHtml(team),
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
                    position={teamPosition}
                    courseDistance={raceSetup.courseDistance()}
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

      <Link
        className="absolute z-500 top-5 left-5 h-12 flex items-center text-2xl"
        href={raceSetup.logo.href}
        color="foreground"
        isExternal
      >
        {raceSetup.title}
      </Link>

      <div className="absolute z-500 top-5 right-5 flex gap-4 items-center">
        <Button
          color="default"
          variant="light"
          size="lg"
          aria-label="Search"
          onPress={onOpen}
          isIconOnly
        >
          <SearchIcon />
        </Button>

        <Button
          color="default"
          variant="light"
          size="lg"
          aria-label="Notifications"
          onPress={() => {}}
          isIconOnly
        >
          <NotificationIcon />
        </Button>
      </div>

      <Sidebar
        classNames={{
          wrapper: 'z-500',
          body: 'overflow-y-auto',
        }}
        backdrop="opaque"
        placement="right"
        size="5xl"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideCloseButton
      >
        <SidebarContent>
          {(onClose) => (
            <Fragment>
              <SidebarHeader className="flex flex-col gap-4">
                <Input
                  size="lg"
                  placeholder="Search"
                  startContent={<SearchIcon />}
                  value={teamsSearchText}
                  onValueChange={setTeamsSearchText}
                  isClearable
                />
                <div className="flex flex-wrap gap-4">
                  <Chip
                    className="cursor-pointer"
                    color={
                      teamsSearchTags.includes(watchlistTagId)
                        ? 'primary'
                        : 'default'
                    }
                    variant="flat"
                    endContent={<EyeIcon />}
                    onClick={() => onTeamSearchTagClick(watchlistTagId)}
                  >
                    Watchlist
                  </Chip>
                  {raceSetup.tags
                    .sort((a: Tag, b: Tag) => a.name.localeCompare(b.name))
                    .map((tag: Tag) => (
                      <Chip
                        key={tag.pk()}
                        className="cursor-pointer"
                        color={
                          teamsSearchTags.includes(tag.id)
                            ? 'primary'
                            : 'default'
                        }
                        variant="flat"
                        onClick={() => onTeamSearchTagClick(tag.id)}
                      >
                        {tag.name}
                      </Chip>
                    ))}
                </div>
              </SidebarHeader>
              <SidebarBody>
                <div className="flex flex-row flex-wrap !gap-4">
                  {raceSetup.teams.map((team: Team) => {
                    if (!teamsSearchResult.includes(team.id)) {
                      return null;
                    }
                    const teamPositionsAt = teamsPositionsAtHash[team.id];
                    if (!teamPositionsAt?.length) {
                      return null;
                    }
                    return (
                      <TeamCard
                        key={team.pk()}
                        team={team}
                        tagsHash={tagsHash}
                        position={teamPositionsAt[teamPositionsAt.length - 1]}
                        courseDistance={raceSetup.courseDistance()}
                        onTeamClick={onTeamClick}
                      />
                    );
                  })}
                </div>
              </SidebarBody>
              <SidebarFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Close
                </Button>
                {/*<Button color="primary" onPress={onClose}>*/}
                {/*  Action*/}
                {/*</Button>*/}
              </SidebarFooter>
            </Fragment>
          )}
        </SidebarContent>
      </Sidebar>

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

      {/*<TeamSearchBar*/}
      {/*  teams={raceSetup.teams}*/}
      {/*  selectedTeams={teamIdFilter}*/}
      {/*  tagsHash={tagsHash}*/}
      {/*  isOpen={isOpen}*/}
      {/*  onOpenChange={onOpenChange}*/}
      {/*  onTeamClick={onTeamClick}*/}
      {/*  onFilteredChange={setTeamIdFilterSearch}*/}
      {/*/>*/}

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
        value={ts}
        step={6000}
        onChange={onTimeSliderChange}
      />
    </div>
  );
};

export default Race;
