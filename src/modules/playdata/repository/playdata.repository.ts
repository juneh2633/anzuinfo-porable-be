import { Injectable } from '@nestjs/common';
import { Playdata, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

import { PlaydataWithChartAndSong } from '../model/playdata-chart-and-song.model';
import { PlaydataUser } from '../model/playdata-user.model';
import { PlaydataVS } from '../model/playdata-vs.model';
import { FilterDto } from '../dto/request/filter.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { PlaydataEntity } from '../entity/Playdata.entity';
import { PlaydataVfRaw } from '../model/playdata-vf-raw.model';
import { PlaydataDao } from '../dao/playdata.dao';

@Injectable()
export class PlaydataRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async insertPlaydata(
    accountIdx: number,
    chartIdx: number,
    chartVf: number,
    rank: number,
    score: number,
    prismaTx: Prisma.TransactionClient | null,
  ): Promise<void> {
    const prisma = prismaTx ? prismaTx : this.prismaService;
    await prisma.playdata.create({
      data: {
        account: { connect: { idx: accountIdx } },
        chart: { connect: { idx: chartIdx } },
        chartVf: chartVf,
        rank: rank,
        score: score,
      },
    });
  }

  async insertPlaydataList(playdataList: PlaydataDao[]): Promise<void> {
    await this.prismaService.playdata.createMany({
      data: playdataList,
    });
  }

  async selectVF(accountIdx: number, updatedAt: Date): Promise<Playdata[]> {
    if (!updatedAt) return [];
    // chart별 최고점(가장 최근 기록) 기준 VF 상위 50개
    const allBest = await this.prismaService.playdata.findMany({
      where: { accountIdx },
      distinct: ['chartIdx'],
      orderBy: [{ chartIdx: 'asc' }, { createdAt: 'desc' }],
    });
    return allBest
      .sort((a, b) => b.chartVf - a.chartVf)
      .slice(0, 50);
  }

  async selectVFRaw(
    accountIdx: number,
    updatedAt: Date,
  ): Promise<PlaydataVfRaw[]> {
    if (!updatedAt) return [];
    // chart별 최고점(가장 최근 기록) 기준 VF 상위 50개
    const allBest = await this.prismaService.playdata.findMany({
      where: { accountIdx },
      distinct: ['chartIdx'],
      orderBy: [{ chartIdx: 'asc' }, { createdAt: 'desc' }],
      select: {
        chartIdx: true,
        chartVf: true,
        rank: true,
        score: true,
        createdAt: true,
        chart: {
          select: {
            song: { select: { title: true } },
            level: true,
            jacket: true,
            type: true,
          },
        },
      },
    });
    return allBest
      .sort((a, b) => b.chartVf - a.chartVf)
      .slice(0, 50) as PlaydataVfRaw[];
  }

  async selectPlaydataByChart(
    accountIdx: number,
    updatedAt: Date,
    chartIdx: number,
  ): Promise<Playdata | null> {
    if (!updatedAt) return null;
    // 해당 chart의 all-time best 기록
    return await this.prismaService.playdata.findFirst({
      where: {
        accountIdx: accountIdx,
        chartIdx: chartIdx,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async selectPlaydataHistoryByChart(
    accountIdx: number,
    chartIdx: number,
  ): Promise<Playdata[]> {
    return await this.prismaService.playdata.findMany({
      where: {
        accountIdx: accountIdx,
        chartIdx: chartIdx,
      },
      distinct: ['score'],
      orderBy: {
        score: 'desc',
      },
      take: 5,
    });
  }

  async selectPlaydataAll(accountIdx: number): Promise<Playdata[]> {
    return await this.prismaService.playdata.findMany({
      where: {
        accountIdx: accountIdx,
      },
      distinct: ['chartIdx'],
      // score 기준 all-time best (점수 최고점 우선)
      orderBy: [{ chartIdx: 'asc' }, { score: 'desc' }],
    });
  }

  async selectVsData(accountIdx: number, targetIdx: number, page: number) {
    return await this.prismaService.playdata.findMany({
      where: {
        accountIdx: accountIdx,
      },
      orderBy: {
        chartIdx: 'asc',
      },
    });
  }

  async selectPlaydataByLevel(
    accountIdx: number,
    updatedAt: Date,
    level: number,
  ): Promise<Playdata[]> {
    if (!updatedAt) return [];
    // 해당 level의 chart별 all-time best 기록
    const all = await this.prismaService.playdata.findMany({
      where: {
        accountIdx: accountIdx,
        chart: { level: level },
      },
      distinct: ['chartIdx'],
      orderBy: [{ chartIdx: 'asc' }, { createdAt: 'desc' }],
    });
    return all.sort((a, b) => b.score - a.score);
  }

  async selectPlaydataRankingByChart(
    chartIdx: number,
  ): Promise<PlaydataUser[]> {
    return await this.prismaService.playdata.findMany({
      where: {
        chartIdx: chartIdx,
        account: {
          deletedAt: null,
          isHidden: 0,
        },
      },
      include: {
        account: {
          select: {
            idx: true,
            sdvxId: true,
            playerName: true,
            skillLevel: true,
            updatedAt: true,
            vf: true,
          },
        },
      },
    });
  }

  async selectVSDataPrisma(
    userAccountIdx: number,
    targetAccountIdx: number,
    page: number,
    limit = 20,
  ): Promise<PlaydataVS[]> {
    const offset = (page - 1) * limit;
    const result = await this.prismaService.$queryRaw<PlaydataVS[]>`
      SELECT
          COALESCE(my.chart_idx, rival.chart_idx) AS "chartIdx",
          json_build_object('score', my.score, 'rank', my.rank) AS playdata,
          json_build_object('score', rival.score, 'rank', rival.rank) AS "rivalPlaydata"
      FROM (
          SELECT playdata.chart_idx, playdata.score, playdata.rank
          FROM playdata
          JOIN account ON playdata.account_idx = account.idx
          WHERE account.idx = ${userAccountIdx} AND playdata.created_at = account.update_at
      ) my
      FULL OUTER JOIN (
          SELECT playdata.chart_idx, playdata.score, playdata.rank
          FROM playdata
          JOIN account  ON playdata.account_idx = account.idx
          WHERE account.idx = ${targetAccountIdx} AND playdata.created_at = account.update_at
      ) rival
      ON my.chart_idx = rival.chart_idx
      WHERE my.chart_idx IS NOT NULL OR rival.chart_idx IS NOT NULL
      ORDER BY "chartIdx" ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return result;
  }

  async selectPlaydataByFilter(
    accountIdx: number,
    updatedAt: Date,
    clearRankFilter: number[],
    scoreFilter: number[],
    levelFilter: number[],
    keyword: string,
  ): Promise<Playdata[]> {
    if (!updatedAt) return [];
    const result = await this.prismaService.playdata.findMany({
      where: {
        accountIdx: accountIdx,
        scoreIdx: scoreFilter?.length
          ? {
              in: scoreFilter,
            }
          : undefined,
        rank: clearRankFilter?.length
          ? {
              in: clearRankFilter,
            }
          : undefined,
        chart: {
          level: levelFilter?.length
            ? {
                in: levelFilter,
              }
            : undefined,
          song: {
            title: keyword
              ? {
                  contains: keyword,
                  mode: 'insensitive',
                }
              : undefined,
          },
        },

        createdAt: updatedAt,
      },
      orderBy: {
        chartIdx: 'asc',
      },
    });
    return result;
  }

  async setPlaydataAll(
    accountIdx: number,
    playdataList: PlaydataEntity[],
  ): Promise<void> {
    const serializedData = JSON.stringify(playdataList);
    await this.redisService.set(accountIdx.toString(), serializedData);
  }

  async deletePlaydataByRedis(accountIdx: number): Promise<void> {
    await this.redisService.delete(accountIdx.toString());
  }

  async getPlaydataAll(accountIdx: number): Promise<PlaydataEntity[]> {
    const serializedData = await this.redisService.get(accountIdx.toString());
    if (!serializedData) {
      return [];
    }
    return JSON.parse(serializedData) as PlaydataEntity[];
  }

  async updateAllPlaydataVf(
    updates: { idx: number; chartVf: number }[],
  ): Promise<void> {
    // 5,000건씩 청크를 나누어 Raw Query로 벌크 업데이트 (메모리 폭발 방지)
    const chunkSize = 5000;
    
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      
      const values: any[] = [];
      const placeholders = chunk
        .map((update, index) => {
          // 인덱스 기반으로 파라미터 맵핑: $1, $2, $3...
          const idxParam = index * 2 + 1;
          const vfParam = index * 2 + 2;
          values.push(update.idx, update.chartVf);
          return `($${idxParam}::int, $${vfParam}::int)`;
        })
        .join(', ');

      const query = `
        UPDATE playdata AS p
        SET chart_vf = v.vf
        FROM (VALUES ${placeholders}) AS v(idx, vf)
        WHERE p.idx = v.idx;
      `;

      await this.prismaService.$executeRawUnsafe(query, ...values);
    }
  }

  async selectAllPlaydataWithChartLevel(): Promise<any[]> {
    return this.prismaService.playdata.findMany({
      select: {
        idx: true,
        score: true,
        rank: true,
        accountIdx: true,
        chart: {
          select: {
            level: true,
          }
        }
      }
    });
  }

  async findChartByTitleArtistType(
    title: string,
    artist: string,
    type: string,
  ): Promise<{ idx: number; level: number } | null> {
    const charts = await this.prismaService.chart.findMany({
      where: {
        type: type,
        song: {
          title: title,
        },
      },
      select: {
        idx: true,
        level: true,
        song: {
          select: {
            artist: true,
          },
        },
      },
    });

    if (charts.length === 0) return null;
    if (charts.length === 1) return { idx: charts[0].idx, level: charts[0].level };

    // 1. Exact match
    const exactMatch = charts.find(c => c.song?.artist === artist);
    if (exactMatch) return { idx: exactMatch.idx, level: exactMatch.level };

    // Helper for fuzzy string matching
    const cleanStr = (s: string) => s.replace(/\\s+/g, '').toLowerCase();
    const targetArtist = cleanStr(artist);

    // 2. Cleaned exact match
    const cleanMatch = charts.find(c => c.song?.artist && cleanStr(c.song.artist) === targetArtist);
    if (cleanMatch) return { idx: cleanMatch.idx, level: cleanMatch.level };

    // 3. Contains match (DB string contains scraper string)
    const containsMatch1 = charts.find(c => c.song?.artist && cleanStr(c.song.artist).includes(targetArtist));
    if (containsMatch1) return { idx: containsMatch1.idx, level: containsMatch1.level };

    // 4. Contains match (Scraper string contains DB string)
    const containsMatch2 = charts.find(c => c.song?.artist && targetArtist.includes(cleanStr(c.song.artist)));
    if (containsMatch2) return { idx: containsMatch2.idx, level: containsMatch2.level };

    // Fallback if we still couldn't resolve perfectly (better to save than drop)
    return { idx: charts[0].idx, level: charts[0].level };
  }
}
