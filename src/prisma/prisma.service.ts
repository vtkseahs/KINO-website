import 'dotenv/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbUrl = new URL(process.env.DATABASE_URL!);
    const ca = readFileSync(join(process.cwd(), 'ca.pem'), 'utf8');

    const adapter = new PrismaPg({
      host: dbUrl.hostname,
      port: Number(dbUrl.port),
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.slice(1),
      ssl: {
        rejectUnauthorized: true,
        ca,
      },
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}