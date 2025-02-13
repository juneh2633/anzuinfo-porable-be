import { PlaydataVfRaw } from '../model/playdata-vf-raw.model';

export class PlaydataVfRawEntity {
  score: number;
  rank: number;
  chartVf: number;
  createdAt: Date;

  constructor(data: any) {
    Object.assign(this, data);
  }

  public static createDto(playdataDao: PlaydataVfRaw) {
    return new PlaydataVfRawEntity({
      score: playdataDao.score,
      rank: playdataDao.rank,
      chartVf: playdataDao.chartVf,
    });
  }
}
