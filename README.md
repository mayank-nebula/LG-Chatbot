import { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import postsData from "@/data/wisc_blog.json";

const BASE_URL = env.PUBLIC_SITE_URL;
const NOW = new Date();

function toUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

function toDate(date?: string | null): Date {
  if (!date) return NOW;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? NOW : parsed;
}

async function getPodcastsSlugs(): Promise<{ slug: string; date: string }[]> {
  try {
    const sql = `
      SELECT slug, date 
      FROM episodes_data
      ORDER BY date DESC
    `;

    const rows = await query<{
      slug: string;
      date: string;
    }>(sql, []);

    return rows;
  } catch (err) {
    console.error("[sitemap] Failed to fetch podcast slugs:", err);
    return [];
  }
}

async function getNewsSlugs(): Promise<{ slug: string; date: string }[]> {
  try {
    const sql = `
      SELECT slug, date 
      FROM articles_data
      ORDER BY date DESC
    `;

    const rows = await query<{
      slug: string;
      date: string;
    }>(sql, []);

    return rows;
  } catch (err) {
    console.error("[sitemap] Failed to fetch news slugs:", err);
    return [];
  }
}

const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/supply-chain-hub", changeFrequency: "weekly", priority: 0.9 },
  {
    path: "/supply-chain-hub/pr-news",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/supply-chain-hub/linkedin-updates",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/supply-chain-hub/women-in-supply-chain",
    changeFrequency: "never",
    priority: 0.8,
  },
  { path: "/community", changeFrequency: "never", priority: 0.8 },
  { path: "/podcasts", changeFrequency: "weekly", priority: 0.9 },
  { path: "/events", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about-us", changeFrequency: "never", priority: 0.5 },
  { path: "/watch", changeFrequency: "weekly", priority: 0.9 },
  { path: "/watch/tpm-today", changeFrequency: "weekly", priority: 0.8 },
  { path: "/work-with-us", changeFrequency: "never", priority: 0.5 },
  { path: "/impact", changeFrequency: "weekly", priority: 0.5 },
  { path: "/terms-and-conditions", changeFrequency: "never", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "never", priority: 0.5 },
  {
    path: "/watch/thoughts-and-coffee",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/watch/performance-paradox",
    changeFrequency: "weekly",
    priority: 0.8,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [podcasts, news] = await Promise.all([
    getPodcastsSlugs(),
    getNewsSlugs(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: toUrl(path),
      lastModified: NOW,
      changeFrequency,
      priority,
    }),
  );

  const wiscEntries: MetadataRoute.Sitemap = postsData.map((item) => ({
    url: toUrl(`/supply-chain-hub/women-in-supply-chain${item.slug}`),
    lastModified: toDate(item.date),
    changeFrequency: "never",
    priority: 0.9,
  }));

  const podcastEntries: MetadataRoute.Sitemap = podcasts.map((item) => ({
    url: toUrl(`/podcasts/${item.slug}`),
    lastModified: toDate(item.date),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const newsEntries: MetadataRoute.Sitemap = news.map((item) => ({
    url: toUrl(`/supply-chain-hub/pr-news/${item.slug}`),
    lastModified: toDate(item.date),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticEntries, ...wiscEntries, ...podcastEntries, ...newsEntries];
}
