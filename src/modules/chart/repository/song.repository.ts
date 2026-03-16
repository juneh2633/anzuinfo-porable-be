import { Injectable } from '@nestjs/common';
import { Song } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SongWithChartWithRadar } from '../model/SongWithChartWithRadar';
import { RedisService } from 'src/common/redis/redis.service';
import { SongWithChartEntity } from '../entity/SongWithChart.entity';
import { metaData } from 'src/common/lib/meta-data';
import { NewSongDto } from '../dto/request/new-song.dto';
import { getTypeCode } from 'src/common/util/getTypeCode';
import { startWith } from 'rxjs';

@Injectable()
export class SongRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async selectSongList(): Promise<{ idx: number; title: string }[]> {
    const songList = this.prismaService.song.findMany({
      select: {
        idx: true,
        title: true,
      },
      orderBy: {
        idx: 'asc',
      },
    });
    return songList;
  }

  async selectSongByIdx(idx: number): Promise<Song | null> {
    const song = await this.prismaService.song.findFirst({
      where: {
        idx: idx,
      },
    });
    return song;
  }

  async selectSongAll(): Promise<SongWithChartWithRadar[]> {
    return this.prismaService.song.findMany({
      include: {
        chart: {
          include: {
            radar: true,
          },
          orderBy:{ 
            idx: 'asc' 
          }
        },
      },
      orderBy: {
        idx: 'asc',
      },
    });
  }

  async selectSongByKeyword(key: string): Promise<Song[] | null> {
    const songList = await this.prismaService.song.findMany({
      where: {
        title: {
          contains: key,
          mode: 'insensitive',
        },
      },
    });
    return songList;
  }

  async setDataVersion(version: string): Promise<void> {
    await this.redisService.set('version@@@@@', version);
  }
  async getDataVersion(): Promise<string> {
    return await this.redisService.get('version@@@@@');
  }

  async setMetaData(data: SongWithChartEntity[]): Promise<void> {
    const serializedData = JSON.stringify({
      chartData: data,
      metaData: metaData,
    });
    console.log(serializedData);
    await this.redisService.set('metadata@@@@@@', serializedData);
  }

  async getMetaData(): Promise<any> {
    const serializedData = await this.redisService.get('metadata@@@@@@');
    return JSON.parse(serializedData);
  }

  /**
   * 최종 저장할 songIdx를 결정합니다.
   * 1. title로 기존 곡 검색 → 존재하면 해당 idx 반환 (update)
   * 2. 없으면 officialIdx 사용 시도
   *    - officialIdx가 비어있으면 그대로 사용
   *    - officialIdx가 다른 곡으로 점유되어 있으면 → 현재 최대 idx + 1 반환
   */
  private async resolveTargetIdx(
    title: string,
    officialIdx: number,
  ): Promise<{ idx: number; existingSongIdx: number | null }> {
    // 1. title로 기존 곡 조회
    const byTitle = await this.prismaService.song.findFirst({
      where: { title },
      select: { idx: true },
    });
    if (byTitle) {
      return { idx: byTitle.idx, existingSongIdx: byTitle.idx };
    }

    // 2. officialIdx가 비어있는지 확인
    const byIdx = await this.prismaService.song.findUnique({
      where: { idx: officialIdx },
      select: { idx: true },
    });
    if (!byIdx) {
      return { idx: officialIdx, existingSongIdx: null };
    }

    // 3. officialIdx가 이미 다른 곡에 점유 → max + 1
    const maxSong = await this.prismaService.song.findFirst({
      select: { idx: true },
      orderBy: { idx: 'desc' },
    });
    const nextIdx = (maxSong?.idx ?? 0) + 1;
    console.log(`⚠️ songId ${officialIdx} conflict for "${title}" → using idx ${nextIdx}`);
    return { idx: nextIdx, existingSongIdx: null };
  }

  async upsertSongData(song: NewSongDto): Promise<void> {
    const genresMap = {
      BEMANI: 1,
      ボーカロイド: 2,
      SDVXオリジナル: 3,
      'EXIT TUNES': 4,
      FLOOR: 5,
      東方アレンジ: 6,
      'ひなビタ♪/バンめし♪': 7,
      'POPS&アニメ': 8,
      その他: 9,
    };

    const officialIdx = parseInt(song.songid, 10);
    const { idx, existingSongIdx } = await this.resolveTargetIdx(song.title, officialIdx);

    const songData = {
      title: song.title,
      artist: song.artist,
      ascii: song.ascii,
      asciiTitle: song.ascii_title,
      asciiArtist: song.ascii_artist,
      titleYomigana: song.title_yomigana,
      artistYomigana: song.artist_yomigana,
      version: parseInt(song.version, 10),
      bpm: song.bpm,
      date: new Date(`${song.date}T00:00:00Z`),
      konaste: song.eac_exc,
      mainBpm: null,
      genreTxt: JSON.stringify(song.genres),
    };

    const chartCreateData = song.difficulties.map((difficulty) => ({
      level: difficulty.level,
      type: difficulty.type,
      typeIdx: getTypeCode(difficulty.type),
      jacket: difficulty.jacketArtPath ?? 'https://anzuinfo.s3.ap-northeast-2.amazonaws.com/0_maximum.jpg',
      chartImg: difficulty.imagePath ?? null,
      effector: difficulty.effectorName,
      illustrator: difficulty.illustratorName,
      maxExscore: parseInt(difficulty.max_exscore, 10) || 0,
      maxChain: parseInt(difficulty.max_chain, 10) || 0,
      chipCount: parseInt(difficulty.chip_count, 10) || 0,
      holdCount: parseInt(difficulty.hold_count, 10) || 0,
      tsumamiCount: parseInt(difficulty.tsumami_count, 10) || 0,
      deletedAt: null,
      radar: {
        create: {
          notes: difficulty.radar.notes ?? 0,
          peak: difficulty.radar.peak ?? 0,
          tsumami: difficulty.radar.tsumami ?? 0,
          tricky: difficulty.radar.tricky ?? 0,
          handtrip: difficulty.radar.handtrip ?? 0,
          onehand: difficulty.radar.onehand ?? 0,
        },
      },
    }));

    if (existingSongIdx !== null) {
      // 이미 존재하는 곡 → 기본 정보 update + 차트 동기화
      await this.prismaService.song.update({
        where: { idx: existingSongIdx },
        data: songData,
      });
      await this.syncChartsForSong(existingSongIdx, song.difficulties);
      console.log(`🔄 Updated existing song idx=${existingSongIdx} "${song.title}"`);
    } else {
      // 신규 곡 → create
      await this.prismaService.song.create({
        data: {
          idx,
          ...songData,
          chart: { create: chartCreateData },
          genre: {
            create: song.genres.map((genre) => ({
              genreIdx: genresMap[genre],
            })),
          },
        },
      });
      console.log(`✅ Created new song idx=${idx} "${song.title}" (officialIdx=${officialIdx})`);
    }
  }

  async selectGreatestIdx() {
    return await this.prismaService.song.findFirst({
      select: {
        idx: true,
      },
      orderBy: {
        idx: 'desc',
      },
    });
  }

  /**
   * JSON difficulty 배열을 기준으로 특정 곡의 차트를 동기화합니다.
   * - level + type이 일치하는 차트가 있으면 → 공식 데이터로 update + radar update
   * - 없으면 → 신규 chart + radar create
   */
  private async syncChartsForSong(
    songIdx: number,
    difficulties: import('../dto/request/new-song.dto').DifficultyDto[],
  ): Promise<void> {
    for (const difficulty of difficulties) {
      const existingChart = await this.prismaService.chart.findFirst({
        where: {
          songIdx,
          level: difficulty.level,
          type: difficulty.type,
        },
        include: { radar: true },
      });

      const chartData = {
        level: difficulty.level,
        type: difficulty.type,
        typeIdx: getTypeCode(difficulty.type),
        jacket: difficulty.jacketArtPath ?? undefined,
        chartImg: difficulty.imagePath ?? null,
        effector: difficulty.effectorName,
        illustrator: difficulty.illustratorName,
        maxExscore: parseInt(difficulty.max_exscore, 10) || 0,
        maxChain: parseInt(difficulty.max_chain, 10) || 0,
        chipCount: parseInt(difficulty.chip_count, 10) || 0,
        holdCount: parseInt(difficulty.hold_count, 10) || 0,
        tsumamiCount: parseInt(difficulty.tsumami_count, 10) || 0,
      };

      const radarData = {
        notes: difficulty.radar.notes ?? 0,
        peak: difficulty.radar.peak ?? 0,
        tsumami: difficulty.radar.tsumami ?? 0,
        tricky: difficulty.radar.tricky ?? 0,
        handtrip: difficulty.radar.handtrip ?? 0,
        onehand: difficulty.radar.onehand ?? 0,
      };

      if (existingChart) {
        // 차트 데이터 업데이트
        await this.prismaService.chart.update({
          where: { idx: existingChart.idx },
          data: chartData,
        });

        if (existingChart.radar.length > 0) {
          // 레이더 업데이트
          await this.prismaService.radar.update({
            where: { idx: existingChart.radar[0].idx },
            data: radarData,
          });
        } else {
          // 레이더가 없으면 생성
          await this.prismaService.radar.create({
            data: { chartIdx: existingChart.idx, ...radarData },
          });
        }
        console.log(`  🔄 Chart updated: songIdx=${songIdx} [${difficulty.type} Lv.${difficulty.level}]`);
      } else {
        // 신규 차트 + 레이더 생성
        const newChart = await this.prismaService.chart.create({
          data: {
            songIdx,
            ...chartData,
            jacket: difficulty.jacketArtPath ?? 'https://anzuinfo.s3.ap-northeast-2.amazonaws.com/0_maximum.jpg',
            deletedAt: null,
          },
        });
        await this.prismaService.radar.create({
          data: { chartIdx: newChart.idx, ...radarData },
        });
        console.log(`  ✅ Chart created: songIdx=${songIdx} [${difficulty.type} Lv.${difficulty.level}]`);
      }
    }
  }
}
