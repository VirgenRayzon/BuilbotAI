import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://buildbot.ph';
  const now = new Date();

  const routes = [
    '',
    '/builder',
    '/pre-builts',
    '/parts',
    '/about',
    '/contact',
    '/faq',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === '' || route === '/pre-builts' || route === '/parts' ? 'daily' : 'weekly') as
      | 'daily'
      | 'weekly',
    priority: route === '' ? 1.0 : route === '/builder' || route === '/pre-builts' ? 0.9 : 0.7,
  }));
}

