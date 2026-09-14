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
 * UUID VALIDATION
 * ============================================================
 *
 * Current client accounts can use IDs such as:
 *
 * client-1789130467538-csmiwn
 *
 * These are TEXT identifiers.
 *
 * client_profiles.auth_user_id is a UUID column.
 *
 * Never send a temporary/local client ID to that UUID column.
 */

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

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
 * client_profiles.auth_user_id is a UUID.
 *
 * If the current client ID is a temporary/local text ID,
 * we skip this lookup instead of sending the text ID to
 * the UUID column.
 */

async function getClientProfile(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  if (!isValidUuid(clientId)) {
    console.log(
      "[project-stages] Skipping client_profiles lookup because clientId is not a UUID:",
      clientId
    );

    return null;
  }

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
 * First:
 *   Search by the current client ID.
 *
 * Fallback:
 *   If the client ID is a real Supabase Auth UUID,
 *   search client_profiles and then search documents
 *   using the client's email.
 */

async function getClientBriefDocument(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string
) {
  /*
   * ==========================================================
   * ATTEMPT 1 — CLIENT ID
   * ==========================================================
   *
   * client_documents.client_id is TEXT.
   *
   * Therefore this is safe for:
   *
   * client-1789130467538-csmiwn
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
        storedClientEmail:
          directBrief.client_email,
      }
    );

    return directBrief;
  }

  /*
   * ==========================================================
   * ATTEMPT 2 — CLIENT EMAIL
   * ==========================================================
   *
   * This fallback only runs when clientId is a valid
   * Supabase Auth UUID.
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
      "[project-stages] No client profile/email fallback available:",
      clientId
    );

    return null;
  }

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
   * If stages already exist, leave them in place.
   * Synchronization happens separately.
   */

  if (
    existingStages &&
    existingStages.length > 0
  ) {
    return existingStages as ProjectStageRow[];
  }

  /*
   * Determine whether the client has already submitted
   * a project brief.
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
 * Workflow:
 *
 * 01 Consultation        → Completed
 * 02 Client Brief        → Completed by client
 * 03 Site Survey         → First admin stage / Current
 * 04 Concept             → Upcoming
 * 05 Spatial Planning    → Upcoming
 * 06 3D Development      → Upcoming
 * 07 Technical Docs      → Upcoming
 * 08 Fabrication         → Upcoming
 * 09 Installation        → Upcoming
 *
 * Once the client brief exists, stage 2 is NEVER allowed
 * to remain current.
 */

async function synchronizeProjectStages(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  clientId: string,
  stages: ProjectStageRow[]
) {
  /*
   * Find the submitted client brief.
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
   * CLIENT BRIEF NOT FOUND
   * ==========================================================
   */

  if (!clientBriefCompleted) {
    for (
      const stage of stages
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
   * CLIENT BRIEF FOUND
   * ==========================================================
   *
   * Stage 1:
   *   Completed
   *
   * Stage 2:
   *   Completed
   *
   * Stage 3–9:
   *   The first incomplete stage becomes Current.
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
   * Find the first incomplete admin stage.
   */

  const firstIncompleteAdminStage =
    refreshedStages.find(
      (stage) =>
        stage.stage_number >= 3 &&
        stage.status !==
          "completed"
    );

  /*
   * Update every stage to the correct state.
   */

  for (
    const stage of refreshedStages
  ) {
    /*
     * ========================================================
     * CONSULTATION
     * ========================================================
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
              completed_at:
                stage.completed_at ||
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
     * ========================================================
     * CLIENT BRIEF
     * ========================================================
     */

    if (
      stage.stage_number === 2
    ) {
      const needsUpdate =
        stage.status !==
          "completed" ||
        stage.document_id !==
          briefDocument?.id;

      if (needsUpdate) {
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
     * ========================================================
     * ADMIN STAGES 3–9
     * ========================================================
     */

    let desiredStatus:
      | ProjectStageStatus;

    /*
     * If every admin stage is complete,
     * there is no current stage.
     */

    if (
      !firstIncompleteAdminStage
    ) {
      desiredStatus =
        "completed";
    }

    /*
     * The first incomplete admin stage
     * becomes current.
     */

    else if (
      stage.id ===
      firstIncompleteAdminStage.id
    ) {
      desiredStatus =
        "current";
    }

    /*
     * Any other unfinished stage is upcoming.
     */

    else if (
      stage.status ===
      "completed"
    ) {
      desiredStatus =
        "completed";
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
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * GET:
 *
 * /api/project-stages?clientId=CLIENT_ID
 */

export async function GET(
  request: NextRequest
) {
  try {
    /*
     * ========================================================
     * CLIENT ID
     * ========================================================
     */

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

    /*
     * ========================================================
     * SUPABASE
     * ========================================================
     */

    const supabase =
      getSupabaseAdmin();

    /*
     * ========================================================
     * INITIALIZE
     * ========================================================
     */

    await initializeProjectStages(
      supabase,
      clientId
    );

    /*
     * ========================================================
     * LOAD STAGES
     * ========================================================
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

    const stagesBefore =
      (stagesBeforeSync ||
        []) as ProjectStageRow[];

    /*
     * ========================================================
     * SYNCHRONIZE
     * ========================================================
     */

    await synchronizeProjectStages(
      supabase,
      clientId,
      stagesBefore
    );

    /*
     * ========================================================
     * FINAL STAGES
     * ========================================================
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
     * ========================================================
     * CURRENT STAGE
     * ========================================================
     */

    const currentStage =
      stages.find(
        (stage) =>
          stage.status ===
          "current"
      ) || null;

    /*
     * ========================================================
     * COMPLETED COUNT
     * ========================================================
     */

    const completedStageCount =
      stages.filter(
        (stage) =>
          stage.status ===
          "completed"
      ).length;

    /*
     * ========================================================
     * PROGRESS
     * ========================================================
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
     * ========================================================
     * DIAGNOSTICS
     * ========================================================
     */

    const stage2 =
      stages.find(
        (stage) =>
          stage.stage_number === 2
      ) || null;

    const stage3 =
      stages.find(
        (stage) =>
          stage.stage_number === 3
      ) || null;

    const diagnostics = {
      clientBriefFound:
        stage2?.status ===
        "completed",

      stage2Status:
        stage2?.status ||
        null,

      stage2DocumentId:
        stage2?.document_id ||
        null,

      stage3Status:
        stage3?.status ||
        null,

      currentStage:
        currentStage?.stage_name ||
        null,
    };

    /*
     * ========================================================
     * SERVER LOG
     * ========================================================
     */

    console.log(
      "[project-stages] Final project state:",
      {
        clientId,
        diagnostics,
        stages: stages.map(
          (stage) => ({
            number:
              stage.stage_number,
            name:
              stage.stage_name,
            status:
              stage.status,
            documentId:
              stage.document_id,
          })
        ),
      }
    );

    /*
     * ========================================================
     * RESPONSE
     * ========================================================
     */

    return NextResponse.json({
      success: true,

      clientId,

      diagnostics,

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