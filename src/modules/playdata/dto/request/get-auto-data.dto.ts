import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UserDataDto } from './user-data.dto';
import { PlaydataDto } from './playdata.dto';

export class GetAutoDataDto {
  @Type(() => UserDataDto)
  @IsObject()
  @ValidateNested()
  @ApiProperty({
    description: '유저 정보',
    type: UserDataDto,
  })
  account: UserDataDto;

  @Type(() => PlaydataDto)
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ApiProperty({
    description: '플레이 데이터',
    type: [PlaydataDto],
    default: [
      {
        title: 'Lachryma《Re:Queen’M》',
        artist: 'かねこちはる',
        chart: [
          {
            chartType: 'exhaust',
            clearType: 'uc',
            score: 9975237,
          },
          {
            chartType: 'infinite',
            clearType: 'comp_ex',
            score: 9799210,
          },
        ],
      },
      {
        title: 'Prayer',
        artist: 'ぺのれり',
        chart: [
          {
            chartType: 'exhaust',
            clearType: 'uc',
            score: 9988089,
          },
        ],
      },
    ],
  })
  playdata: PlaydataDto[];
}
