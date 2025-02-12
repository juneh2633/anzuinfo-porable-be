import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { TagRepository } from './tag.repository';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
})
export class TagModule {}
