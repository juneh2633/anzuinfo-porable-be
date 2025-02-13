import { Injectable } from '@nestjs/common';
import { PlaydataRepository } from './repository/playdata.repository';
import { GetDataDto } from './dto/request/get-data.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';
import * as crypto from 'crypto';
import { CommonService } from 'src/common/common.service';
import { AccountRepository } from '../account/repository/account.repository';
import { NoUserException } from './exception/no-user.exception';
import { NoPlaydataException } from './exception/no-playdata.exception';
import { User } from '../auth/model/user.model';
import { AccountService } from '../account/account.service';
import { PlaydataWithChartEntity } from './entity/PlaydataWithChart.entity';
import { PlaydataEntity } from './entity/Playdata.entity';
import { VSEntity } from './entity/VS.entity';
import { FilterDto } from './dto/request/filter.dto';
import { PlaydataHistoryEntity } from './entity/PlaydataHistory.entity';
import { PlaydataVfRawEntity } from './entity/PlaydataVfRaw.entity';

@Injectable()
export class PlaydataService {
  constructor(
    private readonly playdataRepository: PlaydataRepository,
    private readonly commonService: CommonService,
    private readonly redisService: RedisService,
    private readonly accountRepository: AccountRepository,
    private readonly accountService: AccountService,
  ) {}

  async postData(getDataDto: GetDataDto) {
    console.log(getDataDto.user);
    const [sdvxId, playerName, forcePoint, skillLevel, playCount] =
      getDataDto.user.split('\t');
    const now = new Date();
    const user = await this.accountRepository.selectAccountBySdvxId(sdvxId);
    if (user === null) {
      throw new NoUserException();
    }

    const playdataPromises = getDataDto.tracks.map(async (track) => {
      const [title, type, status, score] = track.split('\t');

      const typeAndTitle = type + '____' + title;

      const safeKey = crypto
        .createHash('sha256')
        .update(typeAndTitle, 'utf8')
        .digest('hex');

      let chartIdxWithLevel = '';
      if (title.startsWith('Prayer')) {
        if (title === 'Prayer (MÚSECA)') {
          if (type === 'novice') {
            chartIdxWithLevel = '7231@@6';
          } else if (type === 'advanced') {
            chartIdxWithLevel = '7232@@12';
          } else if (type === 'exhaust') {
            chartIdxWithLevel = '7233@@15';
          } else {
            chartIdxWithLevel = '7234@@18';
          }
        } else {
          if (type === 'novice') {
            chartIdxWithLevel = '2521@@6';
          } else if (type === 'advanced') {
            chartIdxWithLevel = '2522@@12';
          } else {
            chartIdxWithLevel = '2523@@18';
          }
        }
      } else {
        chartIdxWithLevel = await this.redisService.get(safeKey);
      }
      if (chartIdxWithLevel === null) {
        console.log(title);
        return null;
      }
      const [chartIdx, level] = chartIdxWithLevel.split('@@');

      const rankIdx = this.commonService.getRankIdx(status);

      return {
        accountIdx: user.idx,
        chartIdx: parseInt(chartIdx, 10),
        chartVf: this.commonService.getVolforce(
          parseInt(level, 10),
          parseInt(score, 10),
          rankIdx,
        ),
        rank: rankIdx,
        score: parseInt(score, 10),
        createdAt: now,
      };
    });

    const playdata = await Promise.all(playdataPromises);

    const validPlaydata = playdata.filter((data) => data !== null);
    await this.playdataRepository.insertPlaydataList(validPlaydata);
    await this.accountRepository.updateAccountPlaydata(
      user.idx,
      playerName,
      parseInt(playCount, 10),
      Math.round(parseFloat(forcePoint) * 1000),
      skillLevel,
      now,
    );

    await this.setPlaydataByRedis(user.idx);
    console.log(`${validPlaydata.length}개의 데이터가 저장되었습니다.`);
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
    const playdataList = await this.playdataRepository.selectPlaydataAll(
      accountIdx,
      target.updatedAt,
    );
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

  async setPlaydataByRedis(accountIdx: number): Promise<void> {
    const playdataEntity = await this.findPlaydataAll(accountIdx);
    await this.playdataRepository.setPlaydataAll(accountIdx, playdataEntity);
  }

  async getPlaydataAllByRedis(accountIdx: number): Promise<PlaydataEntity[]> {
    const data = await this.playdataRepository.getPlaydataAll(accountIdx);
    if (data === null || data.length === 0) {
      throw new NoPlaydataException();
    }

    return data;
  }

  // atest
}
