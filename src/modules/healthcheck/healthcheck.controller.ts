import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis-health.indicator';
import { PrismaHealthIndicator } from './prisma-health.indicator';

@ApiTags('Healthcheck API')
@Controller('healthcheck')
export class HealthcheckController {
  constructor(
    private health: HealthCheckService,
    private redisHealth: RedisHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get('/')
  @HealthCheck()
  async healthcheck() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
