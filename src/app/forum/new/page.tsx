import { Navbar } from "@/components/layout/navbar";
import { NewPostForm } from "@/components/forum/new-post-form";
import { fetchForumTags, fetchPaperCatalog } from "@/lib/forum/server";
import type { ForumPostType } from "@/lib/supabase/types";

type SearchParams = Promise<{
  paperId?: string;
  postType?: ForumPostType;
}>;

export default async function NewForumPostPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const [papers, tags] = await Promise.all([
    fetchPaperCatalog({ limit: 320 }),
    fetchForumTags(),
  ]);

  return (
    <>
      <Navbar />
      <NewPostForm
        papers={papers.papers}
        tags={tags.tags}
        initialPaperId={params.paperId}
        initialPostType={params.postType}
      />
    </>
  );
}
