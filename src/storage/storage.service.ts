import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly bucket = process.env.YANDEX_S3_BUCKET;
  private readonly publicBaseUrl = process.env.YANDEX_S3_PUBLIC_BASE_URL;

  private readonly client = new S3Client({
    region: process.env.YANDEX_S3_REGION || 'ru-central1',
    endpoint: process.env.YANDEX_S3_ENDPOINT || 'https://storage.yandexcloud.net',
    credentials: {
      accessKeyId: process.env.YANDEX_S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.YANDEX_S3_SECRET_ACCESS_KEY || '',
    },
  });

  async uploadPoster(file: Express.Multer.File): Promise<string> {
    const extension = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : '.bin';

    const key = `posters/${randomUUID()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }

    return `https://storage.yandexcloud.net/${this.bucket}/${key}`;
  }
}