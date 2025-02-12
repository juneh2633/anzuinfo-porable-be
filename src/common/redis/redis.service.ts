import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async delete(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async lpush(key: string, values: string[]): Promise<number> {
    return this.redisClient.lpush(key, ...values);
  }
  async lpop(key: string): Promise<string | null> {
    return this.redisClient.lpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redisClient.lrange(key, start, stop);
  }

  async lrem(key: string, count: number, value: string): Promise<number> {
    return this.redisClient.lrem(key, count, value);
  }

  async lset(key: string, index: number, value: string): Promise<string> {
    return this.redisClient.lset(key, index, value);
  }

  async lindex(key: string, index: number): Promise<string> {
    return this.redisClient.lindex(key, index);
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    return this.redisClient.ltrim(key, start, stop);
  }
}
