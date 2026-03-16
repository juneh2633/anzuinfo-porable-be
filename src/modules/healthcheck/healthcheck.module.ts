import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthcheckController } from './healthcheck.controller';
import { RedisHealthIndicator } from './redis-health.indicator';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { RedisModule } from 'src/common/redis/redis.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [TerminusModule, RedisModule, PrismaModule],
  controllers: [HealthcheckController],
  providers: [RedisHealthIndicator, PrismaHealthIndicator],
})
export class HealthcheckModule {}
