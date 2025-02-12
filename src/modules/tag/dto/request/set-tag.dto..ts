import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class SetTagDto {
  @IsString()
  @ApiProperty({
    description: '태그',
    default: '태그',
  })
  tag: string;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    description: '곡 인덱스',
    default: 1,
  })
  songIdx: number;
}
