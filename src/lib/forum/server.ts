import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  ForumComment,
  ForumPost,
  ForumPostStatus,
  ForumTag,
  PastPaper,
  Profile,
} from "@/lib/supabase/types";
import {
  DEFAULT_FORUM_TAGS,
  extractExcerpt,
  PUBLISHED_POST_STATUS,
} from "@/lib/forum/constants";

type RawForumPost = ForumPost & {
  author: Profile | null;
  paper: PastPaper | null;
};

type RawForumComment = ForumComment & {
  author: Profile | null;
};

type TagJoinRow = {
  post_id: string;
  tag: ForumTag | null;
};

export type ForumTagOption = Pick<
  ForumTag,
  "id" | "slug" | "name" | "description"
>;

export type ForumPostWithContext = RawForumPost & {
  tags: ForumTagOption[];
  excerpt_text: string;
};

export type ForumCommentWithAuthor = RawForumComment;

export type PaperWithForumMeta = PastPaper & {
  discussionCount: number;
  heat: number;
  lastActivityAt: string | null;
};

type FeedOptions = {
  query?: string;
  sort?: "latest" | "active" | "popular";
  postType?: ForumPost["post_type"] | "all";
  tag?: string;
};

function isForumUnavailable(error: PostgrestError | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    /does not exist/i.test(error.message)
  );
}

function filterPostByQuery(post: RawForumPost, query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;
  return [
    post.title,
    post.content,
    post.focus_label ?? "",
    post.author?.display_name ?? "",
    post.paper?.topic ?? "",
    post.paper?.paper_number ?? "",
    String(post.paper?.year ?? ""),
  ].some((value) => value.toLowerCase().includes(keyword));
}

async function fetchPostTagsByPostIds(postIds: string[]) {
  if (postIds.length === 0) return new Map<string, ForumTagOption[]>();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_post_tags")
    .select("post_id, tag:forum_tags(*)")
    .in("post_id", postIds);

  if (error || !data) return new Map<string, ForumTagOption[]>();

  const tagMap = new Map<string, ForumTagOption[]>();

  (data as unknown as TagJoinRow[]).forEach((row) => {
    if (!row.tag) return;
    const existing = tagMap.get(row.post_id) ?? [];
    existing.push({
      id: row.tag.id,
      slug: row.tag.slug,
      name: row.tag.name,
      description: row.tag.description,
    });
    tagMap.set(row.post_id, existing);
  });

  return tagMap;
}

async function fetchPublishedPostsBase(sort: FeedOptions["sort"]) {
  const supabase = await createClient();
  let query = supabase
    .from("forum_posts")
    .select(
      "*, author:profiles!forum_posts_author_id_fkey(*), paper:pastpaper_papers(*)"
    )
    .eq("status", PUBLISHED_POST_STATUS as ForumPostStatus)
    .limit(60);

  if (sort === "popular") {
    query = query
      .order("comment_count", { ascending: false })
      .order("like_count", { ascending: false })
      .order("last_activity_at", { ascending: false });
  } else if (sort === "active") {
    query = query.order("last_activity_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  return { data: (data as RawForumPost[] | null) ?? null, error };
}

export async function fetchForumTags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return {
      forumReady: !isForumUnavailable(error),
      tags: DEFAULT_FORUM_TAGS.map((tag) => ({ ...tag, id: tag.slug })),
    };
  }

  return {
    forumReady: true,
    tags:
      data?.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        name: tag.name,
        description: tag.description,
      })) ??
      DEFAULT_FORUM_TAGS.map((tag) => ({ ...tag, id: tag.slug })),
  };
}

export async function fetchForumFeed(options: FeedOptions = {}) {
  const { data, error } = await fetchPublishedPostsBase(options.sort ?? "active");

  if (error) {
    return {
      forumReady: !isForumUnavailable(error),
      posts: [] as ForumPostWithContext[],
    };
  }

  let posts = data ?? [];

  if (options.postType && options.postType !== "all") {
    posts = posts.filter((post) => post.post_type === options.postType);
  }

  if (options.query) {
    posts = posts.filter((post) => filterPostByQuery(post, options.query!));
  }

  const tagMap = await fetchPostTagsByPostIds(posts.map((post) => post.id));
  const enriched = posts.map((post) => ({
    ...post,
    tags: tagMap.get(post.id) ?? [],
    excerpt_text: post.excerpt ?? extractExcerpt(post.content),
  }));

  return {
    forumReady: true,
    posts: options.tag
      ? enriched.filter((post) =>
          post.tags.some((tag) => tag.slug === options.tag)
        )
      : enriched,
  };
}

export async function fetchForumHomepageBlocks() {
  const [{ posts, forumReady }, paperStats, tags] = await Promise.all([
    fetchForumFeed({ sort: "popular" }),
    fetchPaperCatalog({ sort: "trending", limit: 4 }),
    fetchForumTags(),
  ]);

  return {
    forumReady,
    featuredPosts: posts.slice(0, 3),
    trendingPapers: paperStats.papers.slice(0, 4),
    tags: tags.tags.slice(0, 5),
  };
}

export async function fetchPaperCatalog(options?: {
  query?: string;
  year?: string;
  sort?: "latest" | "trending";
  limit?: number;
}) {
  const supabase = await createClient();
  const { data: papers, error } = await supabase
    .from("pastpaper_papers")
    .select("*")
    .order("year", { ascending: false })
    .order("paper_number", { ascending: true });

  if (error || !papers) {
    return {
      forumReady: false,
      papers: [] as PaperWithForumMeta[],
      total: 0,
    };
  }

  const { data: forumPosts, error: forumError } = await supabase
    .from("forum_posts")
    .select("paper_id, comment_count, last_activity_at")
    .eq("status", PUBLISHED_POST_STATUS as ForumPostStatus);

  const stats = new Map<
    string,
    { discussionCount: number; lastActivityAt: string | null; heat: number }
  >();

  if (!forumError && forumPosts) {
    forumPosts.forEach((post) => {
      if (!post.paper_id) return;
      const current = stats.get(post.paper_id) ?? {
        discussionCount: 0,
        lastActivityAt: null,
        heat: 0,
      };
      current.discussionCount += 1;
      current.heat += 1 + (post.comment_count ?? 0);
      if (
        !current.lastActivityAt ||
        new Date(post.last_activity_at).getTime() >
          new Date(current.lastActivityAt).getTime()
      ) {
        current.lastActivityAt = post.last_activity_at;
      }
      stats.set(post.paper_id, current);
    });
  }

  const query = options?.query?.trim().toLowerCase() ?? "";
  const yearFilter = options?.year && options.year !== "all" ? options.year : "";

  let enriched = papers
    .map((paper) => {
      const meta = stats.get(paper.id);
      return {
        ...paper,
        discussionCount: meta?.discussionCount ?? 0,
        lastActivityAt: meta?.lastActivityAt ?? null,
        heat: meta?.heat ?? 0,
      };
    })
    .filter((paper) => {
      const matchesQuery =
        !query ||
        [paper.topic, paper.paper_number, paper.paper_id, paper.part_a_title]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesYear = !yearFilter || String(paper.year) === yearFilter;
      return matchesQuery && matchesYear;
    });

  if (options?.sort === "trending") {
    enriched = enriched.sort((a, b) => {
      if (b.heat !== a.heat) return b.heat - a.heat;
      return b.year - a.year;
    });
  }

  const sliced = options?.limit ? enriched.slice(0, options.limit) : enriched;

  return {
    forumReady: !forumError || !isForumUnavailable(forumError),
    papers: sliced,
    total: enriched.length,
  };
}

export async function fetchPaperHub(paperId: string) {
  const supabase = await createClient();
  const { data: paper, error } = await supabase
    .from("pastpaper_papers")
    .select("*")
    .eq("paper_id", paperId)
    .single();

  if (error || !paper) {
    return {
      paper: null as PastPaper | null,
      forumReady: false,
      posts: [] as ForumPostWithContext[],
    };
  }

  const { data: posts, error: forumError } = await supabase
    .from("forum_posts")
    .select(
      "*, author:profiles!forum_posts_author_id_fkey(*), paper:pastpaper_papers(*)"
    )
    .eq("paper_id", paper.id)
    .eq("status", PUBLISHED_POST_STATUS as ForumPostStatus)
    .order("is_featured", { ascending: false })
    .order("last_activity_at", { ascending: false })
    .limit(24);

  if (forumError) {
    return {
      paper,
      forumReady: !isForumUnavailable(forumError),
      posts: [] as ForumPostWithContext[],
    };
  }

  const tagMap = await fetchPostTagsByPostIds((posts ?? []).map((post) => post.id));

  return {
    paper,
    forumReady: true,
    posts:
      (posts as RawForumPost[] | null)?.map((post) => ({
        ...post,
        tags: tagMap.get(post.id) ?? [],
        excerpt_text: post.excerpt ?? extractExcerpt(post.content),
      })) ?? [],
  };
}

export async function fetchForumPostDetail(slug: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from("forum_posts")
    .select(
      "*, author:profiles!forum_posts_author_id_fkey(*), paper:pastpaper_papers(*)"
    )
    .eq("slug", slug)
    .eq("status", PUBLISHED_POST_STATUS as ForumPostStatus)
    .single();

  if (error || !post) {
    return {
      forumReady: !isForumUnavailable(error),
      post: null as ForumPostWithContext | null,
      comments: [] as ForumCommentWithAuthor[],
      relatedPosts: [] as ForumPostWithContext[],
      userState: { liked: false, bookmarked: false },
    };
  }

  const [tagMap, commentsRes, likesRes, bookmarksRes, relatedRes] =
    await Promise.all([
      fetchPostTagsByPostIds([post.id]),
      supabase
        .from("forum_comments")
        .select("*, author:profiles!forum_comments_author_id_fkey(*)")
        .eq("post_id", post.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      user
        ? supabase
            .from("forum_post_likes")
            .select("post_id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      user
        ? supabase
            .from("forum_bookmarks")
            .select("post_id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      post.paper_id
        ? supabase
            .from("forum_posts")
            .select(
              "*, author:profiles!forum_posts_author_id_fkey(*), paper:pastpaper_papers(*)"
            )
            .eq("paper_id", post.paper_id)
            .eq("status", PUBLISHED_POST_STATUS as ForumPostStatus)
            .neq("id", post.id)
            .order("last_activity_at", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: null, error: null }),
    ]);

  const relatedTagMap = await fetchPostTagsByPostIds(
    ((relatedRes.data as RawForumPost[] | null) ?? []).map((item) => item.id)
  );

  return {
    forumReady: true,
    post: {
      ...(post as RawForumPost),
      tags: tagMap.get(post.id) ?? [],
      excerpt_text: post.excerpt ?? extractExcerpt(post.content),
    },
    comments: (commentsRes.data as ForumCommentWithAuthor[] | null) ?? [],
    relatedPosts:
      ((relatedRes.data as RawForumPost[] | null) ?? []).map((item) => ({
        ...item,
        tags: relatedTagMap.get(item.id) ?? [],
        excerpt_text: item.excerpt ?? extractExcerpt(item.content),
      })) ?? [],
    userState: {
      liked: Boolean(likesRes.data),
      bookmarked: Boolean(bookmarksRes.data),
    },
  };
}
