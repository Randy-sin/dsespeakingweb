import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("forum_bookmarks").upsert({
    post_id: id,
    user_id: user.id,
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
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("forum_bookmarks")
    .delete()
    .eq("post_id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
