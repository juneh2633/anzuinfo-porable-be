import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ExceptionList } from 'src/common/decorator/exception-list.decorator';
import { KeywordDto } from './dto/request/keyword.dto';
import { SongService } from './song.service';

@Controller('song')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Get('/search')
  @ExceptionList([new NotFoundException()])
  async searchSong(@Query() keywordDto: KeywordDto): Promise<void> {}
}
