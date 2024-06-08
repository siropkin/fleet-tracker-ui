import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Image,
  Progress,
} from '@nextui-org/react';
import ReactCountryFlag from 'react-country-flag';

const yachtPlaceholderImgUrl = `${window.location.origin}/yacht_placeholder.png`;

export const TeamCard = (props) => {
  const { team, position, courseDistance, onTeamClick } = props;

  const distanceLabel =
    position.dtf > 0 ? `${Math.round(position.dtf / 100)} NM` : 'Finish';

  return (
    <Card
      className="py-4 w-[270px] min-w-[270px] h-[420px] min-h-[420px]"
      onPress={() => onTeamClick(team.id)}
      isPressable
    >
      <CardHeader className="py-0 px-4 flex-row items-center gap-4">
        <ReactCountryFlag
          className="drop-shadow-lg"
          style={{ width: '48px', height: '48px' }}
          countryCode={team.flag}
          svg
        />
        <div className="flex flex-col items-start overflow-hidden">
          <h4 className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-large font-bold">
            {team.name}
          </h4>
          <p className="text-tiny uppercase font-bold !m-0">{team.captain}</p>
        </div>
      </CardHeader>

      <CardBody className="overflow-visible py-2">
        <Image
          alt={team.name}
          className="object-cover rounded-xl w-full h-full"
          src={team.thumb || yachtPlaceholderImgUrl}
        />
      </CardBody>

      <CardFooter>
        <Progress
          size="sm"
          label="Distance left"
          aria-label="Distance left"
          valueLabel={distanceLabel}
          value={courseDistance - position.dtf}
          maxValue={courseDistance}
          showValueLabel={true}
        />
      </CardFooter>
    </Card>
  );
};
