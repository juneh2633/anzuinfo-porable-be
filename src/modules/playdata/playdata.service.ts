import { Injectable } from '@nestjs/common';
import { PlaydataRepository } from './repository/playdata.repository';
import { GetDataDto } from './dto/request/get-data.dto';
import { RedisService } from 'src/common/redis/redis.service';
import * as crypto from 'crypto';
import { CommonService } from 'src/common/common.service';
import { AccountRepository } from '../account/repository/account.repository';
import { NoUserException } from './exception/no-user.exception';
import { NoPlaydataException } from './exception/no-playdata.exception';
import { User } from '../auth/model/user.model';
import { AccountService } from '../account/account.service';
import { PlaydataEntity } from './entity/Playdata.entity';
import { VSEntity } from './entity/VS.entity';
import { FilterDto } from './dto/request/filter.dto';
import { PlaydataHistoryEntity } from './entity/PlaydataHistory.entity';
import { PlaydataVfRawEntity } from './entity/PlaydataVfRaw.entity';
import { GetAutoDataDto } from './dto/request/get-auto-data.dto';
import { PlaydataCompareEntity } from './entity/PlaydataCompare.entity';
import { PlaydataDao } from './dao/playdata.dao';

@Injectable()
export class PlaydataService {
  constructor(
    private readonly playdataRepository: PlaydataRepository,
    private readonly commonService: CommonService,
    private readonly redisService: RedisService,
    private readonly accountRepository: AccountRepository,
    private readonly accountService: AccountService,
  ) {}

  async autoPostData(getDataDto: GetAutoDataDto) {
    console.log('start');
    console.log(getDataDto.account);
    const { sdvxId, playerName, vf, skillLevel, playCount } =
      getDataDto.account;
    console.log(sdvxId);
    const user = await this.accountRepository.selectAccountBySdvxId(sdvxId);

    if (user === null) {
      throw new NoUserException();
    }

    const now = new Date();
    const recentPlaydataList = await this.getPlaydataAllByRedis(user.idx);
    let newRecordList = new Array<PlaydataCompareEntity>();
    let newPlaydataList = new Array<PlaydataDao>();

    for (const track of getDataDto.playdata) {
      const { title, artist, chart } = track;
      console.log(title);
      for (const scoreData of chart) {
        const { chartType, clearType, score } = scoreData;
        const typeAndTitle =
          chartType + '____' + title.replace('(EXIT TUNES)', '');
        const safeKey = crypto
          .createHash('sha256')
          .update(typeAndTitle, 'utf8')
          .digest('hex');
        let chartIdxWithLevel = '';
        if (title === 'Prayer' && artist === 'ぺのれり') {
          if (chartType === 'novice') {
            chartIdxWithLevel = '2521@@6';
          } else if (chartType === 'advanced') {
            chartIdxWithLevel = '2522@@12';
          } else {
            chartIdxWithLevel = '2523@@18';
          }
        } else if (title === 'Prayer') {
          if (chartType === 'novice') {
            chartIdxWithLevel = '7231@@6';
          } else if (chartType === 'advanced') {
            chartIdxWithLevel = '7232@@12';
          } else if (chartType === 'exhaust') {
            chartIdxWithLevel = '7233@@15';
          } else {
            chartIdxWithLevel = '7234@@18';
          }
        } else {
          chartIdxWithLevel = await this.redisService.get(safeKey);
        }

        if (chartIdxWithLevel === null) {
          return null;
        }

        const [chartIdx, level] = chartIdxWithLevel.split('@@');

        const rankIdx = this.commonService.getRankIdx(clearType);

        const data = recentPlaydataList.find(
          (data) => data.chartIdx === parseInt(chartIdx, 10),
        );
        const playdataObj: PlaydataDao = {
          accountIdx: user.idx,
          chartIdx: parseInt(chartIdx, 10),
          chartVf: Math.floor(
            this.commonService.getVolforce(parseInt(level, 10), score, rankIdx),
          ),
          rank: rankIdx,
          score: score,
          createdAt: now,
        };

        if (
          data === undefined ||
          playdataObj.score > data.score ||
          playdataObj.rank !== data.rank
        ) {
          newRecordList.push(
            PlaydataCompareEntity.createEntity(
              data,
              playdataObj.score,
              playdataObj.rank,
              playdataObj.chartVf,
            ),
          );
          newPlaydataList.push(playdataObj);
        }
      }
    }
    console.log('@@@@');
    await this.playdataRepository.insertPlaydataList(newPlaydataList);
    await this.accountRepository.updateAccountPlaydata(
      user.idx,
      playerName,
      playCount,
      Math.round(vf * 1000),
      skillLevel,
      now,
    );

    await this.cachePlaydataByRedis(user.idx);
    console.log(`${newPlaydataList.length}개의 데이터가 저장되었습니다.`);
    return newRecordList;
  }

  async findVFTable(account: User): Promise<PlaydataEntity[]> {
    const updatedAt = await this.accountService.findUserUpateAt(account.idx);
    const playdataList = await this.playdataRepository.selectVF(
      account.idx,
      updatedAt,
    );
    return playdataList.map((playdata) => PlaydataEntity.createDto(playdata));
  }

  async findVFTableRaw(account: User): Promise<PlaydataVfRawEntity[]> {
    const updatedAt = await this.accountService.findUserUpateAt(account.idx);
    const playdataList = await this.playdataRepository.selectVFRaw(
      account.idx,
      updatedAt,
    );
    return playdataList.map((playdata) =>
      PlaydataVfRawEntity.createDto(playdata),
    );
  }

  async findPlaydataByChart(
    account: User,
    chartIdx: number,
  ): Promise<PlaydataEntity> {
    const updatedAt = await this.accountService.findUserUpateAt(account.idx);
    const playdata = await this.playdataRepository.selectPlaydataByChart(
      account.idx,
      updatedAt,
      chartIdx,
    );
    if (playdata === null) {
      throw new NoPlaydataException();
    }
    return PlaydataEntity.createDto(playdata);
  }
  async findPlaydataHistoryByChart(
    account: User,
    chartIdx: number,
  ): Promise<PlaydataHistoryEntity[]> {
    const playdata = await this.playdataRepository.selectPlaydataHistoryByChart(
      account.idx,
      chartIdx,
    );

    return playdata.map((data) => PlaydataHistoryEntity.createDto(data));
  }

  async findPlaydataByLevel(
    account: User,
    level: number,
  ): Promise<PlaydataEntity[]> {
    const updatedAt = await this.accountService.findUserUpateAt(account.idx);
    const playdataList = await this.playdataRepository.selectPlaydataByLevel(
      account.idx,
      updatedAt,
      level,
    );

    if (playdataList === null || playdataList.length === 0) {
      throw new NoPlaydataException();
    }

    return playdataList.map((playdata) => PlaydataEntity.createDto(playdata));
  }

  async findPlaydataRanking(chartIdx: number) {
    const playdataList =
      await this.playdataRepository.selectPlaydataRankingByChart(chartIdx);
    const uniqueData = Object.values(
      playdataList.reduce(
        (acc, current) => {
          const accountIdx = current.accountIdx;
          if (
            !acc[accountIdx] ||
            new Date(current.account.updatedAt) >
              new Date(acc[accountIdx].account.updatedAt)
          ) {
            acc[accountIdx] = current;
          }
          return acc;
        },
        {} as Record<number, (typeof playdataList)[0]>,
      ),
    );
    return uniqueData.sort((a, b) => b.score - a.score);
  }

  async findPlaydataAll(accountIdx: number): Promise<PlaydataEntity[]> {
    const target = await this.accountRepository.selectAccountByIdx(accountIdx);
    const playdataList =
      await this.playdataRepository.selectPlaydataAll(accountIdx);
    return playdataList.map((playdata) => PlaydataEntity.createDto(playdata));
  }

  async findVSData(user: User, targetId: string, page: number) {
    const target = await this.accountRepository.selectAccountById(targetId);
    if (!target) {
      throw new NoUserException();
    }
    const vsData = await this.playdataRepository.selectVSDataPrisma(
      user.idx,
      target.idx,
      page,
    );

    if (!vsData.length) {
      throw new NoPlaydataException();
    }

    return VSEntity.createMany(vsData);
  }

  async findPlaydataByFilter(
    account: User,
    filterDto: FilterDto,
  ): Promise<PlaydataEntity[]> {
    const playdataList = await this.playdataRepository.selectPlaydataByFilter(
      account.idx,
      account.updatedAt,
      filterDto.clearRankFilter,
      filterDto.scoreFilter,
      filterDto.levelFilter,
      filterDto.keyword,
    );
    if (playdataList === null || playdataList.length === 0) {
      throw new NoPlaydataException();
    }
    return playdataList.map((playdata) => PlaydataEntity.createDto(playdata));
  }

  async cachePlaydataByRedis(accountIdx: number): Promise<void> {
    const playdataEntity = await this.findPlaydataAll(accountIdx);
    await this.playdataRepository.setPlaydataAll(accountIdx, playdataEntity);
  }

  async deleteCachedPlaydata(accountIdx: number): Promise<void> {
    await this.playdataRepository.deletePlaydataByRedis(accountIdx);
  }
  async getPlaydataAllByRedis(accountIdx: number): Promise<PlaydataEntity[]> {
    const data = await this.playdataRepository.getPlaydataAll(accountIdx);
    if (data === null || data.length === 0) {
      return [];
    }

    return data;
  }

  async test(): Promise<void> {
    const user =
      await this.accountRepository.selectAccountBySdvxId('SV-5264-9170');
    console.log(user);
  }
}
