import { SongWithChartWithRadar } from '../model/SongWithChartWithRadar';

export class SongWithIdxEntity {
  songIdx: number;
  title: string;

  constructor(data: any) {
    Object.assign(this, data);
  }
  public static createDto(songDao: SongWithChartWithRadar) {
    return new SongWithIdxEntity({
      songIdx: songDao.idx,
      title: songDao.title,
    });
  }
}
