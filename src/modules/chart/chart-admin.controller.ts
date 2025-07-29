import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ChartAdminService } from './chart-admin.service';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfigProvider } from 'src/aws/config/multer.config';
import { NewChartDto } from './dto/request/new-chart.dto';
import { SongIdxWithTypeDto } from './dto/request/songIdx-with-type.dto';
import { NewSongDto } from './dto/request/new-song.dto';

@Controller('admin')
export class ChartAdminController {
  constructor(private readonly chartAdminService: ChartAdminService) {}

  @Post('/jacket')
  @UseInterceptors(FileInterceptor('image', multerConfigProvider('img')))
  async createJacket(
    @Body() songIdxWithTypeDto: SongIdxWithTypeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException();
    }
    await this.chartAdminService.uploadJacketOne(songIdxWithTypeDto, file);
    return new SuccessResponseDto();
  }

  @Post('/song')
  async createSong(@Body() newSongDto: NewSongDto) {
    await this.chartAdminService.uploadSong(newSongDto);
    return new SuccessResponseDto();
  }

  @Post('/chart')
  async createChart(@Body() newChartDto: NewChartDto) {
    await this.chartAdminService.uploadChartOne(newChartDto);
    return new SuccessResponseDto();
  }

  // @Put('/chart')
  // async updateChart(@Body() newChartDto: NewChartDto) {
  //   await this.chartAdminService.uploadChartOne(newChartDto);
  //   return new SuccessResponseDto();
  // }
}
