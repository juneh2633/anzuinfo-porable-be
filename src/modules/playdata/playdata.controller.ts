import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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
import { GetVSDto } from './dto/request/get-vs.dto';
import { FilterDto } from './dto/request/filter.dto';
import { GetAutoDataDto } from './dto/request/get-auto-data.dto';
import { AccountIdxDto } from './dto/request/account-idx.dto';

@ApiTags('Playdata API')
@Controller('playdata')
export class PlaydataController {
  constructor(private readonly playdataService: PlaydataService) {}

  // /**
  //  * 갱신코드 데이터 받는 api
  //  */
  // @Post('/')
  // async inputPlaydata(@Body() getDataDto: GetDataDto) {
  //   await this.playdataService.postData(getDataDto);
  //   return { status: 'success', message: 'Data received successfully' };
  // }

  /**
   * 갱신코드 데이터 받는 api (인앱)
   */
  @Post('/auto')
  async inputAutoPlaydata(@Body() getDataDto: GetAutoDataDto) {
    const newRecored = await this.playdataService.autoPostData(getDataDto);
    return PlaydataDto.createResponse(null, newRecored);
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
   * 로그인 유저 볼포스 표
   */
  @Get('/volforce/raw')
  @AuthCheck(1)
  async getVolforceRaw(@GetUser() user: User): Promise<PlaydataDto> {
    const data = await this.playdataService.findVFTableRaw(user);
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
   * 최근 5개 기록
   */
  @Get('/history/:chartIdx')
  @ExceptionList([])
  @AuthCheck(1)
  async getPlaydataHistory(
    @GetUser() user: User,
    @Param('chartIdx') chartIdx: number,
  ): Promise<PlaydataDto> {
    const data = await this.playdataService.findPlaydataHistoryByChart(
      user,
      chartIdx,
    );
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

  /**
   * vs가저오기
   */
  @Get('/vs')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(1)
  async getVSData(
    @GetUser() user: User,
    @Query() getVsDto: GetVSDto,
  ): Promise<PlaydataDto> {
    const data = await this.playdataService.findVSData(
      user,
      getVsDto.rivalId,
      getVsDto.page,
    );
    return PlaydataDto.createResponse(user, data);
  }

  /**
   * filter
   */
  @Get('/filter')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(1)
  async getFilter(
    @GetUser() user: User,
    @Query() filterDto: FilterDto,
  ): Promise<PlaydataDto> {
    const data = await this.playdataService.findPlaydataByFilter(
      user,
      filterDto,
    );
    return PlaydataDto.createResponse(user, data);
  }

  /**
   * 플레이 데이터 수동 캐싱
   */
  @Post('/cache')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(1)
  async redisTestPost(@GetUser() user: User): Promise<SuccessResponseDto> {
    await this.playdataService.cachePlaydataByRedis(user.idx);
    return new SuccessResponseDto();
  }

  /**
   * 플레이 데이터 캐싱 가져오기
   */
  @Get('/all')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(1)
  async redisTestGet(@GetUser() user: User): Promise<PlaydataDto> {
    const data = await this.playdataService.getPlaydataAllByRedis(user.idx);
    return PlaydataDto.createResponse(user, data);
  }

  /**
   * 플레이 데이터 캐싱 가져오기
   */
  @Delete('/cache')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(2)
  async redisDelete(
    @GetUser() user: User,
    @Body() accountIdxDto: AccountIdxDto,
  ): Promise<SuccessResponseDto> {
    await this.playdataService.deleteCachedPlaydata(accountIdxDto.accountIdx);
    return new SuccessResponseDto();
  }

  /**
   * 플레이 데이터 수동 캐싱
   */
  @Post('/cache/other')
  @ExceptionList([new NoPlaydataException()])
  @AuthCheck(2)
  async redisTestPostOther(
    @GetUser() user: User,
    @Body() accountIdxDto: AccountIdxDto,
  ): Promise<SuccessResponseDto> {
    await this.playdataService.cachePlaydataByRedis(accountIdxDto.accountIdx);
    return new SuccessResponseDto();
  }

  /**
   * 경험치표 데이터
   */
  @Get('/tier')
  @ExceptionList([])
  async tierlist(): Promise<any> {
    const data = this.playdataService.getTierlist();
    return data;
  }


  @Get('/test')
  @ExceptionList([])
  async test():Promise<any>{
    return await this.playdataService.getPlaydataAllByRedis(1);
  }
}
