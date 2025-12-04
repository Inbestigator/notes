import { copy } from "@vercel/blob";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";

async function handler(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/gzip"],
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });

    return Response.json(jsonResponse);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}

export const POST = handler;
export const PUT = handler;
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
