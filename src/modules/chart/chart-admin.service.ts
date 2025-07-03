import { Injectable, NotFoundException } from '@nestjs/common';
import { ChartRepository } from './repository/chart.repository';
import { RadarRepository } from './repository/radar.repository';

import { SongRepository } from './repository/song.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import axios from 'axios';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
}
