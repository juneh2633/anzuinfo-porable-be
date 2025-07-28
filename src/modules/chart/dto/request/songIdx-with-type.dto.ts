import { IsString } from 'class-validator';

export class SongIdxWithTypeDto {
  @IsString()
  songIdx: string;
  @IsString()
  type: string;
}
