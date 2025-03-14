import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

class RadarDto {
  @Type(() => Number)
  @IsNumber()
  notes: number;
  @Type(() => Number)
  @IsNumber()
  peak: number;
  @Type(() => Number)
  @IsNumber()
  tsumami: number;
  @Type(() => Number)
  @IsNumber()
  tricky: number;
  @Type(() => Number)
  @IsNumber()
  handtrip: number;
  @Type(() => Number)
  @IsNumber()
  onehand: number;
}

class DifficultyDto {
  @Type(() => Number)
  @IsNumber()
  level: number;
  @IsString() type: string;
  @IsString() imagePath: string;
  @IsString() columnPath: string;
  @IsString() effectorName: string;
  @IsString() illustratorName: string;
  @IsString() max_exscore: string;
  @IsObject() radar: RadarDto;
  @IsString() jacketArtPath: string;
  @IsString() max_chain: string;
  @IsString() chip_count: string;
  @IsString() hold_count: string;
  @IsString() tsumami_count: string;
}

export class NewSongDto {
  @IsString() songid: string;
  @IsString() title: string;
  @IsString() artist: string;
  @IsString() ascii: string;
  @IsString() ascii_title: string;
  @IsString() ascii_artist: string;
  @IsString() title_yomigana: string;
  @IsString() artist_yomigana: string;
  @IsString() version: string;
  @IsString() bpm: string;
  @IsArray() @IsString({ each: true }) genres: string[];
  @IsString() date: string;
  @IsBoolean() eac_exc: boolean;
  @IsArray() @IsObject({ each: true }) difficulties: DifficultyDto[];
}
