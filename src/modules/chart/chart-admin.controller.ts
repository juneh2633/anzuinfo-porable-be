import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ChartService } from './chart.service';
import { ChartAdminService } from './chart-admin.service';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerConfig,
  multerConfigProvider,
} from 'src/aws/config/multer.config';
import { IsString } from 'class-validator';
import { SongIdDto } from './dto/request/songid.dto';

@Controller('admin')
export class ChartAdminController {
  constructor(private readonly chartAdminService: ChartAdminService) {}

  @Post('/jacket')
  @UseInterceptors(FileInterceptor('image', multerConfigProvider('img')))
  async createJacket(
    @Body() songIdDto: SongIdDto,
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
