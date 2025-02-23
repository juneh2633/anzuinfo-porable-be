import { Chart, Playdata, Song } from '@prisma/client';
import { PlaydataEntity } from './Playdata.entity';

export class PlaydataCompareEntity {
  chartIdx: number;

  recentScore: number;
  recentRank: number;
  recentChartVf: number;
  score: number;
  rank: number;
  chartVf: number;

  constructor(data: any) {
    Object.assign(this, data);
  }
  public static createEntity(
    recentPlaydataEntity: PlaydataEntity,
    score: number,
    rank: number,
    chartVf: number,
  ) {
    return new PlaydataCompareEntity({
      chartIdx: recentPlaydataEntity.chartIdx,
      recentScore: recentPlaydataEntity.score,
      recentRank: recentPlaydataEntity.rank,
      recentChartVf: recentPlaydataEntity.chartVf,
      score: score,
      rank: rank,
      chartVf: chartVf,
    });
  }
}
