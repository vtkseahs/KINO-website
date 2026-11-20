import { resolve } from 'node:path';

export function databaseUrl(target: 'prisma' | 'pg') {
  const value =
    target === 'prisma'
      ? process.env.DIRECT_URL || process.env.DATABASE_URL
      : process.env.DATABASE_URL;
  if (!value) return undefined;
  const url = new URL(value);
  const certificate = process.env.DATABASE_CA_FILE;
  if (certificate) {
    url.searchParams.set('sslmode', 'require');
    if (target === 'prisma') {
      url.searchParams.set('sslcert', resolve(certificate));
    } else {
      url.searchParams.set('sslmode', 'verify-full');
      url.searchParams.set('sslrootcert', resolve(certificate));
      url.searchParams.delete('sslcert');
    }
  }
  return url;
}
