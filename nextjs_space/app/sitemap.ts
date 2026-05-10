import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const headersList = headers();
  const host = headersList?.get?.('x-forwarded-host') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const siteUrl = host?.startsWith('http') ? host : `https://${host}`;

  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/dashboard`, lastModified: new Date() },
    { url: `${siteUrl}/threats`, lastModified: new Date() },
  ];
}
