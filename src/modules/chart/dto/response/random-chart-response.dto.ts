import { Chart, Song } from "@prisma/client";
import { RandomChartEntity } from "../../entity/RandomChart.entity";

export class RandomChartResponseDto {
  data: RandomChartEntity[];

  static from(charts: (Chart & { song: Song })[]): RandomChartResponseDto {
    return {
      data: charts.map(RandomChartEntity.from),
    };
  }
}
