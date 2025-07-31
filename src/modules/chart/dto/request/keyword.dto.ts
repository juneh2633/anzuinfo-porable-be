import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class KeywordDto {
  @IsString()
  @ApiProperty({
    description: '검색 키워드',
    default: 'remix',
  })
  keyword: string;
}
