import { Playdata } from '@prisma/client';

export class PlaydataHistoryEntity {
  chartIdx: number;
  score: number;
  rank: number;
  chartVf: number;
  createdAt: Date;

  constructor(data: any) {
    Object.assign(this, data);
  }

  public static createDto(playdataDao: Playdata) {
    return new PlaydataHistoryEntity({
      chartIdx: playdataDao.chartIdx,
      score: playdataDao.score,
      rank: playdataDao.rank,
      chartVf: playdataDao.chartVf,
      createdAt: playdataDao.createdAt,
    });
  }
}
