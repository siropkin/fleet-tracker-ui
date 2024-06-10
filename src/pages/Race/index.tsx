import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSuspense, useSubscription } from '@data-client/react';
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Listbox,
  ListboxItem,
  ListboxSection,
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

import { RaceSetupResource, Tag, Team } from '@resources/RaceSetup';
import {
  RaceMoment,
  TeamPosition,
  TeamsPositionsAllResource,
  TeamsPositionsLatestResource,
} from '@resources/TeamsPositions';

import { SearchIcon } from '@icons/SearchIcon';
import { NotificationIcon } from '@icons/NotificationIcon';
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

  const teamsToWatch = useMemo(() => {
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

  const leaderBoard = useMemo(() => {
    return teamsToWatch.sort((a: Team, b: Team) => {
      const aMoments = a.moments;
      const bMoments = b.moments;

      if (!aMoments?.length || !bMoments?.length) {
        return 0;
      }

      const aCurrentPosition = aMoments[aMoments.length - 1];
      const bCurrentPosition = bMoments[bMoments.length - 1];

      return aCurrentPosition.dtf - bCurrentPosition.dtf;
    });
  }, [teamsToWatch]);

  const teamToWatch = useMemo(() => {
    return teamsToWatch.find((team: Team) => team.id === teamToWatchId);
  }, [teamToWatchId, teamsToWatch]);

  const teamToWatchCurrentPosition = useMemo(() => {
    return teamToWatch?.moments[teamToWatch.moments.length - 1];
  }, [teamToWatch?.moments]);

  const teamToWatchProgress = useMemo(() => {
    if (!teamToWatchCurrentPosition) {
      return 0;
    }
    const maxDistance = raceSetup.course.distance;
    const currentDistance = maxDistance - teamToWatchCurrentPosition.dtf / 1000;
    return currentDistance / maxDistance;
  }, [raceSetup, teamToWatchCurrentPosition]);

  const teamToWatchSpeed = useMemo(() => {
    if (!teamToWatch?.moments?.length) {
      return 0;
    }
    const currentPosition = teamToWatch.moments[teamToWatch.moments.length - 1];
    const prevPosition =
      teamToWatch.moments.length > 1
        ? teamToWatch.moments[teamToWatch.moments.length - 2]
        : currentPosition;
    const distanceBetweenPositions = distanceBetweenPoints(
      currentPosition,
      prevPosition,
    );
    const timeBetweenPositions = currentPosition.at - prevPosition.at;
    if (!timeBetweenPositions) {
      return 0;
    }
    return (distanceBetweenPositions / timeBetweenPositions) * 1000;
  }, [teamToWatch.moments]);

  const teamToWatchLeaderBoardPosition = useMemo(() => {
    if (!teamToWatchId) {
      return 0;
    }
    return leaderBoard.findIndex((team) => teamToWatchId === team.id);
  }, [leaderBoard, teamToWatchId]);

  const onTeamToWatchChange = useCallback(
    (value: Team) => {
      setSearchParams((prevValue) => {
        prevValue.set(TEAM_SEARCH_PARAM, `${value.id}`);
        // prevValue.set(CLASS_SEARCH_PARAM, `${value.tags[0]}`);
        return prevValue;
      });
    },
    [setSearchParams],
  );

  const onClassToWatchChange = useCallback(
    (value: number) => {
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
    teamToWatchCurrentPosition && onFlyToTeam(teamToWatch);
  }, [teamToWatchCurrentPosition, onFlyToTeam, teamToWatch]);

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
    if (!raceSetup.teams?.length || !teamToWatch || classToWatchId) {
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

        {teamsToWatch.map((team: Team) => {
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

      {teamToWatch && (
        <div className="absolute z-500 top-5 left-5 flex flex-col gap-8 max-h-[50%] overflow-hidden">
          <div className="flex items-end gap-1">
            <div className="text-2xl uppercase">Pos</div>
            <div className="text-8xl">{teamToWatchLeaderBoardPosition + 1}</div>
            <div className="text-2xl">/</div>
            <div className="text-2xl">{leaderBoard.length}</div>
          </div>

          <Listbox
            classNames={{
              base: 'overflow-y-auto p-0',
            }}
            variant="flat"
            label="Leaderboard"
          >
            <ListboxSection>
              {leaderBoard.map((team: Team, index: number) => (
                <ListboxItem
                  key={team.pk()}
                  classNames={{
                    base: `px-0 text-2xl ${teamToWatch?.id === team.id ? 'bg-cyan-500' : ''}`,
                    title: 'text-2xl',
                  }}
                  startContent={index + 1}
                  onPress={() => onTeamToWatchChange(team)}
                >
                  {team.name}
                </ListboxItem>
              ))}
            </ListboxSection>
          </Listbox>
        </div>
      )}

      {teamToWatch && (
        <div className="absolute z-500 top-5 right-5 flex flex-col">
          <div className="flex flex-row items-end  gap-1">
            <div className="text-2xl uppercase">Progress</div>
            <div className="text-8xl">
              {Math.round(teamToWatchProgress * 100)}%
            </div>
          </div>
        </div>
      )}

      {teamToWatch && (
        <div className="absolute z-500 bottom-5 right-5 flex flex-col">
          <div className="flex flex-row items-end  gap-1">
            <div className="text-2xl uppercase">Speed</div>
            <div className="text-8xl">
              {Math.round(teamToWatchSpeed * 10) / 10} kts
            </div>
          </div>
        </div>
      )}

      <div className="absolute z-500 top-5 right-[50%] translate-x-[50%] flex flex-col gap-2">
        <div className="flex flex-row items-end">
          <Link
            className="text-8xl"
            href={raceSetup.logo.href}
            color="foreground"
            isExternal
          >
            {raceSetup.title}
          </Link>

          <Dropdown>
            <DropdownTrigger>
              <div className="text-2xl cursor-pointer">
                / {tagsHash[classToWatchId]?.name}
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Classes">
              {teamToWatch?.tags.map((id: number) => {
                const tag = tagsHash[id];
                return (
                  <DropdownItem
                    key={tag.pk()}
                    onClick={() => onClassToWatchChange(id)}
                  >
                    {tag.name}
                  </DropdownItem>
                );
              })}
            </DropdownMenu>
          </Dropdown>
        </div>

        <ButtonGroup>
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
        </ButtonGroup>
      </div>

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
