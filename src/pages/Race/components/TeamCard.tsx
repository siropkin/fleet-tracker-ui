import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Image,
  Progress,
} from '@nextui-org/react';
import ReactCountryFlag from 'react-country-flag';

import { EyeIcon } from '@icons/EyeIcon';

const teamPlaceholderThumb = `${window.location.origin}/team_placeholder.png`;

export const TeamCard = (props) => {
  const {
    team,
    position,
    courseDistance,
    isInWatchlist,
    onWatchlistButtonClick,
    onCardPress,
  } = props;

  const distanceLabel = !position.dtf
    ? 'Finish'
    : `${Math.round(position.dtf / 100)} NM`;

  return (
    <Card
      className="py-4 w-72 min-w-72 h-auto min-h-auto"
      onPress={() => onCardPress?.(team.id)}
      isPressable={!!onCardPress}
    >
      <CardHeader className="flex-row items-center gap-4 py-0 px-4">
        <ReactCountryFlag
          className="drop-shadow-lg !w-12 !h-12"
          countryCode={team.flag}
          svg
        />

        <div className="flex flex-col items-start overflow-hidden">
          <h4 className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-large font-bold">
            {team.name}
          </h4>
          <p className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-tiny uppercase font-bold !m-0">
            {team.captain}
          </p>
        </div>

        <Button
          className="ml-auto"
          color={isInWatchlist ? 'primary' : 'default'}
          variant={isInWatchlist ? 'solid' : 'light'}
          size="sm"
          aria-label="Watch"
          onPress={() => onWatchlistButtonClick(team.id)}
          isIconOnly
        >
          <EyeIcon />
        </Button>
      </CardHeader>

      <CardBody className="overflow-visible py-2 gap-1">
        <Image
          className="object-cover rounded-xl h-64"
          alt={team.name}
          src={team.thumb || teamPlaceholderThumb}
        />
      </CardBody>

      <CardFooter>
        <Progress
          size="sm"
          label="Distance to finish"
          aria-label="Distance to finish"
          valueLabel={distanceLabel}
          value={courseDistance - position.dtf}
          maxValue={courseDistance}
          showValueLabel={true}
        />
      </CardFooter>
    </Card>
  );
};
