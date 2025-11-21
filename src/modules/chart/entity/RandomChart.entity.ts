import { Chart, Song } from '@prisma/client';

export class RandomChartEntity {
  level: number;
  type: string | null;
  jacket: string | null;
  title: string;
  version: number;
  date: Date;

  static from(chart: Chart & { song: Song }): RandomChartEntity {
    return {
      level: chart.level,
      type: chart.type ?? null,
      jacket: chart.jacket ?? null,
      title: chart.song.title,
      version: chart.song.version,
      date: chart.song.date,
    };
  }
}
