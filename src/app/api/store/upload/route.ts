import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

async function handler(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/octet-stream"],
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
