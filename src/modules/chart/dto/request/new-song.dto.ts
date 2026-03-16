import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RadarDto {
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

export class DifficultyDto {
  @Type(() => Number)
  @IsNumber()
  level: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsString()
  columnPath?: string;

  @IsString()
  effectorName: string;

  @IsString()
  illustratorName: string;

  @IsString()
  max_exscore: string;

  @ValidateNested()
  @Type(() => RadarDto)
  radar: RadarDto;

  @IsOptional()
  @IsString()
  jacketArtPath?: string;

  @IsString()
  max_chain: string;

  @IsString()
  chip_count: string;

  @IsString()
  hold_count: string;

  @IsString()
  tsumami_count: string;
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
  
  @IsOptional() @IsString() title_yomigana_romaji?: string;
  @IsOptional() @IsString() artist_yomigana_romaji?: string;

  @IsString() version: string;
  @IsString() bpm: string;
  
  @IsArray() @IsString({ each: true }) genres: string[];
  
  @IsString() date: string;
  @IsBoolean() eac_exc: boolean;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DifficultyDto)
  difficulties: DifficultyDto[];

  @IsOptional()
  @IsString()
  resolution?: 'OVERWRITE' | 'CREATE_NEW' | 'IGNORE';
}
