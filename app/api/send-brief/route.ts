import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase environment variables are not configured."
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/*
|--------------------------------------------------------------------------
| Supported brief types
|--------------------------------------------------------------------------
*/

const BRIEF_DOCUMENT_TYPES = [
  "kitchen_brief",
  "wardrobe_brief",
  "tv_unit_brief",
  "full_interior_brief",
  "client_brief",
];

/*
|--------------------------------------------------------------------------
| Project stages
|--------------------------------------------------------------------------
*/

const PROJECT_STAGES = [
  {
    stage_number: 1,
    stage_name: "Consultation",
  },
  {
    stage_number: 2,
    stage_name: "Client Brief",
  },
  {
    stage_number: 3,
    stage_name: "Site Survey",
  },
  {
    stage_number: 4,
    stage_name: "Concept",
  },
  {
    stage_number: 5,
    stage_name: "Spatial Planning",
  },
  {
    stage_number: 6,
    stage_name: "3D Development",
  },
  {
    stage_number: 7,
    stage_name: "Technical Documentation",
  },
  {
    stage_number: 8,
    stage_name: "Fabrication",
  },
  {
    stage_number: 9,
    stage_name: "Installation",
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function cleanString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/*
|--------------------------------------------------------------------------
| Read request body
|--------------------------------------------------------------------------
|
| The client portal may send either JSON or FormData.
|
*/

async function parseRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  /*
  |--------------------------------------------------------------------------
  | JSON request
  |--------------------------------------------------------------------------
  */

  if (contentType.includes("application/json")) {
    const body = await request.json();

    return {
      data:
        body && typeof body === "object"
          ? body
          : {},
      file: null as File | null,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | FormData request
  |--------------------------------------------------------------------------
  */

  const formData = await request.formData();

  const data: Record<string, unknown> = {};
  let file: File | null = null;

  for (const [key, value] of Array.from(formData.entries())) {
    if (value instanceof File) {
      /*
      |--------------------------------------------------------------------------
      | Only treat an actual non-empty file as a file upload.
      |--------------------------------------------------------------------------
      */

      if (value.size > 0 && value.name) {
        file = value;
      }

      continue;
    }

    data[key] = value;
  }

  return {
    data,
    file,
  };
}

/*
|--------------------------------------------------------------------------
| Extract a value from several possible locations
|--------------------------------------------------------------------------
*/

function getValue(
  data: Record<string, unknown>,
  keys: string[]
): string {
  for (const key of keys) {
    const value = data[key];

    if (
      value !== undefined &&
      value !== null &&
      cleanString(value) !== ""
    ) {
      return cleanString(value);
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| Try to parse nested JSON fields
|--------------------------------------------------------------------------
*/

function tryParseObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore invalid JSON.
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Collect the actual brief answers
|--------------------------------------------------------------------------
|
| We intentionally preserve the submitted fields instead of requiring
| a physical file.
|
*/

function extractBriefData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const possibleNestedFields = [
    "brief",
    "briefData",
    "answers",
    "formData",
    "data",
    "payload",
  ];

  const result: Record<string, unknown> = {};

  /*
  |--------------------------------------------------------------------------
  | Copy direct fields
  |--------------------------------------------------------------------------
  */

  for (const [key, value] of Object.entries(data)) {
    if (
      key !== "client" &&
      key !== "brief" &&
      key !== "briefData" &&
      key !== "answers" &&
      key !== "formData" &&
      key !== "payload"
    ) {
      result[key] = value;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Merge nested JSON objects where present
  |--------------------------------------------------------------------------
  */

  for (const field of possibleNestedFields) {
    const nested = tryParseObject(data[field]);

    if (nested) {
      Object.assign(result, nested);
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| Generate a readable text document
|--------------------------------------------------------------------------
|
| No PDFKit.
|
| We store the client's submitted brief as a plain text file in Supabase
| Storage. This gives the Admin page an actual document to review while
| completely avoiding PDFKit/Vercel font problems.
|
|--------------------------------------------------------------------------
*/

function createTextDocument(
  briefData: Record<string, unknown>,
  metadata: {
    clientName: string;
    clientEmail: string;
    projectName: string;
    documentType: string;
  }
): string {
  const lines: string[] = [];

  lines.push("KBX SPATIAL ATELIER");
  lines.push("CLIENT BRIEF");
  lines.push("");
  lines.push("========================================");
  lines.push("");

  lines.push(`Client Name: ${metadata.clientName || "Not provided"}`);
  lines.push(`Client Email: ${metadata.clientEmail || "Not provided"}`);
  lines.push(`Project Name: ${metadata.projectName || "Not provided"}`);
  lines.push(`Brief Type: ${metadata.documentType}`);
  lines.push(`Submitted: ${new Date().toISOString()}`);

  lines.push("");
  lines.push("========================================");
  lines.push("");
  lines.push("CLIENT RESPONSES");
  lines.push("");

  for (const [key, value] of Object.entries(briefData)) {
    /*
    |--------------------------------------------------------------------------
    | Skip internal metadata from the readable brief
    |--------------------------------------------------------------------------
    */

    if (
      [
        "clientId",
        "clientName",
        "clientEmail",
        "projectName",
        "documentName",
        "documentType",
        "stageNumber",
      ].includes(key)
    ) {
      continue;
    }

    let formattedValue = "";

    if (Array.isArray(value)) {
      formattedValue = value
        .map((item) => {
          if (
            item &&
            typeof item === "object"
          ) {
            return JSON.stringify(item);
          }

          return String(item);
        })
        .join(", ");
    } else if (
      value &&
      typeof value === "object"
    ) {
      formattedValue = JSON.stringify(value, null, 2);
    } else {
      formattedValue = String(value ?? "");
    }

    lines.push(`${key}:`);
    lines.push(formattedValue);
    lines.push("");
  }

  lines.push("========================================");
  lines.push("");
  lines.push("END OF CLIENT BRIEF");

  return lines.join("\n");
}

/*
|--------------------------------------------------------------------------
| Ensure project stages exist
|--------------------------------------------------------------------------
*/

async function ensureProjectStages(clientId: string) {
  if (!clientId) {
    return {
      success: false,
      error: "Client ID is missing.",
    };
  }

  const { data: existingStages, error: existingError } =
    await supabase
      .from("project_stages")
      .select("id, stage_number, stage_name, status")
      .eq("client_id", clientId)
      .order("stage_number", {
        ascending: true,
      });

  if (existingError) {
    console.error(
      "Error loading project stages:",
      existingError
    );

    return {
      success: false,
      error: existingError.message,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | If all stages already exist, leave them untouched.
  |--------------------------------------------------------------------------
  */

  if (
    existingStages &&
    existingStages.length >= PROJECT_STAGES.length
  ) {
    return {
      success: true,
      stages: existingStages,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Insert missing stages.
  |--------------------------------------------------------------------------
  */

  const existingNumbers = new Set(
    (existingStages || []).map(
      (stage) => stage.stage_number
    )
  );

  const missingStages = PROJECT_STAGES
    .filter(
      (stage) =>
        !existingNumbers.has(stage.stage_number)
    )
    .map((stage) => ({
      client_id: clientId,
      stage_number: stage.stage_number,
      stage_name: stage.stage_name,
      status:
        stage.stage_number === 1
          ? "current"
          : "locked",
    }));

  if (missingStages.length > 0) {
    const { error: insertError } =
      await supabase
        .from("project_stages")
        .insert(missingStages);

    if (insertError) {
      console.error(
        "Error creating project stages:",
        insertError
      );

      return {
        success: false,
        error: insertError.message,
      };
    }
  }

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(request: NextRequest) {
  try {
    const { data, file } =
      await parseRequestBody(request);

    /*
    |--------------------------------------------------------------------------
    | Client information
    |--------------------------------------------------------------------------
    */

    let clientId = getValue(data, [
      "clientId",
      "client_id",
      "currentClientId",
    ]);

    let clientName = getValue(data, [
      "clientName",
      "client_name",
      "name",
    ]);

    let clientEmail = getValue(data, [
      "clientEmail",
      "client_email",
      "email",
    ]);

    let projectName = getValue(data, [
      "projectName",
      "project_name",
      "project",
    ]);

    let documentType = getValue(data, [
      "documentType",
      "document_type",
      "briefType",
      "brief_type",
      "type",
    ]);

    let documentName = getValue(data, [
      "documentName",
      "document_name",
      "name",
    ]);

    let stageNumber = getValue(data, [
      "stageNumber",
      "stage_number",
    ]);

    /*
    |--------------------------------------------------------------------------
    | Try nested client object
    |--------------------------------------------------------------------------
    */

    const nestedClient =
      tryParseObject(data.client);

    if (nestedClient) {
      clientId =
        clientId ||
        cleanString(
          nestedClient.id ||
            nestedClient.clientId ||
            nestedClient.client_id
        );

      clientName =
        clientName ||
        cleanString(
          nestedClient.name ||
            nestedClient.clientName ||
            nestedClient.client_name
        );

      clientEmail =
        clientEmail ||
        cleanString(
          nestedClient.email ||
            nestedClient.clientEmail ||
            nestedClient.client_email
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Default document type
    |--------------------------------------------------------------------------
    */

    if (!documentType) {
      documentType = "client_brief";
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize common document type values
    |--------------------------------------------------------------------------
    */

    documentType = documentType
      .toLowerCase()
      .replace(/\s+/g, "_");

    /*
    |--------------------------------------------------------------------------
    | Validate client ID
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Your current client IDs are text IDs such as:
    |
    | client-1789130467538-csmiwn
    |
    | Therefore we DO NOT require UUID format here.
    |
    */

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Client ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Brief submission
    |--------------------------------------------------------------------------
    |
    | This is the important part.
    |
    | A Kitchen Brief, Wardrobe Brief, TV Unit Brief or Full Interior
    | Brief does NOT require the client to upload a physical file.
    |
    */

    const isBriefSubmission =
      BRIEF_DOCUMENT_TYPES.includes(
        documentType
      );

    if (isBriefSubmission) {
      /*
      |--------------------------------------------------------------------------
      | Create the project stages if necessary.
      |--------------------------------------------------------------------------
      */

      const stagesResult =
        await ensureProjectStages(clientId);

      if (!stagesResult.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              stagesResult.error ||
              "Unable to initialize project stages.",
          },
          {
            status: 500,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Collect the submitted answers.
      |--------------------------------------------------------------------------
      */

      const briefData =
        extractBriefData(data);

      /*
      |--------------------------------------------------------------------------
      | Create a text representation of the brief.
      |--------------------------------------------------------------------------
      */

      const textDocument =
        createTextDocument(
          briefData,
          {
            clientName,
            clientEmail,
            projectName,
            documentType,
          }
        );

      const fileName =
        `${documentType}-${Date.now()}.txt`;

      const storagePath =
        `${clientId}/${fileName}`;

      /*
      |--------------------------------------------------------------------------
      | Upload the submitted brief to Supabase Storage
      |--------------------------------------------------------------------------
      */

      const textBlob = new Blob(
        [textDocument],
        {
          type: "text/plain",
        }
      );

      const { error: uploadError } =
        await supabase.storage
          .from("client-documents")
          .upload(
            storagePath,
            textBlob,
            {
              contentType: "text/plain",
              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          "Brief storage upload error:",
          uploadError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              uploadError.message ||
              "Unable to store the submitted brief.",
          },
          {
            status: 500,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Create client_documents record
      |--------------------------------------------------------------------------
      */

      const { data: document, error: documentError } =
        await supabase
          .from("client_documents")
          .insert({
            client_id: clientId,
            document_name:
              documentName ||
              `${documentType} - Client Submission`,
            document_type: documentType,
            file_path: storagePath,
            file_name: fileName,
            mime_type: "text/plain",
          })
          .select()
          .single();

      if (documentError) {
        console.error(
          "Error creating client document:",
          documentError
        );

        /*
        |--------------------------------------------------------------------------
        | Clean up uploaded file if database insert fails.
        |--------------------------------------------------------------------------
        */

        await supabase.storage
          .from("client-documents")
          .remove([storagePath]);

        return NextResponse.json(
          {
            success: false,
            error:
              documentError.message ||
              "Unable to save the submitted brief.",
          },
          {
            status: 500,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT:
      |
      | We intentionally DO NOT complete Client Brief here.
      |
      | The intended workflow is:
      |
      | Client submits brief
      |       ↓
      | Admin reviews brief
      |       ↓
      | Admin approves brief
      |       ↓
      | Client Brief becomes completed
      |       ↓
      | Site Survey becomes current
      |
      |--------------------------------------------------------------------------
      */

      return NextResponse.json(
        {
          success: true,
          message:
            "Your brief has been submitted successfully.",
          document,
          documentId: document.id,
          clientId,
          documentType,
          requiresAdminApproval: true,
        },
        {
          status: 200,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Generic stage document upload
    |--------------------------------------------------------------------------
    |
    | This section remains available for documents that are actually
    | uploaded as files from the Admin/project workflow.
    |
    */

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "A file is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate stage number
    |--------------------------------------------------------------------------
    */

    const parsedStageNumber =
      Number(stageNumber);

    if (
      !Number.isInteger(
        parsedStageNumber
      ) ||
      parsedStageNumber < 1 ||
      parsedStageNumber > 9
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid stage number between 1 and 9 is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Ensure project stages
    |--------------------------------------------------------------------------
    */

    const stagesResult =
      await ensureProjectStages(clientId);

    if (!stagesResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            stagesResult.error ||
            "Unable to initialize project stages.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Check selected stage
    |--------------------------------------------------------------------------
    */

    const { data: currentStage, error: stageError } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq("client_id", clientId)
        .eq(
          "stage_number",
          parsedStageNumber
        )
        .maybeSingle();

    if (stageError) {
      console.error(
        "Error loading selected stage:",
        stageError
      );

      return NextResponse.json(
        {
          success: false,
          error: stageError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!currentStage) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected project stage could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent uploading to a future locked stage
    |--------------------------------------------------------------------------
    */

    if (
      currentStage.status ===
      "locked"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This project stage is not currently available.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Upload file
    |--------------------------------------------------------------------------
    */

    const safeFileName =
      file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_");

    const storagePath =
      `${clientId}/${Date.now()}-${safeFileName}`;

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    const { error: uploadError } =
      await supabase.storage
        .from("client-documents")
        .upload(
          storagePath,
          buffer,
          {
            contentType:
              file.type ||
              "application/octet-stream",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "File upload error:",
        uploadError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            uploadError.message ||
            "Unable to upload file.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Save document
    |--------------------------------------------------------------------------
    */

    const { data: document, error: documentError } =
      await supabase
        .from("client_documents")
        .insert({
          client_id: clientId,
          document_name:
            documentName ||
            file.name,
          document_type:
            documentType ||
            "project_document",
          file_path: storagePath,
          file_name: file.name,
          mime_type:
            file.type ||
            "application/octet-stream",
        })
        .select()
        .single();

    if (documentError) {
      console.error(
        "Document database error:",
        documentError
      );

      await supabase.storage
        .from("client-documents")
        .remove([storagePath]);

      return NextResponse.json(
        {
          success: false,
          error:
            documentError.message ||
            "Unable to save document.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Complete current stage
    |--------------------------------------------------------------------------
    */

    const { error: completeError } =
      await supabase
        .from("project_stages")
        .update({
          status: "completed",
          document_id: document.id,
          completed_at:
            new Date().toISOString(),
        })
        .eq("client_id", clientId)
        .eq(
          "stage_number",
          parsedStageNumber
        );

    if (completeError) {
      console.error(
        "Error completing stage:",
        completeError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            completeError.message ||
            "Document uploaded, but the stage could not be completed.",
          document,
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Make next stage current
    |--------------------------------------------------------------------------
    */

    if (
      parsedStageNumber <
      PROJECT_STAGES.length
    ) {
      const { error: nextStageError } =
        await supabase
          .from("project_stages")
          .update({
            status: "current",
          })
          .eq("client_id", clientId)
          .eq(
            "stage_number",
            parsedStageNumber + 1
          )
          .neq(
            "status",
            "completed"
          );

      if (nextStageError) {
        console.error(
          "Error activating next stage:",
          nextStageError
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,
        message:
          "Document uploaded successfully.",
        document,
        documentId: document.id,
        clientId,
        stageNumber:
          parsedStageNumber,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected /api/send-brief error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}