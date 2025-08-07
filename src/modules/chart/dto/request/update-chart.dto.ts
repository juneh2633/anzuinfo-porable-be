import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

class RadarDto {
  @Type(() => Number)
  @IsNumber()
  notes: number;
  @Type(() => Number)
  @IsNumber()
  peak: number;
  @Type(() => Number)
  @IsNumber()
  tsumami: number;
  @Type(() => Number)
  @IsNumber()
  tricky: number;
  @Type(() => Number)
  @IsNumber()
  handtrip: number;
  @Type(() => Number)
  @IsNumber()
  onehand: number;
}

export class UpdateChartDto {
  @Type(() => Number)
  @IsNumber()
  chartIdx: number;

  @Type(() => Number)
  @IsNumber()
  songIdx: number;

  @IsNumber()
  level: number;

  @IsString()
  type: string;

  @IsString()
  effectorName: string;

  @IsString()
  illustratorName: string;

  @ValidateNested()
  @Type(() => RadarDto)
  radar: RadarDto;
}
