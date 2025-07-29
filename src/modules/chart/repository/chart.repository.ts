import { Injectable } from '@nestjs/common';
import { Chart } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class ChartRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async selectChartByIdx(idx: number): Promise<Chart | null> {
    const chart = await this.prismaService.chart.findFirst({
      where: {
        idx: idx,
      },
    });
    return chart;
  }

  async selectChartBySongIdx(songIdx: number): Promise<Chart[]> {
    const chartList = await this.prismaService.chart.findMany({
      where: {
        songIdx: songIdx,
      },
    });
    return chartList;
  }

  async selectTypeWithTitle(): Promise<any[]> {
    const chartList = await this.prismaService.chart.findMany({
      select: {
        idx: true,
        type: true,
        song: true,
        level: true,
      },
      orderBy: {
        idx: 'asc',
      },
    });
    return chartList;
  }

  async selectChartAll(): Promise<Chart[]> {
    return await this.prismaService.chart.findMany({});
  }

  async setChartIdx(idxWithLevel: string, typeAndTitle: string): Promise<void> {
    await this.redisService.set(typeAndTitle, idxWithLevel);
  }

  async insertChartBySongIdx(
    songIdx: number,
    level: number,
    type: string,
    typeIdx: number,
    effectorName: string,
    illustratorName: string,
    jacket: string,
  ): Promise<void> {
    await this.prismaService.chart.create({
      data: {
        songIdx: songIdx,
        level: level,
        type: type,
        effector: effectorName,
        illustrator: illustratorName,
        jacket:
          'https://anzuinfo.s3.ap-northeast-2.amazonaws.com/0_maximum.jpg',
        radar: {
          create: {
            notes: 0,
            peak: 0,
            tsumami: 0,
            tricky: 0,
            handtrip: 0,
            onehand: 0,
          },
        },
        maxExscore: 0,
        maxChain: 0,
        chipCount: 0,
        holdCount: 0,
        tsumamiCount: 0,
        typeIdx: typeIdx,
      },
    });
  }
}
