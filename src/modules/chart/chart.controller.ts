import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ChartService } from './chart.service';
import { ExceptionList } from 'src/common/decorator/exception-list.decorator';
import { ChartResponseDto } from './dto/response/chart.reponse.dto';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { AuthCheck } from 'src/common/decorator/auth-check.decorator';
import { NoChartException } from './exception/no-chart.exception';
import { GetVersionDto } from './dto/request/get-version.dto';
import { VersionResponseDto } from './dto/response/version.response.dto';
import { MetaResponseDto } from './dto/response/meta.response.dto';

@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}
  /**
   * chartIdx캐싱
   */
  @AuthCheck(2)
  @Get('/cache')
  @ExceptionList([])
  async cacheChart() {
    const chart = await this.chartService.cacheChart();
    return new SuccessResponseDto();
  }

  /**
   * 곡 전체 가저오기(swagger 사용금지)
   */
  @Get('/meta')
  @ExceptionList([new NoChartException()])
  async getSongAll(): Promise<MetaResponseDto> {
    const data = await this.chartService.findSongAllByRedis();
    return data;
  }

  /**
   * 메타 데이터 캐싱
   */
  @AuthCheck(2)
  @Post('/meta')
  @ExceptionList([new NoChartException()])
  async setSongALl(): Promise<SuccessResponseDto> {
    await this.chartService.cacheSongAll();
    return new SuccessResponseDto();
  }

  /**
   * 버전 확인
   */
  @Get('/version')
  @ExceptionList([])
  async getVersion(): Promise<VersionResponseDto> {
    const data = await this.chartService.findVersion();
    return VersionResponseDto.createResponse(data);
  }

  /**
   * 버전 번호 변경
   */
  @Put('/version')
  @ExceptionList([])
  async setVersion(
    @Query() getVersionDto: GetVersionDto,
  ): Promise<SuccessResponseDto> {
    const data = await this.chartService.insertVersion(getVersionDto.version);
    return new SuccessResponseDto();
  }

  /**
   * idx로 chart 데이터 가저오기
   */
  @Get('/:chartIdx')
  @ExceptionList([new NoChartException()])
  async getChartByIdx(@Param('chartIdx', ParseIntPipe) chartIdx: number) {
    const chart = await this.chartService.findChartByIdx(chartIdx);
    return ChartResponseDto.createResponse(chart);
  }
}
