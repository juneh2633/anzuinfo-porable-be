import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ChartAdminService } from './chart-admin.service';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfigProvider } from 'src/aws/config/multer.config';
import { SongWithDifficultyDto } from './dto/request/song-with-difficulty.dto';

@Controller('admin')
export class ChartAdminController {
  constructor(private readonly chartAdminService: ChartAdminService) {}

  @Post('/jacket')
  @UseInterceptors(FileInterceptor('image', multerConfigProvider('img')))
  async createJacket(
    @Body() songWithDifficultyDto: SongWithDifficultyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return new SuccessResponseDto();
  }

  @Post('/song')
  async createSong() {
    return new SuccessResponseDto();
  }

  @Post('/chart')
  async createChart() {
    return new SuccessResponseDto();
  }
}
