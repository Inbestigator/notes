import { copy, put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.arrayBuffer();
  const id = nanoid();
  await put(id, data, { access: "public" });
  return new Response(id);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const id = params.get("id");
  if (!id) {
    return new Response("Bad request", { status: 400 });
  }
  const { downloadUrl } = await copy(id, id, {
    access: "public",
  });
  return NextResponse.redirect(downloadUrl);
}
