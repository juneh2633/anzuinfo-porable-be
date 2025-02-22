import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class ScoreDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '곡 난이도',
    default: 'maximum',
  })
  chartType: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '클리어 마크',
    default: 'comp_ex',
  })
  clearType: string;

  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    description: '곡 점수',
    default: 1000000,
  })
  score: number;
}
