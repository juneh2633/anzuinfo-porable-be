import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ScoreDto } from './score.dto';

export class PlaydataDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '곡 제목',
    default: 'Lachryma',
  })
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '작곡가',
    default: 'Lachryma',
  })
  artist: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreDto)
  @ApiProperty({
    description: '플레이 데이터 배열',
    type: [ScoreDto],
  })
  chart?: ScoreDto[];
}
