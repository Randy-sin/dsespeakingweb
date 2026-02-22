import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, paperId, scheduledAt, password } = await req.json();

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Create room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name: name || `${user.email?.split("@")[0] || "User"}的練習房`,
        host_id: user.id,
        paper_id: paperId || null,
        scheduled_at: scheduledAt,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (roomError) {
      console.error("Create room error:", roomError);
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    // Add creator as member
    const { error: memberError } = await supabase
      .from("room_members")
      .insert({
        room_id: room.id,
        user_id: user.id,
        speaking_order: 1,
      });

    if (memberError) {
      console.error("Add member error:", memberError);
      // Clean up room if member insert fails
      await supabase.from("rooms").delete().eq("id", room.id);
      return NextResponse.json(
        { error: "Failed to join room" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roomId: room.id });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
