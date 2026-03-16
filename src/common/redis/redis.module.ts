import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redis = new Redis({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_REDIS_PORT),
          password: process.env.DB_REDIS_PASSWORD,
        });

        redis.on('connect', () => console.log('Connected to Redis'));
        redis.on('error', (err) => console.error('Redis error:', err));

        return redis;
      },
    },
    RedisService,
  ],
  exports: [RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
