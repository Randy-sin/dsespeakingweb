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

    const { roomId, password, role = "participant" } = await req.json();

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Get room info
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, password_hash, status, max_members")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Verify password if room has one
    if (room.password_hash) {
      if (!password) {
        return NextResponse.json(
          { error: "密碼錯誤", code: "WRONG_PASSWORD" },
          { status: 403 }
        );
      }
      const isValid = await bcrypt.compare(password, room.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "密碼錯誤", code: "WRONG_PASSWORD" },
          { status: 403 }
        );
      }
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ success: true, alreadyMember: true });
    }

    // Check room capacity for participants
    if (role === "participant") {
      const { count } = await supabase
        .from("room_members")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId)
        .eq("role", "participant");

      if (count !== null && count >= room.max_members) {
        return NextResponse.json(
          { error: "房間已滿", code: "ROOM_FULL" },
          { status: 403 }
        );
      }
    }

    // Join room
    const { error: joinError } = await supabase
      .from("room_members")
      .insert({
        room_id: roomId,
        user_id: user.id,
        role,
      });

    if (joinError) {
      console.error("Join room error:", joinError);
      return NextResponse.json(
        { error: "Failed to join room" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
