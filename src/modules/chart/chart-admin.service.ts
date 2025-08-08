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

@Injectable()
export class ChartAdminService {
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESSKEYID,
      secretAccessKey: process.env.AWS_SECRETACCESSKEY,
    },
  });
  private readonly bucket = process.env.AWS_BUCKET;
  constructor(
    private readonly chartRepository: ChartRepository,
    private readonly radarRepository: RadarRepository,
    private readonly songRepository: SongRepository,
    private readonly prisma: PrismaService,
  ) {}

  async uploadJacketAll() {
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

  async uploadSong(newSongDto: NewSongDto): Promise<void> {
    console.log(newSongDto);
    await this.songRepository.upsertSongData(newSongDto);
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
