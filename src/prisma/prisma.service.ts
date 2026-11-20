import 'dotenv/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { databaseUrl } from './database-url';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = databaseUrl('pg');
    if (!url) throw new Error('Не задана переменная DATABASE_URL');
    const schema = url.searchParams.get('schema') || 'public';
    const adapter = new PrismaPg(
      { connectionString: url.href, connectionTimeoutMillis: 5000 },
      { schema },
    );
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
