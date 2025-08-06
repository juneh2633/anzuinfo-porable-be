import { Module } from '@nestjs/common';

import { TierRepository } from './repository/tier.repository';
import { TierService } from './tier.service';
import { TierController } from './tier.controller';

@Module({
  controllers: [TierController],
  providers: [TierService, TierRepository],
  exports: [TierService],
})
export class TierModule {} 