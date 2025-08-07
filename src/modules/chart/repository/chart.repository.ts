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
    radar: {
      notes: number;
      peak: number;
      tsumami: number;
      tricky: number;
      handtrip: number;
      onehand: number;
    },
  ): Promise<void> {
    await this.prismaService.chart.create({
      data: {
        songIdx: songIdx,
        level: level,
        type: type,
        effector: effectorName,
        illustrator: illustratorName,
        jacket:
          jacket ??
          'https://anzuinfo.s3.ap-northeast-2.amazonaws.com/0_maximum.jpg',
        radar: {
          create: {
            notes: radar.notes,
            peak: radar.peak,
            tsumami: radar.tsumami,
            tricky: radar.tricky,
            handtrip: radar.handtrip,
            onehand: radar.onehand,
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

  async updateChartByChartIdx(
    chartIdx: number,
    songIdx: number,
    level: number,
    type: string,
    typeIdx: number,
    effectorName: string,
    illustratorName: string,
    radar: {
      notes: number;
      peak: number;
      tsumami: number;
      tricky: number;
      handtrip: number;
      onehand: number;
    },
  ): Promise<void> {
    // 먼저 차트 정보 업데이트
    await this.prismaService.chart.update({
      where: {
        idx: chartIdx,
      },
      data: {
        songIdx: songIdx,
        level: level,
        type: type,
        effector: effectorName,
        illustrator: illustratorName,
        typeIdx: typeIdx,
      },
    });

    // radar 정보 업데이트 (chartIdx로 직접 업데이트)
    await this.prismaService.radar.updateMany({
      where: {
        chartIdx: chartIdx,
      },
      data: {
        notes: radar.notes,
        peak: radar.peak,
        tsumami: radar.tsumami,
        tricky: radar.tricky,
        handtrip: radar.handtrip,
        onehand: radar.onehand,
      },
    });
  }
}
