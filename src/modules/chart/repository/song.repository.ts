import { Injectable } from '@nestjs/common';
import { Song } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SongWithChartWithRadar } from '../model/SongWithChartWithRadar';
import { RedisService } from 'src/common/redis/redis.service';
import { SongWithChartEntity } from '../entity/SongWithChart.entity';
import { metaData } from 'src/common/lib/meta-data';

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
        },
      },
      orderBy: {
        idx: 'asc',
      },
    });
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

  async upsertSongData(song): Promise<void> {
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
    function getTypeIdx(type) {
      const typeMap = {
        novice: 1,
        advanced: 2,
        exhaust: 3,
        maximum: 4,
        infinite: 5,
        gravity: 6,
        heavenly: 7,
        vivid: 8,
        exceed: 9,
      };
      return typeMap[type] || null; // Return null if the type is not in the map
    }

    const createdSong = await this.prismaService.song.upsert({
      where: { idx: parseInt(song.songid, 10) },
      update: {
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
      },
      create: {
        idx: parseInt(song.songid, 10),
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
        chart: {
          create: song.difficulties.map((difficulty) => ({
            level: difficulty.level,
            type: difficulty.type,
            typeIdx: getTypeIdx(difficulty.type),
            jacket: difficulty.jacketArtPath,
            effector: difficulty.effectorName,
            illustrator: difficulty.illustratorName,
            maxExscore: parseInt(difficulty.max_exscore, 10),
            maxChain: parseInt(difficulty.max_chain, 10),
            chipCount: parseInt(difficulty.chip_count, 10),
            holdCount: parseInt(difficulty.hold_count, 10),
            tsumamiCount: parseInt(difficulty.tsumami_count, 10),
            deletedAt: null,
            radar: {
              create: {
                notes: difficulty.radar.notes,
                peak: difficulty.radar.peak,
                tsumami: difficulty.radar.tsumami,
                tricky: difficulty.radar.tricky,
                handtrip: difficulty.radar.handtrip,
                onehand: difficulty.radar.onehand,
              },
            },
          })),
        },
        genre: {
          create: song.genres.map((genre) => ({
            genreIdx: genresMap[genre],
          })),
        },
      },
    });
  }
}
