import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class GetTagIdxDto {
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    description: '태그 인덱스',
    default: 1,
  })
  tagIdx: number;
}
