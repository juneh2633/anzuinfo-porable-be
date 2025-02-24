import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class AccountIdxDto {
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    description: 'accountIdx',
    default: 1,
  })
  accountIdx: number;
}
