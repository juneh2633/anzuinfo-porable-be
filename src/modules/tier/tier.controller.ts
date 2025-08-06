import { Controller, Get, Put, Body, Param, Post } from '@nestjs/common';
import { TierService } from './tier.service';
import { TierlistData } from './interfaces/tier.interface';
import { UpdateTierDto } from './dto/request/update-tier.dto';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';

@Controller('tier')
export class TierController {
  constructor(private readonly tierService: TierService) {}

  /**
   * 
   * 티어표 모두 가져오기
   */
  @Get()
  async getAllTiers(): Promise<TierlistData> {
    return await this.tierService.getAllTiers();
  }

  /**
   * tierIdx를 기준으로 update
   */
  @Put('')
  async updatePart(
    @Body() partData: UpdateTierDto,
  ): Promise<SuccessResponseDto>  {
    await this.tierService.updatePart(partData);
    return new SuccessResponseDto();
  }

  /**
   * 티어표 추가가
   */
  @Post('')
  async insertPart(
    @Body() partData: UpdateTierDto,
  ): Promise<SuccessResponseDto> {
    await this.tierService.insertPart(partData);
    return new SuccessResponseDto();
  }
}
