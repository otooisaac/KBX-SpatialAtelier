import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/*
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

/*
 * ============================================================
 * PROJECT STAGES
 * ============================================================
 *
 * These must match the stages used by:
 *
 * /api/upload-documents
 *
 * and the client portal.
 */

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

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type ProjectStageRow = {
  id: string;
  client_id: string;
  stage_number: number;
  stage_key: string;
  stage_name: string;
  status:
    | "upcoming"
    | "current"
    | "completed";
  document_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/*
 * ============================================================
 * SUPABASE ADMIN CLIENT
 * ============================================================
 *
 * This route runs on the server.
 *
 * The service-role key is NEVER exposed to the browser.
 */

function getSupabaseAdmin() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "Supabase environment variables are not configured."
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

/*
 * ============================================================
 * INITIALIZE PROJECT STAGES
 * ============================================================
 *
 * If a client does not have project_stages rows yet,
 * create the complete nine-stage journey.
 *
 * Default state:
 *
 * 01 Consultation     = completed
 * 02 Client Brief     = current
 * 03–09               = upcoming
 *
 * IMPORTANT:
 * This function first checks existing client documents so
 * that an already-submitted Client Brief is not accidentally
 * reset to "current".
 */

async function initializeProjectStages(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  /*
   * Check whether stages already exist.
   */

  const {
    data: existingStages,
    error: existingStagesError,
  } = await supabase
    .from("project_stages")
    .select("*")
    .eq("client_id", clientId)
    .order("stage_number", {
      ascending: true,
    });

  if (existingStagesError) {
    throw new Error(
      existingStagesError.message
    );
  }

  if (
    existingStages &&
    existingStages.length > 0
  ) {
    return existingStages as ProjectStageRow[];
  }

  /*
   * ==========================================================
   * CHECK EXISTING CLIENT BRIEF
   * ==========================================================
   *
   * This protects existing clients whose brief was already
   * submitted before project_stages was introduced.
   */

  let clientBriefCompleted =
    false;

  const {
    data: submittedDocuments,
    error: documentsError,
  } = await supabase
    .from("client_documents")
    .select(
      "id, document_type, created_at"
    )
    .eq("client_id", clientId)
    .order("created_at", {
      ascending: false,
    });

  if (documentsError) {
    throw new Error(
      documentsError.message
    );
  }

  if (
    Array.isArray(
      submittedDocuments
    )
  ) {
    clientBriefCompleted =
      submittedDocuments.some(
        (document) =>
          [
            "kitchen_brief",
            "wardrobe_brief",
            "tv_unit_brief",
            "full_interior_brief",
            "client_brief",
          ].includes(
            document.document_type
          )
      );
  }

  /*
   * Find the document that proves the Client Brief
   * was completed.
   */

  const briefDocument =
    submittedDocuments?.find(
      (document) =>
        [
          "kitchen_brief",
          "wardrobe_brief",
          "tv_unit_brief",
          "full_interior_brief",
          "client_brief",
        ].includes(
          document.document_type
        )
    );

  /*
   * Determine the initial current stage.
   *
   * If the brief already exists:
   * Consultation = completed
   * Client Brief = completed
   * Site Survey = current
   *
   * Otherwise:
   * Consultation = completed
   * Client Brief = current
   */

  const rows =
    PROJECT_STAGES.map(
      (stage) => {
        let status:
          | "upcoming"
          | "current"
          | "completed";

        let documentId:
          | string
          | null = null;

        let completedAt:
          | string
          | null = null;

        if (
          stage.number === 1
        ) {
          status = "completed";
          completedAt =
            new Date().toISOString();
        } else if (
          stage.number === 2 &&
          clientBriefCompleted
        ) {
          status = "completed";
          documentId =
            briefDocument?.id ||
            null;
          completedAt =
            briefDocument?.created_at ||
            new Date().toISOString();
        } else if (
          stage.number === 2 &&
          !clientBriefCompleted
        ) {
          status = "current";
        } else if (
          stage.number === 3 &&
          clientBriefCompleted
        ) {
          status = "current";
        } else {
          status = "upcoming";
        }

        return {
          client_id: clientId,
          stage_number:
            stage.number,
          stage_key:
            stage.key,
          stage_name:
            stage.name,
          status,
          document_id:
            documentId,
          completed_at:
            completedAt,
        };
      }
    );

  /*
   * Insert all nine stages.
   */

  const {
    data: insertedStages,
    error: insertError,
  } = await supabase
    .from("project_stages")
    .insert(rows)
    .select("*")
    .order("stage_number", {
      ascending: true,
    });

  if (insertError) {
    throw new Error(
      insertError.message
    );
  }

  return (
    insertedStages as ProjectStageRow[]
  );
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * GET /api/project-stages?clientId=CLIENT_ID
 *
 * Used by:
 *
 * - /admin/project
 * - /client-portal
 *
 * Returns all nine project stages.
 */

export async function GET(
  request: NextRequest
) {
  try {
    const clientId =
      request.nextUrl.searchParams.get(
        "clientId"
      );

    /*
     * Client ID is required.
     */

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "clientId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /*
     * Get existing stages or initialize them.
     */

    const stages =
      await initializeProjectStages(
        supabase,
        clientId
      );

    /*
     * Determine current stage.
     */

    const currentStage =
      stages.find(
        (stage) =>
          stage.status ===
          "current"
      ) || null;

    /*
     * Count completed stages.
     */

    const completedStageCount =
      stages.filter(
        (stage) =>
          stage.status ===
          "completed"
      ).length;

    /*
     * Calculate progress percentage.
     */

    const progressPercentage =
      stages.length > 0
        ? Math.round(
            (completedStageCount /
              stages.length) *
              100
          )
        : 0;

    return NextResponse.json({
      success: true,
      clientId,
      stages,
      currentStage,
      completedStageCount,
      totalStages:
        stages.length,
      progressPercentage,
    });
  } catch (error) {
    console.error(
      "Project stages GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load project stages.",
      },
      {
        status: 500,
      }
    );
  }
}