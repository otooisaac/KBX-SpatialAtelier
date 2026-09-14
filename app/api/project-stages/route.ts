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
 * CLIENT BRIEF DOCUMENT TYPES
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

type ProjectStageStatus =
  | "upcoming"
  | "current"
  | "completed";

type ProjectStageRow = {
  id: string;
  client_id: string;
  stage_number: number;
  stage_key: string;
  stage_name: string;
  status: ProjectStageStatus;
  document_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ClientDocumentRow = {
  id: string;
  client_id: string | null;
  client_email: string | null;
  document_type: string | null;
  created_at: string;
};

type ClientProfileRow = {
  auth_user_id: string;
  email: string;
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
 * LOAD CLIENT PROFILE
 * ============================================================
 *
 * The current client ID is normally the Supabase Auth UUID.
 *
 * This gives us the client's email so that older documents
 * saved with a legacy client_id can still be recognized.
 */

async function getClientProfile(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from("client_profiles")
    .select(
      "auth_user_id, email"
    )
    .eq(
      "auth_user_id",
      clientId
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  return (
    data as ClientProfileRow | null
  );
}

/*
 * ============================================================
 * LOAD CLIENT BRIEF
 * ============================================================
 *
 * First attempt:
 *     Find the brief using the current client_id.
 *
 * Fallback:
 *     If the client recently migrated to Supabase Auth,
 *     find the client's email from client_profiles and
 *     search client_documents by email.
 *
 * This protects the stage workflow from old/legacy client IDs.
 */

async function getClientBriefDocument(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  /*
   * ==========================================================
   * ATTEMPT 1
   * ==========================================================
   *
   * Search using the exact client ID.
   */

  const {
    data: directDocuments,
    error: directError,
  } =
    await supabase
      .from("client_documents")
      .select(
        "id, client_id, client_email, document_type, created_at"
      )
      .eq(
        "client_id",
        clientId
      )
      .order("created_at", {
        ascending: false,
      });

  if (directError) {
    throw new Error(
      directError.message
    );
  }

  const directBrief =
    (
      (directDocuments ||
        []) as ClientDocumentRow[]
    ).find(
      (document) =>
        CLIENT_BRIEF_DOCUMENT_TYPES.includes(
          document.document_type || ""
        )
    );

  if (directBrief) {
    console.log(
      "[project-stages] Client brief found by client_id:",
      {
        clientId,
        documentId:
          directBrief.id,
        documentType:
          directBrief.document_type,
      }
    );

    return directBrief;
  }

  /*
   * ==========================================================
   * ATTEMPT 2
   * ==========================================================
   *
   * The client may have a legacy document whose client_id
   * differs from the current Supabase Auth UUID.
   *
   * Find the client's email from client_profiles.
   */

  const clientProfile =
    await getClientProfile(
      supabase,
      clientId
    );

  if (
    !clientProfile?.email
  ) {
    console.log(
      "[project-stages] No client profile found for client:",
      clientId
    );

    return null;
  }

  /*
   * Search client_documents using the client's email.
   *
   * ilike allows the search to work regardless of email
   * capitalization.
   */

  const {
    data: emailDocuments,
    error: emailError,
  } =
    await supabase
      .from("client_documents")
      .select(
        "id, client_id, client_email, document_type, created_at"
      )
      .ilike(
        "client_email",
        clientProfile.email
      )
      .order("created_at", {
        ascending: false,
      });

  if (emailError) {
    throw new Error(
      emailError.message
    );
  }

  const emailBrief =
    (
      (emailDocuments ||
        []) as ClientDocumentRow[]
    ).find(
      (document) =>
        CLIENT_BRIEF_DOCUMENT_TYPES.includes(
          document.document_type || ""
        )
    );

  if (emailBrief) {
    console.log(
      "[project-stages] Client brief found by email fallback:",
      {
        currentClientId:
          clientId,
        storedDocumentClientId:
          emailBrief.client_id,
        documentId:
          emailBrief.id,
        documentType:
          emailBrief.document_type,
        email:
          clientProfile.email,
      }
    );

    return emailBrief;
  }

  console.log(
    "[project-stages] No client brief found:",
    {
      clientId,
      email:
        clientProfile.email,
    }
  );

  return null;
}

/*
 * ============================================================
 * INITIALIZE PROJECT STAGES
 * ============================================================
 *
 * Creates the nine stages for a client who does not yet have
 * project_stages records.
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
      .eq(
        "client_id",
        clientId
      )
      .order("stage_number", {
        ascending: true,
      });

  if (existingStagesError) {
    throw new Error(
      existingStagesError.message
    );
  }

  /*
   * Existing stages will be synchronized later.
   */

  if (
    existingStages &&
    existingStages.length > 0
  ) {
    return existingStages as ProjectStageRow[];
  }

  /*
   * Find the client's brief.
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
        let status: ProjectStageStatus =
          "upcoming";

        let documentId:
          | string
          | null = null;

        let completedAt:
          | string
          | null = null;

        /*
         * Consultation
         */

        if (
          stage.number === 1
        ) {
          status = "completed";

          completedAt =
            new Date().toISOString();
        }

        /*
         * Client Brief
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
         * Site Survey
         */

        else if (
          stage.number === 3 &&
          clientBriefCompleted
        ) {
          status = "current";
        }

        /*
         * Client Brief still pending
         */

        else if (
          stage.number === 2
        ) {
          status = "current";
        }

        /*
         * Everything else
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
 * This is the central workflow controller.
 *
 * Client side:
 *
 * Consultation       = completed
 * Client Brief       = completed once submitted
 *
 * Admin side:
 *
 * Site Survey        = current
 * Concept            = next
 * Spatial Planning   = next
 * etc.
 */

async function synchronizeProjectStages(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string,
  stages: ProjectStageRow[]
) {
  /*
   * Find the client's submitted brief.
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
          status:
            "completed",
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
   * If a valid brief exists, stage 2 MUST be completed.
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
    const { error } =
      await supabase
        .from("project_stages")
        .update({
          status:
            "completed",
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

  /*
   * ==========================================================
   * BRIEF NOT COMPLETED
   * ==========================================================
   *
   * If there is no brief yet:
   *
   * Consultation = completed
   * Client Brief  = current
   * Stage 3–9     = upcoming
   */

  if (!clientBriefCompleted) {
    /*
     * Refresh after the updates above.
     */

    const {
      data: currentRows,
      error: currentRowsError,
    } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq(
          "client_id",
          clientId
        )
        .order("stage_number", {
          ascending: true,
        });

    if (currentRowsError) {
      throw new Error(
        currentRowsError.message
      );
    }

    const currentStages =
      (currentRows ||
        []) as ProjectStageRow[];

    for (
      const stage of currentStages
    ) {
      let desiredStatus:
        | ProjectStageStatus;

      if (
        stage.stage_number === 1
      ) {
        desiredStatus =
          "completed";
      } else if (
        stage.stage_number === 2
      ) {
        desiredStatus =
          "current";
      } else {
        desiredStatus =
          "upcoming";
      }

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

    return;
  }

  /*
   * ==========================================================
   * CLIENT BRIEF IS COMPLETE
   * ==========================================================
   *
   * Stage 2 is now permanently completed.
   *
   * Find the first incomplete admin stage.
   */

  const {
    data: refreshedRows,
    error: refreshedRowsError,
  } =
    await supabase
      .from("project_stages")
      .select("*")
      .eq(
        "client_id",
        clientId
      )
      .order("stage_number", {
        ascending: true,
      });

  if (refreshedRowsError) {
    throw new Error(
      refreshedRowsError.message
    );
  }

  const refreshedStages =
    (refreshedRows ||
      []) as ProjectStageRow[];

  /*
   * Find first incomplete stage from stage 3 onward.
   */

  const firstIncompleteAdminStage =
    refreshedStages.find(
      (stage) =>
        stage.stage_number >= 3 &&
        stage.status !==
          "completed"
    );

  /*
   * If everything after the brief is completed,
   * there is no current stage.
   */

  if (
    !firstIncompleteAdminStage
  ) {
    return;
  }

  /*
   * Make exactly one admin stage current.
   */

  for (
    const stage of refreshedStages
  ) {
    /*
     * Client-managed stages.
     */

    if (
      stage.stage_number === 1
    ) {
      if (
        stage.status !==
        "completed"
      ) {
        const { error } =
          await supabase
            .from("project_stages")
            .update({
              status:
                "completed",
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

      continue;
    }

    if (
      stage.stage_number === 2
    ) {
      if (
        stage.status !==
        "completed"
      ) {
        const { error } =
          await supabase
            .from("project_stages")
            .update({
              status:
                "completed",
              document_id:
                briefDocument?.id ||
                null,
              completed_at:
                briefDocument?.created_at ||
                new Date().toISOString(),
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

      continue;
    }

    /*
     * Admin-managed stages 3–9.
     */

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
     * Initialize stages if necessary.
     */

    await initializeProjectStages(
      supabase,
      clientId
    );

    /*
     * Load current stages.
     */

    const {
      data: stagesBeforeSync,
      error: stagesBeforeSyncError,
    } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq(
          "client_id",
          clientId
        )
        .order("stage_number", {
          ascending: true,
        });

    if (stagesBeforeSyncError) {
      throw new Error(
        stagesBeforeSyncError.message
      );
    }

    /*
     * Synchronize the workflow.
     */

    await synchronizeProjectStages(
      supabase,
      clientId,
      (stagesBeforeSync ||
        []) as ProjectStageRow[]
    );

    /*
     * Fetch final state.
     */

    const {
      data: finalStages,
      error: finalStagesError,
    } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq(
          "client_id",
          clientId
        )
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
     * Current stage.
     */

    const currentStage =
      stages.find(
        (stage) =>
          stage.status ===
          "current"
      ) || null;

    /*
     * Completed stages.
     */

    const completedStageCount =
      stages.filter(
        (stage) =>
          stage.status ===
          "completed"
      ).length;

    /*
     * Progress.
     */

    const progressPercentage =
      stages.length > 0
        ? Math.round(
            (completedStageCount /
              stages.length) *
              100
          )
        : 0;

    /*
     * Log the final state so we can verify the
     * workflow from Vercel logs if necessary.
     */

    console.log(
      "[project-stages] Final project state:",
      {
        clientId,
        stages: stages.map(
          (stage) => ({
            number:
              stage.stage_number,
            name:
              stage.stage_name,
            status:
              stage.status,
          })
        ),
        currentStage:
          currentStage?.stage_name ||
          null,
      }
    );

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