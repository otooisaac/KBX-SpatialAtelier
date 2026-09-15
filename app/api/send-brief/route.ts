import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "client-documents";

const PROJECT_STAGES = [
  {
    number: 1,
    key: "consultation",
    name: "Consultation",
  },
  {
    number: 2,
    key: "client_brief",
    name: "Client Brief",
  },
  {
    number: 3,
    key: "site_survey",
    name: "Site Survey",
  },
  {
    number: 4,
    key: "concept",
    name: "Concept",
  },
  {
    number: 5,
    key: "spatial_planning",
    name: "Spatial Planning",
  },
  {
    number: 6,
    key: "3d_development",
    name: "3D Development",
  },
  {
    number: 7,
    key: "technical_documentation",
    name: "Technical Documentation",
  },
  {
    number: 8,
    key: "fabrication",
    name: "Fabrication",
  },
  {
    number: 9,
    key: "installation",
    name: "Installation",
  },
];

const CLIENT_BRIEF_TYPES = [
  "kitchen_brief",
  "wardrobe_brief",
  "tv_unit_brief",
  "full_interior_brief",
  "client_brief",
];

function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured"
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured"
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

function cleanText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "";
}

function normalizeDocumentType(
  value: unknown
): string {
  const raw = cleanText(value);

  if (!raw) {
    return "client_brief";
  }

  const normalized = raw
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (
    normalized === "kitchen" ||
    normalized === "kitchen_brief"
  ) {
    return "kitchen_brief";
  }

  if (
    normalized === "wardrobe" ||
    normalized === "wardrobe_brief"
  ) {
    return "wardrobe_brief";
  }

  if (
    normalized === "tv" ||
    normalized === "tv_unit" ||
    normalized === "tv_unit_brief"
  ) {
    return "tv_unit_brief";
  }

  if (
    normalized === "full_interior" ||
    normalized === "full_interior_brief"
  ) {
    return "full_interior_brief";
  }

  if (normalized === "client_brief") {
    return "client_brief";
  }

  return normalized;
}

function getValue(
  source: Record<string, any>,
  paths: string[]
): unknown {
  for (const path of paths) {
    const parts = path.split(".");
    let current: any = source;

    for (const part of parts) {
      if (
        current &&
        typeof current === "object" &&
        part in current
      ) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }

    if (
      current !== undefined &&
      current !== null &&
      current !== ""
    ) {
      return current;
    }
  }

  return undefined;
}

function getClientId(
  data: Record<string, any>
): string {
  const value = getValue(data, [
    "clientId",
    "client_id",
    "client.id",
    "client.clientId",
    "client.client_id",
    "customerId",
    "customer_id",
  ]);

  return cleanText(value);
}

function getClientName(
  data: Record<string, any>
): string {
  const value = getValue(data, [
    "clientName",
    "client_name",
    "client.name",
    "client.fullName",
    "client.full_name",
    "name",
    "fullName",
    "full_name",
  ]);

  return cleanText(value);
}

function getClientEmail(
  data: Record<string, any>
): string {
  const value = getValue(data, [
    "clientEmail",
    "client_email",
    "client.email",
    "email",
  ]);

  return cleanText(value);
}

function getProjectName(
  data: Record<string, any>
): string {
  const value = getValue(data, [
    "projectName",
    "project_name",
    "project.name",
    "project",
    "nameOfProject",
  ]);

  return (
    cleanText(value) ||
    "KBX Spatial Atelier Project"
  );
}

function getProjectLocation(
  data: Record<string, any>
): string {
  const value = getValue(data, [
    "projectLocation",
    "project_location",
    "location",
    "project.location",
    "siteLocation",
    "site_location",
  ]);

  return cleanText(value);
}

function getDocumentType(
  data: Record<string, any>
): string {
  const value = getValue(data, [
    "documentType",
    "document_type",
    "briefType",
    "brief_type",
    "type",
  ]);

  return normalizeDocumentType(value);
}

function getDocumentName(
  data: Record<string, any>,
  documentType: string
): string {
  const supplied = cleanText(
    getValue(data, [
      "documentName",
      "document_name",
      "title",
      "briefTitle",
      "brief_title",
    ])
  );

  if (supplied) {
    return supplied;
  }

  switch (documentType) {
    case "kitchen_brief":
      return "Kitchen Brief";

    case "wardrobe_brief":
      return "Wardrobe & Closet Brief";

    case "tv_unit_brief":
      return "TV Unit Brief";

    case "full_interior_brief":
      return "Full Interior Brief";

    default:
      return "Client Brief";
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(
      value as Record<string, unknown>
    )
      .map(([key, val]) => {
        const formatted = formatValue(val);

        if (!formatted) {
          return "";
        }

        return `${key}: ${formatted}`;
      })
      .filter(Boolean)
      .join("; ");
  }

  return String(value);
}

function flattenObject(
  value: any,
  prefix = "",
  output: Array<{
    key: string;
    value: string;
  }> = []
) {
  if (
    value === null ||
    value === undefined
  ) {
    return output;
  }

  if (
    typeof value !== "object" ||
    value instanceof Date
  ) {
    const formatted = formatValue(value);

    if (formatted) {
      output.push({
        key: prefix || "Value",
        value: formatted,
      });
    }

    return output;
  }

  if (Array.isArray(value)) {
    const formatted = formatValue(value);

    if (formatted) {
      output.push({
        key: prefix || "Value",
        value: formatted,
      });
    }

    return output;
  }

  for (const [key, child] of Object.entries(value)) {
    if (
      key === "file" ||
      key === "files" ||
      key === "File"
    ) {
      continue;
    }

    const nextKey = prefix
      ? `${prefix} / ${key}`
      : key;

    if (
      child &&
      typeof child === "object" &&
      !Array.isArray(child)
    ) {
      flattenObject(
        child,
        nextKey,
        output
      );
    } else {
      const formatted =
        formatValue(child);

      if (formatted) {
        output.push({
          key: nextKey,
          value: formatted,
        });
      }
    }
  }

  return output;
}

function prettyLabel(
  value: string
): string {
  return value
    .replace(/\//g, " / ")
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );
}

async function generateBriefPdf(
  data: Record<string, any>,
  documentName: string,
  clientName: string,
  clientEmail: string,
  projectName: string,
  projectLocation: string
): Promise<Buffer> {
  return new Promise(
    (resolve, reject) => {
      try {
        const doc =
          new PDFDocument({
            size: "A4",
            margin: 50,
          });

        const chunks: Buffer[] = [];

        doc.on(
          "data",
          (chunk: Buffer) => {
            chunks.push(chunk);
          }
        );

        doc.on(
          "end",
          () => {
            resolve(
              Buffer.concat(chunks)
            );
          }
        );

        doc.on(
          "error",
          (error) => {
            reject(error);
          }
        );

        doc
          .fontSize(20)
          .text(
            "KBX Spatial Atelier",
            {
              align: "center",
            }
          );

        doc.moveDown(0.5);

        doc
          .fontSize(16)
          .text(
            documentName,
            {
              align: "center",
            }
          );

        doc.moveDown(1);

        doc
          .fontSize(10)
          .text(
            `Prepared for: ${
              clientName || "Client"
            }`
          );

        if (clientEmail) {
          doc.text(
            `Email: ${clientEmail}`
          );
        }

        doc.text(
          `Project: ${projectName}`
        );

        if (projectLocation) {
          doc.text(
            `Location: ${projectLocation}`
          );
        }

        doc.moveDown(1);

        doc
          .fontSize(12)
          .text("Submitted Brief", {
            underline: true,
          });

        doc.moveDown(0.5);

        const entries =
          flattenObject(data);

        for (const entry of entries) {
          if (
            !entry.value ||
            entry.key === "file" ||
            entry.key === "files"
          ) {
            continue;
          }

          if (
            doc.y >
            doc.page.height - 80
          ) {
            doc.addPage();
          }

          doc
            .fontSize(10)
            .text(
              prettyLabel(
                entry.key
              ),
              {
                continued: false,
              }
            );

          doc
            .fontSize(10)
            .text(
              entry.value
            );

          doc.moveDown(0.35);
        }

        doc.moveDown(1);

        doc
          .fontSize(8)
          .text(
            `Generated by KBX Spatial Atelier on ${new Date().toLocaleString(
              "en-GB"
            )}`,
            {
              align: "center",
            }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    }
  );
}

async function parseRequestBody(
  request: NextRequest
): Promise<{
  data: Record<string, any>;
  file: File | null;
}> {
  const contentType =
    request.headers.get(
      "content-type"
    ) || "";

  /*
   * JSON submission.
   */
  if (
    contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    const text =
      await request.text();

    if (!text.trim()) {
      return {
        data: {},
        file: null,
      };
    }

    const parsed =
      JSON.parse(text);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return {
        data: parsed,
        file: null,
      };
    }

    return {
      data: {
        value: parsed,
      },
      file: null,
    };
  }

  /*
   * FormData submission.
   */
  const formData =
    await request.formData();

  const fileValue =
    formData.get("file");

  const file =
    fileValue instanceof File &&
    fileValue.size > 0
      ? fileValue
      : null;

  const data: Record<
    string,
    any
  > = {};

  /*
   * First look for a JSON payload
   * inside FormData.
   */
  const possibleJsonFields = [
    "briefData",
    "brief",
    "data",
    "payload",
    "formData",
    "clientBrief",
    "client_brief",
  ];

  for (const fieldName of possibleJsonFields) {
    const value =
      formData.get(fieldName);

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      try {
        const parsed =
          JSON.parse(value);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          Object.assign(
            data,
            parsed
          );

          break;
        }
      } catch {
        /*
         * Not JSON. Continue checking
         * other possible fields.
         */
      }
    }
  }

  /*
   * Read the ordinary FormData
   * fields as well.
   *
   * Array.from() is deliberately used
   * instead of directly iterating
   * formData.entries(), so this works
   * with the project's current TS target.
   */
  const entries =
    Array.from(
      formData.entries()
    );

  for (
    let index = 0;
    index < entries.length;
    index++
  ) {
    const key =
      entries[index][0];

    const value =
      entries[index][1];

    if (key === "file") {
      continue;
    }

    if (
      possibleJsonFields.includes(
        key
      )
    ) {
      continue;
    }

    if (
      typeof value === "string"
    ) {
      /*
       * If the value itself happens
       * to be JSON, preserve the
       * parsed object.
       */
      try {
        const parsed =
          JSON.parse(value);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          data[key] = parsed;
          continue;
        }
      } catch {
        /*
         * Normal string field.
         */
      }

      data[key] = value;
    }
  }

  return {
    data,
    file,
  };
}

async function uploadFile(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  file: File,
  clientId: string,
  stageKey: string
) {
  const safeFileName =
    file.name
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )
      .replace(
        /_+/g,
        "_"
      );

  const storagePath =
    `${clientId}/stages/${stageKey}/${Date.now()}-${safeFileName}`;

  const buffer =
    Buffer.from(
      await file.arrayBuffer()
    );

  const {
    error,
  } =
    await supabase.storage
      .from(STORAGE_BUCKET)
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

  if (error) {
    throw new Error(
      `Failed to upload document: ${error.message}`
    );
  }

  return {
    storagePath,
    fileSize: file.size,
    fileName: file.name,
    mimeType:
      file.type ||
      "application/octet-stream",
  };
}

async function ensureStages(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  const {
    data: existingStages,
    error,
  } =
    await supabase
      .from("project_stages")
      .select("*")
      .eq(
        "client_id",
        clientId
      )
      .order(
        "stage_number",
        {
          ascending: true,
        }
      );

  if (error) {
    throw new Error(
      `Failed to load project stages: ${error.message}`
    );
  }

  if (
    !existingStages ||
    existingStages.length === 0
  ) {
    const initialStages =
      PROJECT_STAGES.map(
        (stage) => ({
          client_id:
            clientId,
          stage_number:
            stage.number,
          stage_key:
            stage.key,
          stage_name:
            stage.name,
          status:
            stage.number === 1
              ? "completed"
              : stage.number === 2
              ? "current"
              : "upcoming",
          completed_at:
            stage.number === 1
              ? new Date().toISOString()
              : null,
        })
      );

    const {
      error:
        insertError,
    } =
      await supabase
        .from(
          "project_stages"
        )
        .insert(
          initialStages
        );

    if (insertError) {
      throw new Error(
        `Failed to initialize project stages: ${insertError.message}`
      );
    }

    return initialStages;
  }

  return existingStages;
}

async function createDocumentRecord(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  values: {
    clientId: string;
    clientName: string;
    clientEmail: string;
    projectName: string;
    documentName: string;
    documentType: string;
    storagePath: string;
    mimeType: string;
    fileSize: number;
    fileName: string;
  }
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "client_documents"
      )
      .insert({
        client_id:
          values.clientId,

        client_name:
          values.clientName ||
          null,

        client_email:
          values.clientEmail ||
          null,

        project_name:
          values.projectName ||
          "KBX Spatial Atelier Project",

        document_name:
          values.documentName,

        document_type:
          values.documentType,

        storage_path:
          values.storagePath,

        file_path:
          values.storagePath,

        mime_type:
          values.mimeType,

        file_size:
          values.fileSize,

        file_name:
          values.fileName,

        title:
          values.documentName,
      })
      .select()
      .single();

  if (error) {
    throw new Error(
      `Document could not be saved: ${error.message}`
    );
  }

  return data;
}

export async function POST(
  request: NextRequest
) {
  let uploadedStoragePath:
    string | null = null;

  try {
    const {
      data,
      file,
    } =
      await parseRequestBody(
        request
      );

    const clientId =
      getClientId(data);

    const clientName =
      getClientName(data);

    const clientEmail =
      getClientEmail(data);

    const projectName =
      getProjectName(data);

    const projectLocation =
      getProjectLocation(data);

    const documentType =
      getDocumentType(data);

    const documentName =
      getDocumentName(
        data,
        documentType
      );

    console.log(
      "KBX send-brief:",
      {
        hasFile: Boolean(file),
        clientId,
        clientName,
        clientEmail,
        projectName,
        documentType,
      }
    );

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "clientId is required. Please reopen the client portal and submit the brief again.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /*
     * ============================================================
     * CLIENT BRIEF SUBMISSION
     * ============================================================
     *
     * A Client Brief does NOT require
     * the client to upload a file.
     *
     * We generate the PDF on the server
     * and save it as the client document.
     */
    if (
      CLIENT_BRIEF_TYPES.includes(
        documentType
      ) &&
      !file
    ) {
      const pdfBuffer =
        await generateBriefPdf(
          data,
          documentName,
          clientName,
          clientEmail,
          projectName,
          projectLocation
        );

      const safeName =
        documentName
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          )
          .replace(
            /_+/g,
            "_"
          );

      const storagePath =
        `${clientId}/briefs/${Date.now()}-${safeName}.pdf`;

      uploadedStoragePath =
        storagePath;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .upload(
            storagePath,
            pdfBuffer,
            {
              contentType:
                "application/pdf",
              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `Failed to save the submitted brief: ${uploadError.message}`
        );
      }

      const document =
        await createDocumentRecord(
          supabase,
          {
            clientId,
            clientName,
            clientEmail,
            projectName,
            documentName,
            documentType,
            storagePath,
            mimeType:
              "application/pdf",
            fileSize:
              pdfBuffer.length,
            fileName:
              `${safeName}.pdf`,
          }
        );

      /*
       * IMPORTANT:
       *
       * We intentionally DO NOT complete
       * Client Brief here.
       *
       * The Admin approval workflow will
       * handle that later.
       */
      return NextResponse.json(
        {
          success: true,
          message:
            `${documentName} submitted successfully.`,
          document,
          submittedBrief: true,
          requiresAdminApproval: true,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * ============================================================
     * ADMIN / STAGE DOCUMENT UPLOAD
     * ============================================================
     *
     * If a physical file is supplied,
     * retain the existing stage-upload
     * functionality.
     */
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A file is required for this type of document upload.",
        },
        {
          status: 400,
        }
      );
    }

    const stageNumberRaw =
      cleanText(
        getValue(data, [
          "stageNumber",
          "stage_number",
        ])
      );

    const stageNumber =
      Number(stageNumberRaw);

    if (
      !Number.isInteger(
        stageNumber
      ) ||
      stageNumber < 1 ||
      stageNumber >
        PROJECT_STAGES.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid project stage.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedStage =
      PROJECT_STAGES.find(
        (stage) =>
          stage.number ===
          stageNumber
      );

    if (!selectedStage) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Project stage could not be found.",
        },
        {
          status: 400,
        }
      );
    }

    const stages =
      await ensureStages(
        supabase,
        clientId
      );

    const currentStage =
      stages.find(
        (stage: any) =>
          stage.status ===
          "current"
      );

    /*
     * Prevent completing a future
     * stage while an earlier stage
     * is still current.
     */
    if (
      stageNumber !== 1 &&
      currentStage &&
      stageNumber >
        currentStage.stage_number
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `You must complete "${currentStage.stage_name}" before completing "${selectedStage.name}".`,
        },
        {
          status: 400,
        }
      );
    }

    const uploaded =
      await uploadFile(
        supabase,
        file,
        clientId,
        selectedStage.key
      );

    uploadedStoragePath =
      uploaded.storagePath;

    const document =
      await createDocumentRecord(
        supabase,
        {
          clientId,
          clientName,
          clientEmail,
          projectName,
          documentName:
            documentName ||
            file.name,
          documentType:
            documentType ||
            selectedStage.key,
          storagePath:
            uploaded.storagePath,
          mimeType:
            uploaded.mimeType,
          fileSize:
            uploaded.fileSize,
          fileName:
            uploaded.fileName,
        }
      );

    const {
      error:
        completeStageError,
    } =
      await supabase
        .from(
          "project_stages"
        )
        .update({
          status:
            "completed",
          document_id:
            document.id,
          completed_at:
            new Date().toISOString(),
        })
        .eq(
          "client_id",
          clientId
        )
        .eq(
          "stage_number",
          stageNumber
        );

    if (completeStageError) {
      await supabase
        .from(
          "client_documents"
        )
        .delete()
        .eq(
          "id",
          document.id
        );

      await supabase.storage
        .from(
          STORAGE_BUCKET
        )
        .remove([
          uploaded.storagePath,
        ]);

      uploadedStoragePath =
        null;

      throw new Error(
        `The document was uploaded, but the project stage could not be completed: ${completeStageError.message}`
      );
    }

    const nextStage =
      PROJECT_STAGES.find(
        (stage) =>
          stage.number ===
          stageNumber + 1
      );

    if (nextStage) {
      const {
        error:
          nextStageError,
      } =
        await supabase
          .from(
            "project_stages"
          )
          .update({
            status:
              "current",
          })
          .eq(
            "client_id",
            clientId
          )
          .eq(
            "stage_number",
            nextStage.number
          );

      if (nextStageError) {
        console.error(
          "Next stage update failed:",
          nextStageError
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          `${selectedStage.name} completed successfully.`,
        document,
        completedStage:
          selectedStage,
        nextStage:
          nextStage ||
          null,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "send-brief error:",
      error
    );

    if (
      uploadedStoragePath
    ) {
      try {
        const supabase =
          getSupabaseAdmin();

        await supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .remove([
            uploadedStoragePath,
          ]);
      } catch (
        cleanupError
      ) {
        console.error(
          "Storage cleanup failed:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}