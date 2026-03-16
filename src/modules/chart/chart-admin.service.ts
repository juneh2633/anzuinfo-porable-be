import { Injectable, NotFoundException } from '@nestjs/common';
import { ChartRepository } from './repository/chart.repository';
import { RadarRepository } from './repository/radar.repository';

import { SongRepository } from './repository/song.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';

import axios from 'axios';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NewChartDto } from './dto/request/new-chart.dto';
import { getTypeCode } from 'src/common/util/getTypeCode';
import { SongIdxWithTypeDto } from './dto/request/songIdx-with-type.dto';
import { NewSongDto } from './dto/request/new-song.dto';
import { UpdateChartDto } from './dto/request/update-chart.dto';
import { GreatestSongIdxEntity } from './entity/GreatestSongIdx.entity';
import * as crypto from 'crypto';
import awsConfig from '../../aws/config/aws.config';

@Injectable()
export class ChartAdminService {
  private readonly s3 = new S3Client(awsConfig().aws);
  private readonly bucket = process.env.AWS_BUCKET;
  constructor(
    private readonly chartRepository: ChartRepository,
    private readonly radarRepository: RadarRepository,
    private readonly songRepository: SongRepository,
    private readonly prisma: PrismaService,
  ) {}

  async uploadJacketAll() {
    if (!this.bucket) {
      throw new Error('AWS_BUCKET environment variable is required');
    }
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION environment variable is required');
    }
    
    const chartList = await this.chartRepository.selectChartAll();

    for (const chart of chartList) {
      try {
        const response = await axios.get(chart.jacket, {
          responseType: 'arraybuffer',
        });

        const key = `${chart.songIdx}_${chart.type ?? 'unknown'}.jpg`;

        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: response.data,
            ContentType: 'image/jpeg',
          }),
        );

        const s3Url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // await this.prisma.chart.update({
        //   where: { idx: chart.idx },
        //   data: { jacket: s3Url },
        // });

        console.log(`✅ ${chart.idx} => ${s3Url}`);
      } catch (err) {
        console.log(`❌ Failed to migrate chart idx ${chart.idx}`, err);
      }
    }
  }

  /**
   * JSON을 분석하여 저장 전 변경 내용을 반환합니다 (실제 저장 없음).
   */
  async previewSongs(songs: NewSongDto[]) {
    return Promise.all(songs.map((song) => this.previewOneSong(song)));
  }

  private async previewOneSong(song: NewSongDto) {
    const officialIdx = parseInt(song.songid, 10);

    // 1. title로 DB 조회
    const byTitle = await this.prisma.song.findFirst({
      where: { title: song.title },
      include: {
        chart: { include: { radar: true }, orderBy: { idx: 'asc' } },
      },
    });

    if (byTitle) {
      // 업데이트 코스 — 차트 diff
      const chartDiffs = song.difficulties.map((diff) => {
        const existing = byTitle.chart.find(
          (c) => c.level === diff.level && c.type === diff.type,
        );
        if (!existing) {
          return { type: diff.type, level: diff.level, status: 'new' as const };
        }
        const changes: Record<string, { before: unknown; after: unknown }> = {};
        const fields: Array<[string, unknown, unknown]> = [
          ['effector',     existing.effector,     diff.effectorName],
          ['illustrator',  existing.illustrator,  diff.illustratorName],
          ['maxExscore',   existing.maxExscore,   parseInt(diff.max_exscore, 10) || 0],
          ['maxChain',     existing.maxChain,     parseInt(diff.max_chain, 10) || 0],
          ['chipCount',    existing.chipCount,    parseInt(diff.chip_count, 10) || 0],
          ['holdCount',    existing.holdCount,    parseInt(diff.hold_count, 10) || 0],
          ['tsumamiCount', existing.tsumamiCount, parseInt(diff.tsumami_count, 10) || 0],
          ['level',        existing.level,        diff.level],
        ];
        for (const [key, before, after] of fields) {
          if (String(before) !== String(after)) changes[key] = { before, after };
        }
        // radar diff
        const r = existing.radar[0];
        if (r) {
          const radarFields: Array<[string, number, number]> = [
            ['notes',    r.notes,    diff.radar.notes ?? 0],
            ['peak',     r.peak,     diff.radar.peak ?? 0],
            ['tsumami',  r.tsumami,  diff.radar.tsumami ?? 0],
            ['tricky',   r.tricky,   diff.radar.tricky ?? 0],
            ['handtrip', r.handtrip, diff.radar.handtrip ?? 0],
            ['onehand',  r.onehand,  diff.radar.onehand ?? 0],
          ];
          for (const [key, before, after] of radarFields) {
            if (before !== after) changes[`radar.${key}`] = { before, after };
          }
        }
        return {
          type: diff.type,
          level: diff.level,
          status: Object.keys(changes).length > 0 ? 'update' : 'nochange' as const,
          changes,
        };
      });

      return {
        status: 'update' as const,
        title: song.title,
        existingIdx: byTitle.idx,
        officialIdx,
        charts: chartDiffs,
      };
    }

    // 2. 신규 코스 — idx conflict 확인
    const byIdx = await this.prisma.song.findUnique({
      where: { idx: officialIdx },
      select: { idx: true, title: true },
    });
    let resolvedIdx = officialIdx;
    let idxConflict = false;
    if (byIdx) {
      const max = await this.prisma.song.findFirst({ orderBy: { idx: 'desc' }, select: { idx: true } });
      resolvedIdx = (max?.idx ?? 0) + 1;
      idxConflict = true;
    }

    return {
      status: 'new' as const,
      title: song.title,
      officialIdx,
      resolvedIdx,
      idxConflict,
      conflictWith: byIdx?.title ?? null,
      charts: song.difficulties.map((d) => ({
        type: d.type,
        level: d.level,
        status: 'new' as const,
      })),
    };
  }

  async uploadSong(newSongDto: NewSongDto): Promise<void> {
    // difficulty별로 jacketArtPath를 S3에 업로드하고 URL을 교체
    const difficultiesWithS3Jackets = await Promise.all(
      newSongDto.difficulties.map(async (difficulty) => {
        if (!difficulty.jacketArtPath) return difficulty;
        try {
          const s3Url = await this.uploadJacketFromUrl(
            difficulty.jacketArtPath,
            `${newSongDto.songid}_${difficulty.type}.jpg`,
          );
          return { ...difficulty, jacketArtPath: s3Url };
        } catch (err) {
          console.log(`❌ Jacket download failed for ${newSongDto.songid} [${difficulty.type}]:`, err?.message);
          return difficulty;
        }
      }),
    );

    await this.songRepository.upsertSongData({
      ...newSongDto,
      difficulties: difficultiesWithS3Jackets,
    });
  }

  /**
   * 외부 URL에서 이미지를 다운받아 S3에 업로드하고 S3 URL 반환
   */
  private async uploadJacketFromUrl(imageUrl: string, key: string): Promise<string> {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] ?? 'image/jpeg';
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: response.data,
        ContentType: contentType,
      }),
    );
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async uploadJacketOne(
    songIdxWithTypeDto: SongIdxWithTypeDto,
    file: Express.Multer.File,
  ): Promise<void> {
    const key = `${songIdxWithTypeDto.songIdx}_${songIdxWithTypeDto.type}.jpg`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: 'image/jpeg',
      }),
    );

    // S3 URL 생성
    const s3Url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // 해당 songIdx와 type에 맞는 chart의 jacket 필드 업데이트
    await this.chartRepository.updateJacketBySongIdxAndType(
      parseInt(songIdxWithTypeDto.songIdx),
      songIdxWithTypeDto.type,
      s3Url,
    );
  }

  async uploadChartOne(newChartDto: NewChartDto): Promise<void> {
    const { songIdx, level, type, effectorName, illustratorName, radar } = newChartDto;
    const song = await this.songRepository.selectSongByIdx(songIdx);

    if (!song) {
      throw new NotFoundException('존재하지 않는 곡입니다.');
    }

    const chart = await this.chartRepository.selectChartBySongIdx(songIdx);
    let jacket;

    for (const c of chart) {
      if (c.level === level && c.type === type) {
        throw new NotFoundException('이미 존재하는 차트입니다.');
      }
      jacket = c.jacket;
    }
    let typeIdx = getTypeCode(type);

    await this.chartRepository.insertChartBySongIdx(
      songIdx,
      level,
      type,
      typeIdx,
      effectorName,
      illustratorName,
      jacket,
      radar,
    );

    // 새로 생성된 차트의 idx를 가져와서 캐시에 추가
    const newChart = await this.chartRepository.selectChartBySongIdx(songIdx);
    const createdChart = newChart.find(c => c.level === level && c.type === type);
    if (createdChart) {
      await this.cacheSingleChart(createdChart.idx, type, song.title, level);
    }
  }

  async getGreatestSongIdx(): Promise<GreatestSongIdxEntity> {
    const result = await this.songRepository.selectGreatestIdx();
    return GreatestSongIdxEntity.createDto(result);
  }

  async updateChartOne(updateChartDto: UpdateChartDto): Promise<void> {
    const { chartIdx, songIdx, level, type, effectorName, illustratorName, radar } = updateChartDto;
    
    // 차트가 존재하는지 확인
    const existingChart = await this.chartRepository.selectChartByIdx(chartIdx);
    if (!existingChart) {
      throw new NotFoundException('존재하지 않는 차트입니다.');
    }

    // 곡이 존재하는지 확인
    const song = await this.songRepository.selectSongByIdx(songIdx);
    if (!song) {
      throw new NotFoundException('존재하지 않는 곡입니다.');
    }

    let typeIdx = getTypeCode(type);
    console.log('Updating chart with data:', updateChartDto);
    await this.chartRepository.updateChartByChartIdx(
      chartIdx,
      songIdx,
      level,
      type,
      typeIdx,
      effectorName,
      illustratorName,
      radar,
    );

    // 차트 수정 후 캐시 업데이트
    await this.cacheSingleChart(chartIdx, type, song.title, level);
  }

  /**
   * 개별 차트를 캐시에 추가/업데이트
   */
  private async cacheSingleChart(chartIdx: number, type: string, title: string, level: number): Promise<void> {
    // 타입 검증 및 정규화
    if (
      type !== 'novice' &&
      type !== 'advanced' &&
      type !== 'exhaust' &&
      type !== 'maximum' &&
      type !== 'ultimate'
    ) {
      type = 'infinite';
    }

    const typeAndTitle = type + '____' + title;
    const safeKey = crypto
      .createHash('sha256')
      .update(typeAndTitle, 'utf8')
      .digest('hex');
    const idxWithLevel = chartIdx.toString() + '@@' + level.toString();
    
    await this.chartRepository.setChartIdx(idxWithLevel, safeKey);
  }
}
