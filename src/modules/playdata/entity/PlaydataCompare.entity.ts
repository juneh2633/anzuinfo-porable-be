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
    recentPlaydataEntity: PlaydataEntity | undefined,
    score: number,
    rank: number,
    chartVf: number,
  ) {
    return new PlaydataCompareEntity({
      chartIdx: recentPlaydataEntity?.chartIdx ?? null,
      recentScore: recentPlaydataEntity?.score ?? null,
      recentRank: recentPlaydataEntity?.rank ?? null,
      recentChartVf: recentPlaydataEntity?.chartVf ?? null,
      score: score,
      rank: rank,
      chartVf: chartVf,
    });
  }
}
