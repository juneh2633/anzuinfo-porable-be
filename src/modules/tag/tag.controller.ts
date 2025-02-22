import { Body, Controller, Get, Post } from '@nestjs/common';
import { TagService } from './tag.service';
import { SetTagDto } from './dto/request/set-tag.dto.';
import { AuthCheck } from 'src/common/decorator/auth-check.decorator';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { User } from '../auth/model/user.model';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get('/all')
  async findTagAll() {
    return await this.tagService.findTagAllByCache();
  }

  /**
   * 태그 캐싱
   */
  @Post('/cache')
  async cacheTagAll() {
    await this.tagService.cacheTagAll();
    return new SuccessResponseDto();
  }

  /**
   * 
   */
  @Post()
  @AuthCheck(1)
  async createTag(
    @Body() setTagDto: SetTagDto,
    @GetUser() user: User,
  ): Promise<SuccessResponseDto> {
    await this.tagService.createTag(user.idx, setTagDto.tag, setTagDto.songIdx);
    return new SuccessResponseDto();
  }
}
