import { IsString } from 'class-validator';

export class JacketUrlDto {
  @IsString()
  songIdx: string;

  @IsString()
  type: string;

  @IsString()
  sourceUrl: string;
}
