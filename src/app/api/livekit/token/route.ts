import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the room (participant or spectator)
    const { data: member } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this room" },
        { status: 403 }
      );
    }

    const isSpectator = member.role === "spectator";

    // Get user profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 500 }
      );
    }

    const displayName = profile?.display_name || user.email || "Anonymous";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: isSpectator ? `[观众] ${displayName}` : displayName,
      ttl: "2h",
    });

    at.addGrant({
      roomJoin: true,
      room: `dse-speaking-${roomId}`,
      canPublish: !isSpectator, // Spectators cannot publish
      canSubscribe: true,       // Everyone can subscribe (receive audio/video)
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
      isSpectator,
    });
  } catch (error) {
    console.error("LiveKit token error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
