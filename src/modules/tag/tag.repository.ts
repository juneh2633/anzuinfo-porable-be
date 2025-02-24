import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class TagRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async selectTagAll() {
    return await this.prismaService.tag.findMany();
  }

  async selectTagByIdx(tagIdx: number): Promise<Tag | null> {
    return await this.prismaService.tag.findUnique({
      where: {
        idx: tagIdx,
      },
    });
  }

  async insertTag(
    accountIdx: number,
    tag: string,
    songIdx: number,
  ): Promise<void> {
    await this.prismaService.tag.create({
      data: {
        accountIdx: accountIdx,
        name: tag,
        songIdx: songIdx,
      },
    });
  }

  async deleteTagByIdx(tagIdx: number) {
    await this.prismaService.tag.deleteMany({
      where: {
        idx: tagIdx,
      },
    });
  }
}
