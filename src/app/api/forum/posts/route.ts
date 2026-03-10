import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractExcerpt,
  PUBLISHED_POST_STATUS,
  slugifyTitle,
} from "@/lib/forum/constants";
import type { ForumPostType } from "@/lib/supabase/types";

async function ensureProfileRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  }
) {
  const fallbackName =
    (typeof user.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name) ||
    user.email?.split("@")[0] ||
    "DSE Candidate";

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: fallbackName,
    },
    { onConflict: "id" }
  );
}

async function makeUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string
) {
  const baseSlug = slugifyTitle(title);
  const { data } = await supabase
    .from("forum_posts")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  if (!data || data.length === 0) return baseSlug;

  const used = new Set(data.map((item) => item.slug));
  if (!used.has(baseSlug)) return baseSlug;

  let counter = 2;
  while (used.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const query = req.nextUrl.searchParams.get("q");
  const type = req.nextUrl.searchParams.get("type");
  const sort = req.nextUrl.searchParams.get("sort") ?? "active";

  let builder = supabase
    .from("forum_posts")
    .select(
      "*, author:profiles!forum_posts_author_id_fkey(*), paper:pastpaper_papers(*)"
    )
    .eq("status", PUBLISHED_POST_STATUS)
    .limit(30);

  if (type && type !== "all") {
    builder = builder.eq("post_type", type as ForumPostType);
  }

  if (sort === "popular") {
    builder = builder
      .order("comment_count", { ascending: false })
      .order("last_activity_at", { ascending: false });
  } else if (sort === "latest") {
    builder = builder.order("created_at", { ascending: false });
  } else {
    builder = builder.order("last_activity_at", { ascending: false });
  }

  if (query) {
    builder = builder.or(
      `title.ilike.%${query}%,content.ilike.%${query}%,focus_label.ilike.%${query}%`
    );
  }

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureProfileRow(supabase, user);

    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const postType = (body.postType ?? "paper_discussion") as ForumPostType;
    const focusLabel = body.focusLabel ? String(body.focusLabel).trim() : null;
    const paperId =
      typeof body.paperId === "string" && body.paperId ? body.paperId : null;
    const tagSlugs = Array.isArray(body.tagSlugs)
      ? body.tagSlugs
          .filter((slug): slug is string => typeof slug === "string")
          .slice(0, 6)
      : [];

    if (title.length < 6) {
      return NextResponse.json(
        { error: "標題至少要 6 個字" },
        { status: 400 }
      );
    }

    if (content.length < 40) {
      return NextResponse.json(
        { error: "內容至少要 40 個字" },
        { status: 400 }
      );
    }

    const slug = await makeUniqueSlug(supabase, title);
    const excerpt = extractExcerpt(content, 210);

    const { data: post, error } = await supabase
      .from("forum_posts")
      .insert({
        author_id: user.id,
        title,
        content,
        excerpt,
        focus_label: focusLabel,
        paper_id: paperId,
        post_type: postType,
        status: PUBLISHED_POST_STATUS,
        slug,
      })
      .select("id, slug")
      .single();

    if (error || !post) {
      const status = error?.code === "42P01" ? 503 : 500;
      return NextResponse.json(
        {
          error:
            status === 503
              ? "論壇資料表尚未建立，請先執行 migration。"
              : error?.message || "Failed to create post",
        },
        { status }
      );
    }

    if (tagSlugs.length > 0) {
      const { data: tags } = await supabase
        .from("forum_tags")
        .select("id, slug")
        .in("slug", tagSlugs);

      if (tags && tags.length > 0) {
        await supabase.from("forum_post_tags").insert(
          tags.map((tag) => ({
            post_id: post.id,
            tag_id: tag.id,
          }))
        );
      }
    }

    return NextResponse.json({ slug: post.slug });
  } catch (error) {
    console.error("Create forum post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
