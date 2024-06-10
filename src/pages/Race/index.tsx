import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSuspense, useSubscription } from '@data-client/react';
import {
  Button,
  Card,
  CardHeader,
  Chip,
  Input,
  Link,
  Listbox,
  ListboxItem,
  ListboxSection,
  Slider,
  SliderValue,
  Tab,
  Tabs,
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
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { RaceSetupResource, Tag, Team } from '@resources/RaceSetup';
import {
  RaceMoment,
  TeamPosition,
  TeamsPositionsAllResource,
  TeamsPositionsLatestResource,
} from '@resources/TeamsPositions';

import { SearchIcon } from '@icons/SearchIcon';
import { NotificationIcon } from '@icons/NotificationIcon';
import { EyeIcon } from '@icons/EyeIcon';
import { ShareIcon } from '@icons/ShareIcon';

import { distanceBetweenPoints } from '@utils/distanceBetweenPoints';

import { TeamCard } from './components/TeamCard';
import { TeamSearch } from './components/TeamSearch';

const TIME_SEARCH_PARAM = 'time';
const TEAM_SEARCH_PARAM = 'team';
const CLASS_SEARCH_PARAM = 'class';

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

const FlyToButton = ({ position, onClick, ...tail }) => {
  const map = useMap();
  const doClick = useCallback(() => {
    map.flyTo(position, 10, { animate: false });
    onClick?.();
  }, [map, position, onClick]);

  return <Button {...tail} onClick={doClick} />;
};

const FlyToOn = '';

const Race = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const raceSetup = useSuspense(RaceSetupResource.get, { id: `${id}` });
  const teamsPositions = useSuspense(TeamsPositionsAllResource.get, {
    id: `${id}`,
  });
  // TODO: Do not subscribe if race is finished
  useSubscription(TeamsPositionsLatestResource.get, {
    id: `${id}`,
  });

  const {
    isOpen: isTeamSearchOpen,
    onOpen: onTeamSearchOpen,
    onOpenChange: onTeamSearchOpenChange,
  } = useDisclosure();

  const [map, setMap] = useState();

  const courseMainNodes = useMemo(
    () => raceSetup.courseMainNodes(),
    [raceSetup],
  );

  const mapBounds = useMemo(
    () => L.latLngBounds(courseMainNodes),
    [courseMainNodes],
  );

  const timeToWatchTs = useMemo(() => {
    const value = searchParams.get(TIME_SEARCH_PARAM);
    return parseInt(value ?? '');
  }, [searchParams]);

  const teamToWatchId = useMemo(() => {
    const value = searchParams.get(TEAM_SEARCH_PARAM);
    return parseInt(value ?? '');
  }, [searchParams]);

  const classToWatchId = useMemo(() => {
    const value = searchParams.get(CLASS_SEARCH_PARAM);
    return parseInt(value ?? '');
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

  const teamsToWatchFixed = useMemo(() => {
    if (!timeToWatchTs || !classToWatchId) {
      return [];
    }
    return raceSetup.teams.reduce((acc, team: Team) => {
      if (!team.tags.includes(classToWatchId)) {
        return acc;
      }
      const moments = teamsPositions
        .find((positions: TeamPosition) => positions.id === team.id)
        ?.positionsAt(timeToWatchTs);
      if (!moments) {
        return null;
      }
      team.moments = moments;
      acc.push(team);
      return acc;
    }, []);
  }, [classToWatchId, raceSetup.teams, teamsPositions, timeToWatchTs]);

  const teamToWatch = useMemo(() => {
    return teamsToWatchFixed.find((team: Team) => team.id === teamToWatchId);
  }, [teamToWatchId, teamsToWatchFixed]);

  const leaderBoard = useMemo(() => {
    return teamsToWatchFixed.sort((a: Team, b: Team) => {
      const aMoments = a.moments;
      const bMoments = b.moments;

      if (!aMoments?.length || !bMoments?.length) {
        return 0;
      }

      const aCurrentPosition = aMoments[aMoments.length - 1];
      const bCurrentPosition = bMoments[bMoments.length - 1];

      return aCurrentPosition.dtf - bCurrentPosition.dtf;
    });
  }, [teamsToWatchFixed]);

  // const positionsAtHash = useMemo(() => {
  //   return teamsPositions.reduce(
  //     (acc, positions: TeamPosition) => {
  //       acc[positions.id] = timeToWatchTs
  //         ? positions.positionsAt(timeToWatchTs)
  //         : [];
  //       return acc;
  //     },
  //     {} as Record<number, RaceMoment[]>,
  //   );
  // }, [teamsPositions, timeToWatchTs]);

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

  const onTeamToWatchChange = useCallback(
    (value: Team) => {
      setSearchParams((prevValue) => {
        prevValue.set(TEAM_SEARCH_PARAM, `${value.id}`);
        prevValue.set(CLASS_SEARCH_PARAM, `${value.tags[0]}`);
        return prevValue;
      });
    },
    [setSearchParams],
  );

  const onClassToWatchChange = useCallback(
    (value: number) => {
      console.log('onClassToWatchChange', value);
      setSearchParams((prevValue) => {
        prevValue.set(CLASS_SEARCH_PARAM, `${value}`);
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
      const nextValue = Array.isArray(value) ? value[0] : value;
      setSearchParams((prevValue) => {
        prevValue.set(TIME_SEARCH_PARAM, `${nextValue}`);
        return prevValue;
      });
    },
    [setSearchParams],
  );

  const onFlyToTeam = useCallback(
    (team) => {
      if (!map || !team.moments?.length) {
        return;
      }
      const currentPosition = team.moments[team.moments.length - 1];
      const currentPositionLatLon = L.latLng(
        currentPosition.lat,
        currentPosition.lon,
      );
      map.flyTo(currentPositionLatLon, 10, { animate: false });
    },
    [map],
  );

  useEffect(() => {
    if (!raceSetup.teams?.length || !!teamToWatch) {
      return undefined;
    }
    onTeamSearchOpen();
  }, [raceSetup.teams, teamToWatch, onTeamSearchOpen]);

  useEffect(() => {
    if (timeToWatchTs) {
      return;
    }

    const nextValue = raceSetup.start ? raceSetup.start * 1000 : Date.now();
    setSearchParams((prevValue) => {
      prevValue.set(TIME_SEARCH_PARAM, `${nextValue}`);
      return prevValue;
    });
  }, [raceSetup.start, setSearchParams, timeToWatchTs]);

  useEffect(() => {
    if (!raceSetup.teams?.length || !!teamToWatch || classToWatchId) {
      return undefined;
    }

    const nextValue = teamToWatch.tags[0];
    setSearchParams((prevValue) => {
      prevValue.set(CLASS_SEARCH_PARAM, `${nextValue}`);
      return prevValue;
    });
  }, [classToWatchId, teamToWatch, setSearchParams, raceSetup.teams]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        ref={setMap}
        style={{ minHeight: '100vh', minWidth: '100vw' }}
        boundsOptions={{ padding: [1, 1] }}
        bounds={mapBounds}
        scrollWheelZoom={true}
        zoomControl={false} // TODO: Turn them on to the right middle?
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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

        {teamsToWatchFixed.map((team: Team) => {
          // const isInWatchlist = team.id === teamToWatchId;
          const isInWatchlist = true;

          // const isSelected = isTeamSearchOpen
          //   ? teamsSearchResult.includes(team.id)
          //   : isInWatchlist;

          const isSelected = teamToWatch?.id === team.id;

          const radius = isSelected ? 8 : 4;
          const color = isSelected ? `#${team.colour}` : 'gray';
          const opacity = isSelected ? 1 : 0.3;
          const maxMomentsLength = isSelected ? 50 : 10;
          const moments = [...team.moments];
          if (!moments.length) {
            return null;
          }
          if (moments.length > maxMomentsLength) {
            moments.splice(0, moments.length - maxMomentsLength);
          }
          const currentPosition = moments[moments.length - 1];
          const prevPosition =
            moments.length > 1 ? moments[moments.length - 2] : currentPosition;
          // const distanceBetweenPositions = distanceBetweenPoints(
          //   currentPosition,
          //   prevPosition,
          // );
          // const timeBetweenPositions = currentPosition.at - prevPosition.at;
          // const speed =
          //   (distanceBetweenPositions / timeBetweenPositions) * 1000;

          const currentPositionLatLon = L.latLng(
            currentPosition.lat,
            currentPosition.lon,
          );

          const trackLatLon = moments.map((moment: RaceMoment) =>
            moment.toLatLng(),
          );

          return (
            <Fragment key={team.pk() + isSelected}>
              {isSelected && (
                <Marker
                  position={currentPositionLatLon}
                  opacity={opacity}
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

              {!!currentPosition.distanceToFinish() && (
                <Polyline
                  positions={trackLatLon}
                  color={color}
                  opacity={opacity}
                  fillOpacity={opacity}
                  fillColor={color}
                  weight={2}
                />
              )}

              <CircleMarker
                center={currentPositionLatLon}
                radius={radius}
                color={color}
                opacity={opacity}
                fillColor={color}
                fillOpacity={opacity}
              >
                <Popup>
                  <TeamCard
                    team={team}
                    // position={currentPosition}
                    // speed={speed}
                    // courseDistance={raceSetup.courseDistance()}
                    // isInWatchlist={isInWatchlist}
                    onCardPress={() => onTeamToWatchChange(team)}
                  />
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>

      <div className="absolute z-500 top-5 left-5 h-12 flex flex-row items-center gap-4 ">
        <Link
          className="text-2xl"
          href={raceSetup.logo.href}
          color="foreground"
          isExternal
        >
          {raceSetup.title}
        </Link>

        {!!teamToWatch && (
          <Fragment>
            <div className="text-2xl">\</div>
            <Button
              className="text-2xl"
              color="default"
              variant="light"
              // size="sm"
              aria-label="Fly to"
              onPress={() => onFlyToTeam(teamToWatch)}
            >
              {teamToWatch?.name}
            </Button>
          </Fragment>
        )}
      </div>

      <div className="absolute z-500 top-5 right-5 flex gap-4 items-center">
        <Button
          color="default"
          variant="light"
          size="lg"
          aria-label="Search"
          onPress={onTeamSearchOpen}
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

        <Button
          color="default"
          variant="light"
          size="lg"
          aria-label="Share"
          onPress={() => {}}
          isIconOnly
        >
          <ShareIcon />
        </Button>
      </div>

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

      {teamToWatch && (
        <div className="absolute z-500 top-[50%] left-5 -translate-y-2/4 flex flex-col overflow-y-auto max-h-[70%]">
          <Tabs
            aria-label="Classes"
            selectedKey={`${classToWatchId}`}
            onSelectionChange={onClassToWatchChange}
          >
            {teamToWatch?.tags.map((id: number) => {
              const tag = tagsHash[id];
              return <Tab key={tag.pk()} title={tag.name} />;
            })}
          </Tabs>

          <Listbox
            classNames={{
              // base: 'absolute z-500 top-0 bottom-0 right-10 max-w-xs my-auto py-20',
              base: 'max-w-xs my-auto py-20',
              list: 'max-h-full overflow-y-auto my-auto px-1',
            }}
            // variant="flat"
            variant="faded"
            label="Teams"
            // selectionMode="multiple"
            // selectedKeys={teamIdFilter.map((id) => `${id}`)}
            selectedKeys={teamToWatch ? teamToWatch.pk() : ''}
            // onSelectionChange={onTeamButtonClick}
            onSelectionChange={onTeamToWatchChange}
            onChange={onTeamToWatchChange}
          >
            <ListboxSection title="Leaderboard">
              {leaderBoard.map((team: Team, index: number) => (
                <ListboxItem key={team.pk()} startContent={index + 1}>
                  {team.name}
                </ListboxItem>
              ))}
            </ListboxSection>
          </Listbox>
        </div>
      )}

      {/*<TeamSearchBar*/}
      {/*  teams={raceSetup.teams}*/}
      {/*  selectedTeams={teamIdFilter}*/}
      {/*  tagsHash={tagsHash}*/}
      {/*  isTeamSearchOpen={isTeamSearchOpen}*/}
      {/*  onTeamSearchOpenChange={onTeamSearchOpenChange}*/}
      {/*  onTeamClick={onTeamClick}*/}
      {/*  onFilteredChange={setTeamIdFilterSearch}*/}
      {/*/>*/}

      <TeamSearch
        teams={raceSetup.teams}
        classes={raceSetup.tags}
        activeTeam={teamToWatch?.id}
        isOpen={isTeamSearchOpen}
        onOpenChange={onTeamSearchOpenChange}
        onTeamClick={onTeamToWatchChange}
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
        value={timeToWatchTs}
        step={6000}
        onChange={onTimeSliderChange}
      />
    </div>
  );
};

export default Race;
