import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PROJECT_STAGES = [
  { number: 1, key: "consultation", name: "Consultation" },
  { number: 2, key: "client_brief", name: "Client Brief" },
  { number: 3, key: "site_survey", name: "Site Survey" },
  { number: 4, key: "concept", name: "Concept" },
  { number: 5, key: "spatial_planning", name: "Spatial Planning" },
  { number: 6, key: "3d_development", name: "3D Development" },
  { number: 7, key: "technical_documentation", name: "Technical Documentation" },
  { number: 8, key: "fabrication", name: "Fabrication" },
  { number: 9, key: "installation", name: "Installation" },
];

const CLIENT_BRIEF_DOCUMENT_TYPES = [
  "kitchen_brief",
  "wardrobe_brief",
  "tv_unit_brief",
  "full_interior_brief",
  "client_brief",
];

type ProjectStageStatus = "upcoming" | "current" | "completed";

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

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

async function getClientProfile(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  clientId: string
) {
  if (!isValidUuid(clientId)) {
    return null;
  }

  const { data, error } = await supabase
    .from("client_profiles")
    .select("auth_user_id, email")
    .eq("auth_user_id", clientId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClientProfileRow | null;
}

async function getClientBriefDocument(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  clientId: string,
  clientEmail?: string
) {
  // First try the exact client_id. This is the preferred association.
  const { data: directDocuments, error: directError } = await supabase
    .from("client_documents")
    .select(
      "id, client_id, client_email, document_type, created_at"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (directError) {
    throw new Error(directError.message);
  }

  const directBrief = (
    (directDocuments || []) as ClientDocumentRow[]
  ).find((document) =>
    CLIENT_BRIEF_DOCUMENT_TYPES.includes(
      document.document_type || ""
    )
  );

  if (directBrief) {
    return directBrief;
  }

  // The portal currently uses temporary text client IDs. In that case,
  // the client email is the reliable fallback association.
  const normalizedClientEmail = normalizeEmail(clientEmail);

  if (normalizedClientEmail) {
    const { data: emailDocuments, error: emailError } =
      await supabase
        .from("client_documents")
        .select(
          "id, client_id, client_email, document_type, created_at"
        )
        .ilike("client_email", normalizedClientEmail)
        .order("created_at", { ascending: false });

    if (emailError) {
      throw new Error(emailError.message);
    }

    const emailBrief = (
      (emailDocuments || []) as ClientDocumentRow[]
    ).find((document) =>
      CLIENT_BRIEF_DOCUMENT_TYPES.includes(
        document.document_type || ""
      )
    );

    if (emailBrief) {
      return emailBrief;
    }
  }

  // Preserve the UUID-based profile fallback for clients that already
  // have a Supabase auth UUID.
  const clientProfile = await getClientProfile(
    supabase,
    clientId
  );

  if (!clientProfile?.email) {
    return null;
  }

  const { data: profileEmailDocuments, error: profileEmailError } =
    await supabase
      .from("client_documents")
      .select(
        "id, client_id, client_email, document_type, created_at"
      )
      .ilike(
        "client_email",
        normalizeEmail(clientProfile.email)
      )
      .order("created_at", { ascending: false });

  if (profileEmailError) {
    throw new Error(profileEmailError.message);
  }

  return (
    (profileEmailDocuments || []) as ClientDocumentRow[]
  ).find((document) =>
    CLIENT_BRIEF_DOCUMENT_TYPES.includes(
      document.document_type || ""
    )
  ) || null;
}

async function initializeProjectStages(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  clientId: string,
  clientEmail?: string
) {
  const { data: existingStages, error: existingStagesError } =
    await supabase
      .from("project_stages")
      .select("*")
      .eq("client_id", clientId)
      .order("stage_number", { ascending: true });

  if (existingStagesError) {
    throw new Error(existingStagesError.message);
  }

  if (existingStages && existingStages.length > 0) {
    return existingStages as ProjectStageRow[];
  }

  const briefDocument = await getClientBriefDocument(
    supabase,
    clientId,
    clientEmail
  );

  const clientBriefCompleted = Boolean(briefDocument);

  const rows = PROJECT_STAGES.map((stage) => {
    let status: ProjectStageStatus = "upcoming";
    let documentId: string | null = null;
    let completedAt: string | null = null;

    if (stage.number === 1) {
      status = "completed";
      completedAt = new Date().toISOString();
    } else if (stage.number === 2 && clientBriefCompleted) {
      status = "completed";
      documentId = briefDocument?.id || null;
      completedAt =
        briefDocument?.created_at || new Date().toISOString();
    } else if (stage.number === 3 && clientBriefCompleted) {
      status = "current";
    } else if (stage.number === 2) {
      status = "current";
    }

    return {
      client_id: clientId,
      stage_number: stage.number,
      stage_key: stage.key,
      stage_name: stage.name,
      status,
      document_id: documentId,
      completed_at: completedAt,
    };
  });

  const { data, error } = await supabase
    .from("project_stages")
    .insert(rows)
    .select("*")
    .order("stage_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as ProjectStageRow[];
}

async function synchronizeProjectStages(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  clientId: string,
  clientEmail: string | undefined,
  stages: ProjectStageRow[]
) {
  const briefDocument = await getClientBriefDocument(
    supabase,
    clientId,
    clientEmail
  );

  const clientBriefCompleted = Boolean(briefDocument);

  // No submitted brief means Client Brief remains the current stage.
  if (!clientBriefCompleted) {
    for (const stage of stages) {
      let desiredStatus: ProjectStageStatus = "upcoming";

      if (stage.stage_number === 1) {
        desiredStatus = "completed";
      } else if (stage.stage_number === 2) {
        desiredStatus = "current";
      }

      if (stage.status !== desiredStatus) {
        const { error } = await supabase
          .from("project_stages")
          .update({
            status: desiredStatus,
            document_id:
              desiredStatus === "completed"
                ? stage.document_id
                : null,
            completed_at:
              desiredStatus === "completed"
                ? stage.completed_at || new Date().toISOString()
                : null,
          })
          .eq("id", stage.id);

        if (error) {
          throw new Error(error.message);
        }
      }
    }

    return;
  }

  // A submitted Client Brief always completes stage 2. The first
  // unfinished stage from stage 3 onward becomes current.
  const { data: refreshedRows, error: refreshedRowsError } =
    await supabase
      .from("project_stages")
      .select("*")
      .eq("client_id", clientId)
      .order("stage_number", { ascending: true });

  if (refreshedRowsError) {
    throw new Error(refreshedRowsError.message);
  }

  const refreshedStages = (refreshedRows || []) as ProjectStageRow[];

  const firstIncompleteAdminStage = refreshedStages.find(
    (stage) =>
      stage.stage_number >= 3 &&
      stage.status !== "completed"
  );

  for (const stage of refreshedStages) {
    let desiredStatus: ProjectStageStatus;

    if (stage.stage_number === 1) {
      desiredStatus = "completed";
    } else if (stage.stage_number === 2) {
      desiredStatus = "completed";
    } else if (
      stage.status === "completed"
    ) {
      desiredStatus = "completed";
    } else if (
      firstIncompleteAdminStage &&
      stage.stage_number === firstIncompleteAdminStage.stage_number
    ) {
      desiredStatus = "current";
    } else {
      desiredStatus = "upcoming";
    }

    const desiredDocumentId =
      stage.stage_number === 2
        ? briefDocument?.id || null
        : stage.document_id;

    const desiredCompletedAt =
      stage.stage_number === 2
        ? briefDocument?.created_at || new Date().toISOString()
        : desiredStatus === "completed"
        ? stage.completed_at || new Date().toISOString()
        : null;

    const needsUpdate =
      stage.status !== desiredStatus ||
      stage.document_id !== desiredDocumentId ||
      stage.completed_at !== desiredCompletedAt;

    if (!needsUpdate) {
      continue;
    }

    const { error } = await supabase
      .from("project_stages")
      .update({
        status: desiredStatus,
        document_id: desiredDocumentId,
        completed_at: desiredCompletedAt,
      })
      .eq("id", stage.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientId =
      request.nextUrl.searchParams.get("clientId")?.trim() || "";

    const clientEmail =
      request.nextUrl.searchParams.get("clientEmail")?.trim() || "";

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "clientId is required.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    await initializeProjectStages(
      supabase,
      clientId,
      clientEmail
    );

    const { data: stagesBeforeSync, error: loadError } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq("client_id", clientId)
        .order("stage_number", { ascending: true });

    if (loadError) {
      throw new Error(loadError.message);
    }

    await synchronizeProjectStages(
      supabase,
      clientId,
      clientEmail,
      (stagesBeforeSync || []) as ProjectStageRow[]
    );

    const { data: finalStages, error: finalLoadError } =
      await supabase
        .from("project_stages")
        .select("*")
        .eq("client_id", clientId)
        .order("stage_number", { ascending: true });

    if (finalLoadError) {
      throw new Error(finalLoadError.message);
    }

    const stages = (finalStages || []) as ProjectStageRow[];
    const currentStage =
      stages.find((stage) => stage.status === "current") || null;

    const completedStageCount = stages.filter(
      (stage) => stage.status === "completed"
    ).length;

    const totalStages = PROJECT_STAGES.length;
    const progressPercentage = Math.round(
      (completedStageCount / totalStages) * 100
    );

    const stage2 = stages.find(
      (stage) => stage.stage_number === 2
    );
    const stage3 = stages.find(
      (stage) => stage.stage_number === 3
    );

    return NextResponse.json({
      success: true,
      clientId,
      diagnostics: {
        clientEmail: clientEmail || null,
        clientBriefFound:
          stage2?.status === "completed",
        stage2Status: stage2?.status || null,
        stage2DocumentId: stage2?.document_id || null,
        stage3Status: stage3?.status || null,
        currentStage: currentStage
          ? {
              number: currentStage.stage_number,
              name: currentStage.stage_name,
              key: currentStage.stage_key,
            }
          : null,
      },
      stages,
      currentStage,
      completedStageCount,
      totalStages,
      progressPercentage,
    });
  } catch (error) {
    console.error("Project stages GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load project stages.",
      },
      { status: 500 }
    );
  }
}
