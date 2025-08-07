import { ApiProperty } from '@nestjs/swagger';

export class GreatestSongIdxResponseDto {
  @ApiProperty({
    description: '가장 큰 songIdx 값',
    example: 9999,
  })
  maxSongIdx: number;
}
