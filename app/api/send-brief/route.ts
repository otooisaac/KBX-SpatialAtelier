import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(request: NextRequest) {
  let uploadedStoragePath: string | null = null;

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    const clientId =
      String(
        formData.get("clientId") || ""
      ).trim();

    const clientName =
      String(
        formData.get("clientName") || ""
      ).trim();

    const clientEmail =
      String(
        formData.get("clientEmail") || ""
      ).trim();

    const projectName =
      String(
        formData.get("projectName") || ""
      ).trim();

    const stageNumberValue =
      String(
        formData.get("stageNumber") || ""
      ).trim();

    const documentName =
      String(
        formData.get("documentName") || ""
      ).trim();

    const documentType =
      String(
        formData.get("documentType") || ""
      ).trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "A file is required.",
        },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "clientId is required.",
        },
        { status: 400 }
      );
    }

    if (!stageNumberValue) {
      return NextResponse.json(
        {
          success: false,
          error: "stageNumber is required.",
        },
        { status: 400 }
      );
    }

    if (!documentName) {
      return NextResponse.json(
        {
          success: false,
          error: "documentName is required.",
        },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        {
          success: false,
          error: "documentType is required.",
        },
        { status: 400 }
      );
    }

    const stageNumber =
      Number(stageNumberValue);

    if (
      !Number.isInteger(stageNumber) ||
      stageNumber < 1 ||
      stageNumber > PROJECT_STAGES.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid project stage.",
        },
        { status: 400 }
      );
    }

    const selectedStage =
      PROJECT_STAGES.find(
        (stage) =>
          stage.number === stageNumber
      );

    if (!selectedStage) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Project stage could not be found.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /*
     * Make sure the stage exists for this client.
     *
     * If it does not exist yet, create all nine stages
     * with the correct initial status.
     */
    const { data: existingStages, error: stagesError } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq("client_id", clientId)
        .order("stage_number", {
          ascending: true,
        });

    if (stagesError) {
      console.error(
        "Project stages lookup failed:",
        stagesError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to load project stages.",
          details:
            stagesError.message,
        },
        { status: 500 }
      );
    }

    if (
      !existingStages ||
      existingStages.length === 0
    ) {
      const initialStages =
        PROJECT_STAGES.map(
          (stage) => ({
            client_id: clientId,
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
        error: createStagesError,
      } = await supabase
        .from("project_stages")
        .insert(initialStages);

      if (createStagesError) {
        console.error(
          "Project stages creation failed:",
          createStagesError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to initialize project stages.",
            details:
              createStagesError.message,
          },
          { status: 500 }
        );
      }
    }

    /*
     * Re-read the stages after initialization.
     */
    const {
      data: stages,
      error: reloadStagesError,
    } = await supabase
      .from("project_stages")
      .select("*")
      .eq("client_id", clientId)
      .order("stage_number", {
        ascending: true,
      });

    if (reloadStagesError) {
      console.error(
        "Project stages reload failed:",
        reloadStagesError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to reload project stages.",
          details:
            reloadStagesError.message,
        },
        { status: 500 }
      );
    }

    const currentStage =
      stages?.find(
        (stage) =>
          stage.status === "current"
      );

    /*
     * Prevent accidentally completing a future stage
     * while an earlier stage is still current.
     *
     * The exception is stage 1, because consultation
     * is already treated as completed when the project
     * stage system is initialized.
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
        { status: 400 }
      );
    }

    /*
     * Create a unique storage path.
     */
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
      `${clientId}/stages/${selectedStage.key}/${Date.now()}-${safeFileName}`;

    uploadedStoragePath =
      storagePath;

    const fileBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    /*
     * Upload the physical file to
     * Supabase Storage.
     */
    const {
      error: uploadError,
    } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(
        storagePath,
        fileBuffer,
        {
          contentType:
            file.type ||
            "application/pdf",
          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        "Document upload failed:",
        uploadError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to upload document.",
          details:
            uploadError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Create the document record.
     */
    const {
      data: document,
      error: documentError,
    } = await supabase
      .from("client_documents")
      .insert({
        client_id: clientId,

        client_name:
          clientName || null,

        client_email:
          clientEmail || null,

        project_name:
          projectName ||
          "KBX Spatial Atelier Project",

        document_name:
          documentName,

        document_type:
          documentType,

        storage_path:
          storagePath,

        file_path:
          storagePath,

        mime_type:
          file.type ||
          "application/pdf",

        file_size:
          file.size,

        file_name:
          file.name,

        title:
          documentName,
      })
      .select()
      .single();

    if (documentError) {
      console.error(
        "Document database insert failed:",
        documentError
      );

      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([
          storagePath,
        ]);

      uploadedStoragePath =
        null;

      return NextResponse.json(
        {
          success: false,
          error:
            "Document was uploaded but could not be saved.",
          details:
            documentError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Mark the selected stage as completed.
     */
    const {
      error: completeStageError,
    } = await supabase
      .from("project_stages")
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
      console.error(
        "Stage completion failed:",
        completeStageError
      );

      /*
       * Remove the document record and
       * uploaded file because the stage
       * could not be completed correctly.
       */
      await supabase
        .from("client_documents")
        .delete()
        .eq(
          "id",
          document.id
        );

      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([
          storagePath,
        ]);

      return NextResponse.json(
        {
          success: false,
          error:
            "The document was uploaded, but the project stage could not be completed.",
          details:
            completeStageError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Make the next stage current.
     */
    const nextStage =
      PROJECT_STAGES.find(
        (stage) =>
          stage.number ===
          stageNumber + 1
      );

    if (nextStage) {
      const {
        error: nextStageError,
      } = await supabase
        .from("project_stages")
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

        return NextResponse.json(
          {
            success: false,
            error:
              "The stage was completed, but the next stage could not be activated.",
            details:
              nextStageError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,

      message:
        `${selectedStage.name} completed successfully.`,

      document,

      completedStage:
        selectedStage,

      nextStage:
        nextStage || null,
    });
  } catch (error) {
    console.error(
      "Unexpected upload document error:",
      error
    );

    /*
     * If something unexpected happens after
     * the file was uploaded, attempt to clean
     * up the storage file.
     */
    if (uploadedStoragePath) {
      try {
        const supabase =
          getSupabaseAdmin();

        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([
            uploadedStoragePath,
          ]);
      } catch (cleanupError) {
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
      { status: 500 }
    );
  }
}

