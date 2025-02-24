import { Module } from '@nestjs/common';
import { PlaydataService } from './playdata.service';
import { PlaydataController } from './playdata.controller';
import { RedisModule } from 'src/common/redis/redis.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { PlaydataRepository } from './repository/playdata.repository';
import { CommonModule } from 'src/common/common.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [RedisModule, PrismaModule, CommonModule, AccountModule],
  providers: [PlaydataService, PlaydataRepository],
  controllers: [PlaydataController],
})
export class PlaydataModule {}
