import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseArrayPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthCheck } from 'src/common/decorator/auth-check.decorator';
import { ChartAdminService } from './chart-admin.service';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfigProvider } from 'src/aws/config/multer.config';
import { NewChartDto } from './dto/request/new-chart.dto';
import { SongIdxWithTypeDto } from './dto/request/songIdx-with-type.dto';
import { GreatestSongIdxResponseDto } from './dto/response/greatest-song-idx.response.dto';
import { AdminSongQueryDto } from './dto/request/admin-song-query.dto';
import { AdminAccountQueryDto } from './dto/request/admin-account-query.dto';
import { NewSongDto } from './dto/request/new-song.dto';
import { UpdateChartDto } from './dto/request/update-chart.dto';

@ApiTags('Admin API')
@Controller('admin')
@AuthCheck(1)
export class ChartAdminController {
  constructor(private readonly chartAdminService: ChartAdminService) {}

  @Get('/song')
  async getSongList(@Query() query: AdminSongQueryDto) {
    return this.chartAdminService.getSongList(query);
  }

  @Get('/stats')
  async getStats() {
    return this.chartAdminService.getDashboardStats();
  }

  @Get('/account')
  async getAccountList(@Query() query: AdminAccountQueryDto) {
    return this.chartAdminService.getAccountList(query);
  }

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

  @Post('/song/preview')
  async previewSongs(@Body(new ParseArrayPipe({ items: NewSongDto })) newSongs: NewSongDto[]) {
    return this.chartAdminService.previewSongs(newSongs);
  }

  @Post('/song')
  async createSong(@Body(new ParseArrayPipe({ items: NewSongDto })) newSongs: NewSongDto[]): Promise<SuccessResponseDto> {
    for (const song of newSongs) {
      await this.chartAdminService.uploadSong(song);
    }
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
