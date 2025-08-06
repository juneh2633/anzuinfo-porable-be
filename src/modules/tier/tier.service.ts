import { Injectable } from '@nestjs/common';
import { TierRepository } from './repository/tier.repository';
import { TierlistData } from './interfaces/tier.interface';
import { UpdateTierDto } from './dto/request/update-tier.dto';

@Injectable()
export class TierService {
  constructor(private readonly tierRepository: TierRepository) {}

  async getAllTiers(): Promise<TierlistData> {
    return await this.tierRepository.findAll();
  }

  async updatePart(partData: UpdateTierDto): Promise<void> {
    await this.tierRepository.updatePart(partData);
  }

  async insertPart(partData: UpdateTierDto): Promise<void> {
    await this.tierRepository.insertPart(partData);
  }
}
