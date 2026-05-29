import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303, // 303 See Other is recommended after POST mutations
  });
}
