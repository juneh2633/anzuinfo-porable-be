import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, Matches, ValidateNested, IsOptional } from 'class-validator';
import { ChartItem, TierItem } from '../../interfaces/tier.interface';

export class ChartDto implements ChartItem {
    @Type(() => Number)
    @IsNumber()
    @ApiProperty({
        description: '차트 인덱스',
        default: '1',
    })
    chartIdx: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @ApiProperty({
        description: '목표 점수',
        default: '1',
        nullable: true,
    })
    targetScore: number | null;
}

export class TierListDto implements TierItem {
    @Type(() => Number)
    @IsNumber()
    @ApiProperty({
        description: '티어 인덱스',
        default: '1',
    })
    tierIdx: number;

    @Type(() => String)
    @IsString()
    @ApiProperty({
        description: '티어 이름',
        default: '1',
    })
    tier: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChartDto)
    @ApiProperty({
        description: '차트 리스트',
        type: [ChartDto],
    })
    chartList: ChartItem[];
}
