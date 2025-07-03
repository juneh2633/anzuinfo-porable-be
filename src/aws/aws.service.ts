import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import awsConfig from './config/aws.config';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class AwsService {
  private readonly S3Client: S3Client = new S3Client(awsConfig().aws);
  constructor() {}

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const name = uuidv4();
    const bucketName = process.env.AWS_BUCKET;
    const region = process.env.AWS_REGION;
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Unsupported file type');
    }

    const res = await this.S3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: name,
        Body: file.buffer,

        ContentType: file.mimetype,
      }),
    );
    if (res.$metadata.httpStatusCode !== 200) {
      throw new BadRequestException('Failed to upload file to S3');
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${name}`;
  }
}
