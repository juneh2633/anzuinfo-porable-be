import { Injectable } from '@nestjs/common';
import { Chart, Radar } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class RadarRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async selectRadarByChartIdx(chartIdx: number): Promise<Radar | null> {
    const radar = await this.prismaService.radar.findFirst({
      where: {
        chartIdx: chartIdx,
      },
    });
    return radar;
  }

  async selectRadarAll(): Promise<Radar[]> {
    return await this.prismaService.radar.findMany({});
  }
}
