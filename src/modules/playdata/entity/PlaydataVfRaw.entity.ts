import { CommonService } from 'src/common/common.service';
import { PlaydataVfRaw } from '../model/playdata-vf-raw.model';

export class PlaydataVfRawEntity {
  title: string;
  level: string;
  jacket: string;
  type: string;
  score: number;
  clearRankIdx: number;
  chartVf: number;

  constructor(data: any) {
    Object.assign(this, data);
  }

  public static createDto(playdataDao: PlaydataVfRaw) {
    return new PlaydataVfRawEntity({
      title: playdataDao.chart.song.title,
      level: playdataDao.chart.level,
      jacket: playdataDao.chart.jacket,
      type: playdataDao.chart.type,
      score: playdataDao.score,
      clearRankIdx: playdataDao.rank,
      chartVf: playdataDao.chartVf,
    });
  }
}
