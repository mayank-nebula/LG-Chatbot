import { MetadataRoute } from "next";
import { env } from "@/lib/env";
import postsData from "@/data/wisc_blog.json";

const BASE_URL = env.PUBLIC_SITE_URL;

async function getPodcastsSlugs() {
  return [{ slug: "", date: "" }];
}

async function getNewsSlugs() {
  return [{ slug: "", date: "" }];
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [podcasts, news] = await Promise.all([
    getPodcastsSlugs(),
    getNewsSlugs(),
  ]);

  const podcastEntries: MetadataRoute.Sitemap = podcasts.map((item) => ({
    url: `${BASE_URL}/podcasts/${item.slug}`,
    lastModified: item.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const newsEntries: MetadataRoute.Sitemap = news.map((item) => ({
    url: `${BASE_URL}/supply-chain-hub/pr-news/${item.slug}`,
    lastModified: item.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const wiscEntries: MetadataRoute.Sitemap = postsData.map((item) => ({
    url: `${BASE_URL}/supply-chain-hub/women-in-supply-chain${item.slug}`,
    lastModified: item.date,
    changeFrequency: "never",
    priority: 0.7,
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/supply-chain-hub`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/supply-chain-hub/pr-news`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/supply-chain-hub/linkedin-updates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/supply-chain-hub/women-in-supply-chain`,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 1,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 1,
    },
    {
      url: `${BASE_URL}/podcasts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about-us`,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 1,
    },
    {
      url: `${BASE_URL}/watch`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/watch/tpm-today`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/watch/thoughts-and-coffee`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/watch/performance-paradox`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  return [...wiscEntries, ...podcastEntries, ...newsEntries, ...staticEntries];
}
