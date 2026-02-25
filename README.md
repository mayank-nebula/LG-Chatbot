import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { safeFetchJSON } from "@/lib/fetch";

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15_000,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout} ms: ${url}`));
    }, timeout);

    fetch(url, options)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function safeFetchJSON(url: string, options: RequestInit = {}) {
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0", ...(options.headers ?? {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fetch failed (${res.status}) ${url} - ${body}`);
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    // Provide a short preview to help diagnosis without leaking everything.
    const preview = text.slice(0, 300);
    console.error("safeFetchJSON: invalid JSON response preview:", preview);
    throw new Error("Invalid JSON response");
  }
}

async function fetchAllCategories() {
  let page = 1;
  let allCategories: any[] = [];

  while (true) {
    const url = new URL(`${env.WP_BASE}/categories`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("orderby", "count");
    url.searchParams.set("order", "desc");
    url.searchParams.set("_fields", "id,slug,name");

    const data: any = await safeFetchJSON(url.toString(), {
      next: { revalidate: 3600 },
    });

    allCategories = [...allCategories, ...data];
    console.log(data);
    const totalPages = Number(data.headers.get("X-WP-TotalPages") ?? 1);

    if (page >= totalPages) {
      break;
    }

    page++;
  }

  return allCategories;
}

export async function GET() {
  try {
    const categories = await fetchAllCategories();

    const formatted = categories.map((cat: any) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
