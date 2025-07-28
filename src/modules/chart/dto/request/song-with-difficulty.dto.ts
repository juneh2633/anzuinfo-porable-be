import { IsString } from 'class-validator';

export class SongWithDifficultyDto {
  @IsString()
  songid: string;
  @IsString()
  difficulty: string;
}
