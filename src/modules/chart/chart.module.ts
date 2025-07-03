import { Module } from '@nestjs/common';
import { ChartController } from './chart.controller';
import { ChartService } from './chart.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { RadarRepository } from './repository/radar.repository';
import { ChartRepository } from './repository/chart.repository';
import { RedisModule } from 'src/common/redis/redis.module';
import { SongRepository } from './repository/song.repository';
import { ChartAdminService } from './chart-admin.service';
import { ChartAdminController } from './chart-admin.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ChartController, ChartAdminController],
  providers: [
    ChartService,
    ChartAdminService,
    RadarRepository,
    ChartRepository,
    SongRepository,
  ],
})
export class ChartModule {}
