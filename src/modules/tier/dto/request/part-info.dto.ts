import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";
import { PartInfo } from "../../interfaces/tier.interface";

export class PartInfoDto implements PartInfo {
    @Type(() => Number)
    @IsNumber()
    @ApiProperty({
        description: '파트 인덱스',
        default: '1',
      })
    partIdx: number;

    @Type(() => String)
    @IsString()
    @ApiProperty({
        description: '파트 이름',
        default: 'partA',
      })
    partName: string;

    @Type(() => String)
    @IsString()
    @ApiProperty({
        description: '파트 설명', 
        default: 'BT와 FX의 복합적인 노트 패턴 위주',
      })
    description: string;
}
