import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured."
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

type ClientProfileRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string | null;
  email: string | null;
  contact: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("client_profiles")
      .select(
        `
          id,
          auth_user_id,
          full_name,
          email,
          contact,
          created_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Admin clients query failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to load client profiles.",
          details: error.message,
          clients: [],
        },
        { status: 500 }
      );
    }

    const profiles =
      (data || []) as ClientProfileRow[];

    const clients = profiles.map((client) => ({
      id: client.auth_user_id || client.id,

      name:
        client.full_name ||
        "Unnamed Client",

      fullName:
        client.full_name ||
        "Unnamed Client",

      email:
        client.email ||
        "",

      contact:
        client.contact ||
        "",

      phone:
        client.contact ||
        "",

      projectName: null,

      createdAt:
        client.created_at || null,

      briefCompleted: false,
    }));

    return NextResponse.json({
      success: true,
      clients,
      count: clients.length,
    });
  } catch (error) {
    console.error(
      "Admin clients API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
        clients: [],
      },
      { status: 500 }
    );
  }
}