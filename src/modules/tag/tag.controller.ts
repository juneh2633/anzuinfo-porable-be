import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { TagService } from './tag.service';
import { SetTagDto } from './dto/request/set-tag.dto.';
import { AuthCheck } from 'src/common/decorator/auth-check.decorator';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { User } from '../auth/model/user.model';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { GetTagIdxDto } from './dto/request/get-tag-idx.dto';
import { ExceptionList } from 'src/common/decorator/exception-list.decorator';
import { NoTagException } from './exception/no-tag.exception';

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

  /**
   * 태그삭제
   */
  @Delete()
  @AuthCheck(2)
  @ExceptionList([new NoTagException()])
  async deleteTag(
    @Body() getTagIdxDto: GetTagIdxDto,
    @GetUser() user: User,
  ): Promise<SuccessResponseDto> {
    await this.tagService.deleteTag(getTagIdxDto.tagIdx);
    return new SuccessResponseDto();
  }
}
