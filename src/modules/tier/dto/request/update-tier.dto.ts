import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { PartInfoDto } from "./part-info.dto";
import { TierListDto } from "./tier-list.dto";
import { PartItem } from "../../interfaces/tier.interface";

export class UpdateTierDto implements PartItem {
    @ValidateNested()
    @Type(() => PartInfoDto)
    @ApiProperty({
        description: '파트 정보',
        type: PartInfoDto,
    })
    partInfo: PartInfoDto;

    @ValidateNested({ each: true })
    @Type(() => TierListDto)
    @ApiProperty({
        description: '티어 리스트',
        type: [TierListDto],
    })
    tierList: TierListDto[];
}