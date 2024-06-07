import { useEffect, useMemo, useState } from 'react';
import { Tag, Team } from '@resources/RaceSetup.ts';
import {
  Badge,
  Input,
  Modal,
  ModalContent,
  Tab,
  Tabs,
} from '@nextui-org/react';
import { SearchIcon } from '@icons/SearchIcon';
import { CheckIcon } from '@icons/CheckIcon';
import { TeamCard } from '@pages/Race/components/TeamCard';

export const TeamSearchBar = (props) => {
  const {
    teams,
    selectedTeams,
    tagsHash,
    isOpen,
    onOpenChange,
    onTeamClick,
    onFilteredChange,
  } = props;

  const [groupFilter, setGroupFilter] = useState('all');
  const [textFilter, setTextFilter] = useState('');

  const filteredTeams = useMemo(() => {
    if (!textFilter && groupFilter === 'all') {
      return [];
    }
    const textFilterFixed = textFilter.trim().toLowerCase();
    return teams.filter((team: Team) => {
      let textMatch = !textFilterFixed;
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
      if (groupFilter === 'all') {
        return textMatch;
      }
      if (groupFilter === 'selectedTeams') {
        return textMatch && selectedTeams.includes(team.id);
      }
      return textMatch && team.tags.includes(parseInt(groupFilter));
    });
  }, [groupFilter, selectedTeams, teams, textFilter]);

  useEffect(() => {
    console.log(filteredTeams);
    onFilteredChange?.(filteredTeams.map((team: Team) => team.id));
  }, [onFilteredChange, filteredTeams.length]);

  useEffect(() => {
    if (!isOpen) {
      setTextFilter('');
      setGroupFilter('all');
    }
  }, [isOpen]);

  return (
    <Modal
      classNames={{
        wrapper: 'z-600',
        // body: 'backdrop-opacity-40',
        backdrop: 'z-600',
        base: 'py-10',
        // header: 'z-600 border-b-[1px] border-[#292f46]',
        // footer: 'z-600 border-t-[1px] border-[#292f46]',
        // closeButton: 'hover:bg-white/5 active:bg-white/10',
      }}
      size="full"
      backdrop="transparent"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disableAnimation
    >
      <ModalContent className="!bg-transparent">
        {(onClose) => (
          <div className="flex flex-col justify-center items-center gap-10  overflow-hidden">
            <Tabs
              // variant="bordered"
              selectedKey={groupFilter}
              onSelectionChange={setGroupFilter}
            >
              <Tab key="all" title="All" />
              <Tab key="selectedTeams" title="Selected" />
              {/*<Divider className="w-full" />*/}
              {Object.values(tagsHash).map((item: Tag) => (
                <Tab key={item.pk()} title={item.name} />
              ))}
            </Tabs>

            <Input
              // label="Search"
              radius="lg"
              className="w-[50%]"
              placeholder="Type to search..."
              startContent={
                <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
              }
              value={textFilter}
              onValueChange={setTextFilter}
              isClearable
            />

            <div className="flex flex-row flex-wrap justify-center items-center gap-5 h-full w-full overflow-y-auto px-10">
              {filteredTeams.map((team: Team) => (
                <Badge
                  key={team.pk()}
                  className="cursor-pointer"
                  color="success"
                  size="lg"
                  placement="top-right"
                  content={<CheckIcon />}
                  isOneChar
                  isInvisible={!selectedTeams.includes(team.id)}
                  onClick={() => onTeamClick(team.id)}
                >
                  <TeamCard
                    team={team}
                    tagsHash={tagsHash}
                    onTeamClick={onTeamClick}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};
