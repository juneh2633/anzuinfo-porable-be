import { Injectable, NotFoundException } from '@nestjs/common';
import { ChartRepository } from './repository/chart.repository';
import { RadarRepository } from './repository/radar.repository';
import { ChartWithRadarEntity } from './entity/ChartWithRadar.entity';
import { NoChartException } from './exception/no-chart.exception';

import * as crypto from 'crypto';
import { SongWithChartEntity } from './entity/SongWithChart.entity';
import { SongRepository } from './repository/song.repository';
import { VersionEntity } from './entity/Version.entity';

import { PrismaService } from 'src/common/prisma/prisma.service';
import { RandomChartQueryDto } from './dto/request/random-chart-query.dto';
import { Chart, Song } from '@prisma/client';

type ChartWithSong = Chart & { song: Song };

@Injectable()
export class ChartService {
  constructor(
    private readonly chartRepository: ChartRepository,
    private readonly radarRepository: RadarRepository,
    private readonly songRepository: SongRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findChartByIdx(chartIdx: number): Promise<ChartWithRadarEntity> {
    const [chart, radar] = await Promise.all([
      this.chartRepository.selectChartByIdx(chartIdx),
      this.radarRepository.selectRadarByChartIdx(chartIdx),
    ]);

    if (chart === null) {
      throw new NoChartException();
    }
    return ChartWithRadarEntity.createDto(chart, radar);
  }

  async cacheChart(): Promise<void> {
    const dataList = await this.chartRepository.selectTypeWithTitle();
    for (const data of dataList) {
      const idx = data.idx;

      if (
        data.type !== 'novice' &&
        data.type !== 'advanced' &&
        data.type !== 'exhaust' &&
        data.type !== 'maximum' &&
        data.type !== 'ultimate'
      ) {
        data.type = 'infinite';
      }
      const typeAndTitle = data.type + '____' + data.song.title;
      const safeKey = crypto
        .createHash('sha256')
        .update(typeAndTitle, 'utf8')
        .digest('hex');
      const idxWithLevel = idx.toString() + '@@' + data.level.toString();
      await this.chartRepository.setChartIdx(idxWithLevel, safeKey);
    }
  }

  async findSongAll(): Promise<SongWithChartEntity[]> {
    const songList = await this.songRepository.selectSongAll();

    if (songList === null || songList.length === 0) {
      throw new NoChartException();
    }

    return SongWithChartEntity.createMany(songList);
  }
  async cacheSongAll(): Promise<void> {
    const data: SongWithChartEntity[] = await this.findSongAll();
    await this.songRepository.setMetaData(data);
  }

  async findSongAllByRedis(): Promise<any> {
    return await this.songRepository.getMetaData();
  }

  async findVersion(): Promise<VersionEntity> {
    const curVersion = await this.songRepository.getDataVersion();

    return VersionEntity.createDto(curVersion);
  }

  async insertVersion(version: string): Promise<void> {
    await this.songRepository.setDataVersion(version);
  }

  async insertSong(): Promise<void> {
    // const songs = newSong;
    // songs.map(async (song) => {
    //   await this.songRepository.upsertSongData(song);
    // });
    // await this.cacheChart();
  }

  async findRandomChart(
    query: RandomChartQueryDto,
  ): Promise<ChartWithSong[]> {
    const {
      minLevel = 1,
      maxLevel = 20,
      minVersion = 1,
      maxVersion = 999,
      count = 1,
    } = query;

    const candidates = await this.prisma.chart.findMany({
      where: {
        level: {
          gte: minLevel,
          lte: maxLevel,
        },
        deletedAt: null,
        song: {
          version: {
            gte: minVersion,
            lte: maxVersion,
          },
        },
      },
      include: {
        song: true,
      },
    });

    if (!candidates.length) {
      throw new NoChartException();
    }

    return this.pickRandom(candidates, count);
  }

  async findRandomMegamixChart(
    query: RandomChartQueryDto,
  ): Promise<ChartWithSong[]> {
    const {
      minLevel = 1,
      maxLevel = 20,
      minVersion = 1,
      maxVersion = 999,
      count = 1,
    } = query;

    const candidates = await this.prisma.chart.findMany({
      where: {
        level: {
          gte: minLevel,
          lte: maxLevel,
        },
        deletedAt: null,
        song: {
          version: {
            gte: minVersion,
            lte: maxVersion,
          },
          // Megamix가 있는 곡만
          megamix: {
            some: {},
          },
        },
      },
      include: {
        song: true,
      },
    });

    if (!candidates.length) {
      throw new NoChartException();
    }

    return this.pickRandom(candidates, count);
  }

  private pickRandom<T>(arr: T[], count: number): T[] {
    if (arr.length <= count) return arr;

    const result: T[] = [];
    const used = new Set<number>();

    while (result.length < count) {
      const i = Math.floor(Math.random() * arr.length);
      if (!used.has(i)) {
        used.add(i);
        result.push(arr[i]);
      }
    }

    return result;
  }


  async findMegamixChart(
    query: RandomChartQueryDto,
  ): Promise<ChartWithSong[]> {
    const {
      minLevel = query.minLevel ?? 1,
      maxLevel = query.maxLevel ?? 20,
      minVersion = query.minVersion ?? 1,
      maxVersion = query.maxVersion ?? 6,
    } = query;

    const candidates = await this.prisma.chart.findMany({
      where: {
        level: {
          gte: minLevel,
          lte: maxLevel,
        },
        deletedAt: null,
        song: {
          version: {
            gte: minVersion,
            lte: maxVersion,
          },    
          // Megamix가 있는 곡만
          megamix: {
            some: {},
          },
        },
      },
      include: {
        song: true,
      },
      orderBy: {
        song:{
          date: 'asc',
        }
      },
    });

    if (!candidates.length) {
      throw new NoChartException();
    }

    return candidates;
  }
}
