import {
  Card,
  CardFooter,
  CardHeader,
  Chip,
  Image,
  Progress,
} from '@nextui-org/react';
import ReactCountryFlag from 'react-country-flag';

export const TeamCard = (props) => {
  const {
    team,
    tagsHash,
    distanceLabel,
    distanceLeft,
    distanceMax,
    onTeamClick,
    onClassButtonClick,
  } = props;

  const showDistance = !!distanceLabel && !!distanceLeft && !!distanceMax;
  // team.thumb or "yacht_placeholder.png" from current site
  const teamImgUrl =
    team.thumb || `${window.location.origin}/yacht_placeholder.png`;

  return (
    <Card
      className="w-[340px] h-[320px] border-none relative"
      onPress={() => onTeamClick(team.id)}
      isPressable
    >
      <Image
        className={`absolute top-0 bottom-0 w-full ${showDistance ? 'h-4/5' : 'h-full'} object-cover`}
        alt={team.name}
        src={teamImgUrl}
        removeWrapper
        radius="none"
      />
      <CardHeader
        className={`w-full ${showDistance ? 'h-4/5' : 'h-full'} flex-col !items-start`}
      >
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

        {/*<Divider className="my-4" />*/}
        <div className="flex gap-4 mt-auto">
          {team.tags.map((tagId: number) => {
            const tag = tagsHash[tagId];
            return (
              <Chip
                key={tag.pk()}
                className={onClassButtonClick ? 'cursor-pointer' : ''}
                color="default"
                size="sm"
                radius="sm"
                onClick={() => onClassButtonClick?.(tag)}
              >
                {tag.name}
              </Chip>
            );
          })}
        </div>
      </CardHeader>

      {showDistance && (
        <CardFooter className="w-full h-full flex !items-start">
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
            maxValue={distanceMax}
            showValueLabel={true}
          />
        </CardFooter>
      )}
    </Card>
  );
};
