import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "client-documents";

function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type DocumentRow = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  project_name: string | null;
  document_name: string | null;
  document_type: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  title: string | null;
};

function getStoragePath(document: DocumentRow): string | null {
  return (
    document.file_path ||
    document.storage_path ||
    null
  );
}

function getDocumentName(document: DocumentRow): string {
  return (
    document.document_name ||
    document.title ||
    document.file_name ||
    "Client Document"
  );
}

function getFileName(document: DocumentRow): string {
  return (
    document.file_name ||
    document.document_name ||
    document.title ||
    "document.pdf"
  );
}

function getViewUrl(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  document: DocumentRow
): string | null {
  /*
   * Prefer the stored file URL when one exists.
   */
  if (document.file_url) {
    return document.file_url;
  }

  /*
   * Otherwise generate a public URL from the stored path.
   */
  const storagePath = getStoragePath(document);

  if (!storagePath) {
    return null;
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data?.publicUrl || null;
}

function getDownloadUrl(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  document: DocumentRow
): string | null {
  const storagePath = getStoragePath(document);

  /*
   * If the document already has a URL but we do not have a storage
   * path, use the existing URL for downloading as well.
   */
  if (!storagePath) {
    return document.file_url || null;
  }

  /*
   * Try to create a signed URL first.
   *
   * This works whether the bucket is private or public and is
   * preferable for a client-document download link.
   */
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId")?.trim() || "";

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "clientId is required",
          documents: [],
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("client_documents")
      .select(`
        id,
        client_id,
        client_name,
        client_email,
        project_name,
        document_name,
        document_type,
        storage_path,
        mime_type,
        file_size,
        created_at,
        file_name,
        file_path,
        file_url,
        title
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Client documents query failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve client documents",
          details: error.message,
          documents: [],
        },
        { status: 500 }
      );
    }

    const rows = (data || []) as DocumentRow[];

    const documents = await Promise.all(
      rows.map(async (document) => {
        const storagePath = getStoragePath(document);

        let viewUrl = getViewUrl(supabase, document);
        let downloadUrl = getDownloadUrl(supabase, document);

        /*
         * Generate a signed URL when we have the actual storage path.
         *
         * This is useful even if the bucket is later changed from
         * public to private.
         */
        if (storagePath) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from(STORAGE_BUCKET)
              .createSignedUrl(storagePath, 60 * 60);

          if (!signedError && signedData?.signedUrl) {
            viewUrl = signedData.signedUrl;
            downloadUrl = signedData.signedUrl;
          } else if (signedError) {
            console.warn(
              `Could not create signed URL for document ${document.id}:`,
              signedError.message
            );
          }
        }

        return {
          id: document.id,

          client_id: document.client_id,

          client_name: document.client_name,

          client_email: document.client_email,

          project_name:
            document.project_name ||
            "KBX Spatial Atelier Project",

          document_name: getDocumentName(document),

          document_type:
            document.document_type || "client_document",

          storage_path: document.storage_path,

          mime_type:
            document.mime_type || "application/pdf",

          file_size: document.file_size,

          created_at: document.created_at,

          file_name: getFileName(document),

          file_path: document.file_path,

          file_url: document.file_url,

          title:
            document.title ||
            document.document_name ||
            document.file_name ||
            "Client Document",

          view_url: viewUrl,

          download_url: downloadUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error(
      "Unexpected client documents API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
        documents: [],
      },
      { status: 500 }
    );
  }
}