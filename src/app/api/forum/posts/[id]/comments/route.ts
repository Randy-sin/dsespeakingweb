import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureProfileRow(supabase, user);

    const body = await req.json();
    const content = String(body.content ?? "").trim();
    const parentId =
      typeof body.parentId === "string" && body.parentId ? body.parentId : null;

    if (content.length < 2) {
      return NextResponse.json(
        { error: "回覆內容至少要 2 個字" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("forum_comments").insert({
      post_id: id,
      author_id: user.id,
      parent_id: parentId,
      content,
    });

    if (error) {
      const status = error.code === "42P01" ? 503 : 500;
      return NextResponse.json(
        {
          error:
            status === 503
              ? "論壇資料表尚未建立，請先執行 migration。"
              : error.message,
        },
        { status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create forum comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
