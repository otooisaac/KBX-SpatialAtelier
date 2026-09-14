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
 * BRIEF DOCUMENT TYPES
 * ============================================================
 */

const CLIENT_BRIEF_DOCUMENT_TYPES = [
  "kitchen_brief",
  "wardrobe_brief",
  "tv_unit_brief",
  "full_interior_brief",
  "client_brief",
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

type ClientDocumentRow = {
  id: string;
  document_type: string | null;
  created_at: string;
};

/*
 * ============================================================
 * SUPABASE ADMIN CLIENT
 * ============================================================
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
 * LOAD CLIENT BRIEF
 * ============================================================
 *
 * The Client Brief is completed by the client.
 *
 * Once a valid brief document exists:
 *
 * Consultation = completed
 * Client Brief = completed
 * Site Survey = current
 *
 * The admin does NOT complete the Client Brief.
 */

async function getClientBriefDocument(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from("client_documents")
    .select(
      "id, document_type, created_at"
    )
    .eq("client_id", clientId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      error.message
    );
  }

  const documents =
    (data ||
      []) as ClientDocumentRow[];

  const briefDocument =
    documents.find(
      (document) =>
        CLIENT_BRIEF_DOCUMENT_TYPES.includes(
          document.document_type || ""
        )
    ) || null;

  return briefDocument;
}

/*
 * ============================================================
 * INITIALIZE PROJECT STAGES
 * ============================================================
 *
 * Creates the nine stages for a client who does not yet have
 * project_stages records.
 *
 * If the client has already completed a brief:
 *
 * 01 Consultation = completed
 * 02 Client Brief = completed
 * 03 Site Survey = current
 *
 * Otherwise:
 *
 * 01 Consultation = completed
 * 02 Client Brief = current
 * 03–09 = upcoming
 */

async function initializeProjectStages(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  const {
    data: existingStages,
    error: existingStagesError,
  } =
    await supabase
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

  /*
   * If stages already exist, return them.
   *
   * Existing stages are synchronized separately
   * by synchronizeProjectStages().
   */

  if (
    existingStages &&
    existingStages.length > 0
  ) {
    return existingStages as ProjectStageRow[];
  }

  /*
   * Check whether the client has completed
   * a Client Brief.
   */

  const briefDocument =
    await getClientBriefDocument(
      supabase,
      clientId
    );

  const clientBriefCompleted =
    Boolean(briefDocument);

  /*
   * Create all nine stages.
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

        /*
         * Consultation is automatically
         * completed once the client has entered
         * the project system.
         */

        if (
          stage.number === 1
        ) {
          status = "completed";

          completedAt =
            new Date().toISOString();
        }

        /*
         * Client Brief is completed by the
         * client's submitted brief.
         */

        else if (
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
        }

        /*
         * If the client has completed the brief,
         * Site Survey becomes the first admin stage.
         */

        else if (
          stage.number === 3 &&
          clientBriefCompleted
        ) {
          status = "current";
        }

        /*
         * If the client has not completed the
         * brief, Client Brief remains current.
         */

        else if (
          stage.number === 2
        ) {
          status = "current";
        }

        /*
         * Everything else is upcoming.
         */

        else {
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

  const {
    data: insertedStages,
    error: insertError,
  } =
    await supabase
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
 * SYNCHRONIZE PROJECT STAGES
 * ============================================================
 *
 * This is important for clients whose project_stages rows
 * already existed before the Client Brief was completed.
 *
 * It makes the database reflect the actual project state.
 *
 * Client-managed stages:
 *
 * 01 Consultation
 * 02 Client Brief
 *
 * Admin-managed stages:
 *
 * 03 Site Survey
 * 04 Concept
 * 05 Spatial Planning
 * 06 3D Development
 * 07 Technical Documentation
 * 08 Fabrication
 * 09 Installation
 */

async function synchronizeProjectStages(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string,
  stages: ProjectStageRow[]
) {
  /*
   * Find the client's completed brief.
   */

  const briefDocument =
    await getClientBriefDocument(
      supabase,
      clientId
    );

  const clientBriefCompleted =
    Boolean(briefDocument);

  /*
   * ==========================================================
   * CONSULTATION
   * ==========================================================
   *
   * Consultation is automatically completed.
   */

  const consultation =
    stages.find(
      (stage) =>
        stage.stage_number === 1
    );

  if (
    consultation &&
    consultation.status !==
      "completed"
  ) {
    const { error } =
      await supabase
        .from("project_stages")
        .update({
          status: "completed",
          completed_at:
            consultation.completed_at ||
            new Date().toISOString(),
        })
        .eq(
          "id",
          consultation.id
        );

    if (error) {
      throw new Error(
        error.message
      );
    }
  }

  /*
   * ==========================================================
   * CLIENT BRIEF
   * ==========================================================
   *
   * If the client has submitted a brief,
   * Client Brief must be completed.
   */

  const clientBrief =
    stages.find(
      (stage) =>
        stage.stage_number === 2
    );

  if (
    clientBrief &&
    clientBriefCompleted
  ) {
    const needsUpdate =
      clientBrief.status !==
        "completed" ||
      clientBrief.document_id !==
        briefDocument?.id;

    if (needsUpdate) {
      const { error } =
        await supabase
          .from("project_stages")
          .update({
            status: "completed",
            document_id:
              briefDocument?.id ||
              null,
            completed_at:
              briefDocument?.created_at ||
              new Date().toISOString(),
          })
          .eq(
            "id",
            clientBrief.id
          );

      if (error) {
        throw new Error(
          error.message
        );
      }
    }
  }

  /*
   * ==========================================================
   * DETERMINE ADMIN CURRENT STAGE
   * ==========================================================
   *
   * Look at stages 3–9.
   *
   * The first stage that has not been completed
   * becomes current.
   *
   * This means existing projects continue correctly.
   */

  const refreshedStagesResult =
    await supabase
      .from("project_stages")
      .select("*")
      .eq("client_id", clientId)
      .order("stage_number", {
        ascending: true,
      });

  if (
    refreshedStagesResult.error
  ) {
    throw new Error(
      refreshedStagesResult.error.message
    );
  }

  const refreshedStages =
    (refreshedStagesResult.data ||
      []) as ProjectStageRow[];

  /*
   * If the client has NOT completed the brief,
   * Client Brief remains the current stage.
   *
   * This is the only situation where stage 2
   * should remain current.
   */

  if (!clientBriefCompleted) {
    const stageTwo =
      refreshedStages.find(
        (stage) =>
          stage.stage_number === 2
      );

    if (
      stageTwo &&
      stageTwo.status !==
        "current"
    ) {
      const { error } =
        await supabase
          .from("project_stages")
          .update({
            status: "current",
          })
          .eq(
            "id",
            stageTwo.id
          );

      if (error) {
        throw new Error(
          error.message
        );
      }
    }

    return;
  }

  /*
   * The Client Brief is completed.
   *
   * Now find the first incomplete admin stage.
   */

  const firstIncompleteAdminStage =
    refreshedStages.find(
      (stage) =>
        stage.stage_number >= 3 &&
        stage.status !==
          "completed"
    );

  /*
   * If all admin stages are completed,
   * there is no current stage.
   */

  if (
    !firstIncompleteAdminStage
  ) {
    return;
  }

  /*
   * Make the first incomplete admin stage
   * current and make sure other incomplete
   * admin stages are upcoming.
   */

  for (
    const stage of refreshedStages
  ) {
    if (
      stage.stage_number < 3
    ) {
      continue;
    }

    const desiredStatus =
      stage.id ===
      firstIncompleteAdminStage.id
        ? "current"
        : stage.status ===
            "completed"
          ? "completed"
          : "upcoming";

    if (
      stage.status !==
      desiredStatus
    ) {
      const { error } =
        await supabase
          .from("project_stages")
          .update({
            status:
              desiredStatus,
          })
          .eq(
            "id",
            stage.id
          );

      if (error) {
        throw new Error(
          error.message
        );
      }
    }
  }
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
 */

export async function GET(
  request: NextRequest
) {
  try {
    const clientId =
      request.nextUrl.searchParams.get(
        "clientId"
      );

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
     * Initialize the project if this client
     * has never had stages before.
     */

    await initializeProjectStages(
      supabase,
      clientId
    );

    /*
     * Synchronize the stages with the actual
     * client brief and existing project progress.
     */

    const {
      data: stagesBeforeSync,
      error: stagesBeforeSyncError,
    } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq("client_id", clientId)
        .order("stage_number", {
          ascending: true,
        });

    if (stagesBeforeSyncError) {
      throw new Error(
        stagesBeforeSyncError.message
      );
    }

    await synchronizeProjectStages(
      supabase,
      clientId,
      (stagesBeforeSync ||
        []) as ProjectStageRow[]
    );

    /*
     * Fetch the final synchronized state.
     */

    const {
      data: finalStages,
      error: finalStagesError,
    } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq("client_id", clientId)
        .order("stage_number", {
          ascending: true,
        });

    if (finalStagesError) {
      throw new Error(
        finalStagesError.message
      );
    }

    const stages =
      (finalStages ||
        []) as ProjectStageRow[];

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
     * Calculate progress.
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