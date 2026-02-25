import { NextResponse } from "next/server";

const BASE_URL =
  "https://letstalksupplychain.com/wp-json/wp/v2/categories";

const PARAMS = {
  orderby: "count",
  order: "desc",
  per_page: "100",
};

async function fetchAllCategories() {
  let page = 1;
  let allCategories: any[] = [];

  while (true) {
    const url = new URL(BASE_URL);

    Object.entries({
      ...PARAMS,
      page: page.toString(),
    }).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    );

    const resp = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (resp.status === 400) {
      break;
    }

    if (!resp.ok) {
      throw new Error(`Failed to fetch page ${page}`);
    }

    const data = await resp.json();
    allCategories = [...allCategories, ...data];

    const totalPages = Number(
      resp.headers.get("X-WP-TotalPages") ?? 1
    );

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
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
