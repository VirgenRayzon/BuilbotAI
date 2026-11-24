import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://buildbot.ph';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/builder', '/pre-builts', '/about', '/contact', '/faq', '/parts'],
      disallow: ['/admin', '/admin/*', '/system-access', '/system-access/*', '/api/*', '/profile', '/profile/*'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

