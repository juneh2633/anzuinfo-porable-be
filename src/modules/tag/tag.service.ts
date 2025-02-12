import { Injectable } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { RedisService } from 'src/common/redis/redis.service';
import { NoTagException } from './exception/no-tag.exception';

const TAG_CACHE_KEY = 'tagRedisCache@@@@@@';

@Injectable()
export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly redisService: RedisService,
  ) {}

  async findTagAll() {
    return await this.tagRepository.selectTagAll();
  }

  async createTag(accountIdx: number, tag: string, songIdx: number) {
    await this.tagRepository.insertTag(accountIdx, tag, songIdx);
  }

  async cacheTagAll() {
    const data = await this.tagRepository.selectTagAll();
    await this.redisService.set(TAG_CACHE_KEY, JSON.stringify(data));
  }
  async findTagAllByCache() {
    const data = await this.redisService.get(TAG_CACHE_KEY);
    if (!data) {
      throw new NoTagException();
    }
    return JSON.parse(data);
  }

  async deleteTag(tagIdx: number) {
    await this.tagRepository.deleteTagByIdx(tagIdx);
  }
}
