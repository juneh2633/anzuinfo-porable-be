import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PlaydataService } from './playdata.service';
import { ApiTags } from '@nestjs/swagger';
import { GetDataDto } from './dto/request/get-data.dto';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { AuthCheck } from 'src/common/decorator/auth-check.decorator';
import { User } from '../auth/model/user.model';
import { PlaydataDto } from './dto/response/playdata.response';
import { ExceptionList } from 'src/common/decorator/exception-list.decorator';
import { NoPlaydataException } from './exception/no-playdata.exception';
import { GetByLevelDto } from './dto/request/get-by-level.dto';

@ApiTags('Playdata API')
@Controller('playdata')
export class PlaydataController {
  constructor(private readonly playdataService: PlaydataService) {}

  /**
   * 갱신코드 데이터 받는 api
   */
  @Post('/')
  async inputPlaydata(@Body() getDataDto: GetDataDto) {
    await this.playdataService.postData(getDataDto);
    return { status: 'success', message: 'Data received successfully' };
  }

  /**
   * 로그인 유저 볼포스 표
   */
  @Get('/volforce')
  @AuthCheck(1)
  async getVolforce(@GetUser() user: User): Promise<PlaydataDto> {
    const data = await this.playdataService.findVFTable(user);
    return PlaydataDto.createResponse(user, data);
  }

  /**
   * 로그인 유저 해당 차트 기록
   */
  @Get('/chart/:chartIdx')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(1)
  async getPlaydataByChart(
    @GetUser() user: User,
    @Param('chartIdx') chartIdx: number,
  ): Promise<PlaydataDto> {
    const data = await this.playdataService.findPlaydataByChart(user, chartIdx);
    return PlaydataDto.createResponse(user, data);
  }
  /**
   * 차트 유저 랭킹
   */
  @Get('/rank/chart/:chartIdx')
  @ExceptionList([new NoPlaydataException()])
  async getPlaydataRankingByChart(
    @Param('chartIdx') chartIdx: number,
  ): Promise<PlaydataDto> {
    const data = await this.playdataService.findPlaydataRanking(chartIdx);
    return PlaydataDto.createResponse(null, data);
  }
  /**
   * 로그인 유저 해당 레벨 기록
   */
  @Get('/level/:level')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(1)
  async getPlaydataByLevel(
    @GetUser() user: User,
    @Param()
    getByLevelDto: GetByLevelDto,
  ): Promise<PlaydataDto> {
    const data = await this.playdataService.findPlaydataByLevel(
      user,
      getByLevelDto.level,
    );
    return PlaydataDto.createResponse(user, data);
  }
}
