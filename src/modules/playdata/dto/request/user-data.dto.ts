import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UserDataDto {
  @IsString()
  @ApiProperty({
    description: 'sdvx id',
    default: 'SV-1111-1111',
  })
  sdvxId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '유저 이름',
    default: 'TEST',
  })
  playerName: string | null;

  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    description: '플레이 횟수',
    default: 1557,
  })
  playCount: number | null;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '스킬 레벨',
    default: 'inf',
  })
  skillLevel: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '스킬 이름',
    default: '詠鰤琉',
  })
  skillName: string;

  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    description: 'VF',
    default: 20.451,
  })
  vf: number;

  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    description: 'PCB',
    default: 0,
  })
  pcb?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '칭호',
    default: '칭호',
  })
  comment?: string;
}
