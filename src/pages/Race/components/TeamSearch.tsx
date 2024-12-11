import { Fragment, useMemo, useState, useCallback } from 'react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@nextui-org/react';

import { Tag, Team } from '@resources/RaceSetup';

import { SearchIcon } from '@icons/SearchIcon';

import { TeamCard } from './TeamCard';

const ALL_CLASS_TAG = 'all';
const WATCH_CLASS_TAG = 'watch';

export const TeamSearch = (props) => {
  const { teams, classes, activeTeam, isOpen, onOpenChange, onTeamClick } =
    props;

  const [teamSearchText, setTeamSearchText] = useState('' as string);
  const [teamSearchClass, setTeamSearchClass] = useState(
    ALL_CLASS_TAG as string,
  );

  const searchResult = useMemo(() => {
    if (!teamSearchText && teamSearchClass === ALL_CLASS_TAG) {
      return teams;
    }

    const textFilterFixed = teamSearchText.trim().toLowerCase();
    return teams.reduce((acc: number[], team: Team) => {
      let textMatch = !textFilterFixed;
      let classMatch = teamSearchClass === ALL_CLASS_TAG;

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

      if (!classMatch) {
        classMatch =
          teamSearchClass === WATCH_CLASS_TAG
            ? team.id === activeTeam
            : team.tags.some(
                (tag: number) => tag === parseInt(teamSearchClass),
              );
      }

      if (textMatch && classMatch) {
        acc.push(team);
      }

      return acc;
    }, []);
  }, [teamSearchText, teamSearchClass, teams, activeTeam]);

  const doTeamClick = useCallback(
    (team: Team) => {
      onTeamClick(team);
      onOpenChange();
    },
    [onTeamClick, onOpenChange],
  );

  return (
    <Modal
      classNames={{
        wrapper: 'z-500',
        body: 'overflow-y-auto',
        backdrop: 'z-500',
      }}
      // backdrop="blur"
      // placement="right"
      size="full"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      // isDismissable={false}
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <Fragment>
            <ModalHeader className="flex flex-col gap-4">
              <Input
                size="lg"
                placeholder="Search"
                startContent={<SearchIcon />}
                value={teamSearchText}
                onValueChange={setTeamSearchText}
                isClearable
                autoFocus
              />
              <div className="flex flex-wrap gap-4">
                <Chip
                  className="cursor-pointer bg-cyan-500"
                  color={
                    teamSearchClass === WATCH_CLASS_TAG ? 'primary' : 'default'
                  }
                  variant="flat"
                  // startContent={<EyeIcon />}
                  onClick={() => setTeamSearchClass(WATCH_CLASS_TAG)}
                >
                  Current
                </Chip>

                <Chip
                  className="cursor-pointer"
                  color={
                    teamSearchClass === ALL_CLASS_TAG ? 'primary' : 'default'
                  }
                  variant="flat"
                  onClick={() => setTeamSearchClass(ALL_CLASS_TAG)}
                >
                  All
                </Chip>

                {classes
                  .sort((a: Tag, b: Tag) => a.name.localeCompare(b.name))
                  .map((tag: Tag) => (
                    <Chip
                      key={tag.pk()}
                      className="cursor-pointer"
                      color={
                        teamSearchClass === `${tag.id}` ? 'primary' : 'default'
                      }
                      variant="flat"
                      onClick={() => setTeamSearchClass(`${tag.id}`)}
                    >
                      {tag.name}
                    </Chip>
                  ))}
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="flex flex-row flex-wrap !gap-4">
                {searchResult.map((team: Team) => {
                  // if (!teamsSearchResult.includes(team.id)) {
                  //   return null;
                  // }
                  // const positionsAt = positionsAtHash[team.id];
                  // if (!positionsAt?.length) {
                  //   return null;
                  // }
                  // const isInWatchlist = team.id === activeTeam;
                  // const positionAt = positionsAt[positionsAt.length - 1];
                  // const prevPositionAt =
                  //   positionsAt.length > 1
                  //     ? positionsAt[positionsAt.length - 2]
                  //     : positionAt;
                  // const distanceBetweenPositions = distanceBetweenPoints(
                  //   positionAt,
                  //   prevPositionAt,
                  // );
                  // const timeBetweenPositions =
                  //   positionAt.at - prevPositionAt.at;
                  // const speed =
                  //   (distanceBetweenPositions / timeBetweenPositions) * 1000;

                  return (
                    <TeamCard
                      key={team.pk()}
                      team={team}
                      active={team.id === activeTeam}
                      // position={positionAt}
                      // speed={speed}
                      // courseDistance={raceSetup.courseDistance()}
                      // // isInWatchlist={isInWatchlist}
                      // onWatchlistButtonClick={onWatchlistButtonClick}
                      // onCardPress={onWatchlistButtonClick}
                      onCardPress={() => doTeamClick(team)}
                    />
                  );
                })}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </Fragment>
        )}
      </ModalContent>
    </Modal>
  );
};
