import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { UpdateChartDto } from './dto/request/update-chart.dto';
import { GreatestSongIdxResponseDto } from './dto/response/greatest-song-idx.response.dto';

@Controller('admin')
export class ChartAdminController {
  constructor(private readonly chartAdminService: ChartAdminService) {}

  @Get('/songIdx')
  async getGreatestIdx(): Promise<GreatestSongIdxResponseDto> {
    const entity = await this.chartAdminService.getGreatestSongIdx();
    const responseDto = new GreatestSongIdxResponseDto();
    responseDto.maxSongIdx = entity.maxSongIdx;
    return responseDto;
  }

  @Post('/jacket')
  @UseInterceptors(FileInterceptor('image', multerConfigProvider('img')))
  async createJacket(
    @Body() songIdxWithTypeDto: SongIdxWithTypeDto,
    @UploadedFile() file?: Express.Multer.File,
  ):Promise<SuccessResponseDto> {
    if (!file) {
      throw new BadRequestException();
    }
    await this.chartAdminService.uploadJacketOne(songIdxWithTypeDto, file);
    return new SuccessResponseDto();
  }

  @Post('/song')
  async createSong(@Body() newSongDto: NewSongDto):Promise<SuccessResponseDto> {
    await this.chartAdminService.uploadSong(newSongDto);
    return new SuccessResponseDto();
  }

  @Post('/chart')
  async createChart(@Body() newChartDto: NewChartDto):Promise<SuccessResponseDto> {
    await this.chartAdminService.uploadChartOne(newChartDto);
    return new SuccessResponseDto();
  }

  @Put('/chart')
  async updateChart(@Body() updateChartDto: UpdateChartDto): Promise<SuccessResponseDto> {
    await this.chartAdminService.updateChartOne(updateChartDto);
    return new SuccessResponseDto();
  }
}
