import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly accessKeyId = process.env.YANDEX_S3_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.YANDEX_S3_SECRET_ACCESS_KEY;
  private readonly bucket = process.env.YANDEX_S3_BUCKET;
  private readonly publicBaseUrl = process.env.YANDEX_S3_PUBLIC_BASE_URL;

  private readonly client = new S3Client({
    region: process.env.YANDEX_S3_REGION || 'ru-central1',
    endpoint: process.env.YANDEX_S3_ENDPOINT || 'https://storage.yandexcloud.net',
    credentials: {
      accessKeyId: this.accessKeyId || '',
      secretAccessKey: this.secretAccessKey || '',
    },
  });

  async uploadPoster(file: Express.Multer.File): Promise<string> {
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new ServiceUnavailableException('Хранилище постеров не настроено. Укажите ссылку на постер.');
    }
    const extension = file.mimetype.split('/')[1];
    const key = `posters/${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${key}`;
    }

    return `https://storage.yandexcloud.net/${this.bucket}/${key}`;
  }
}