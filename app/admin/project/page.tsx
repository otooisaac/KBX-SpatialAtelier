"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const RED = "#910B0A";

type ClientAccount = {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  contact?: string;
  phone?: string;
  projectName?: string | null;
  createdAt?: string | null;
  briefCompleted?: boolean;
};

type ProjectStage = {
  id: string;
  client_id: string;
  stage_number: number;
  stage_key: string;
  stage_name: string;
  status: "upcoming" | "current" | "completed";
  document_id?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type StageDefinition = {
  number: number;
  key: string;
  name: string;
};

const PROJECT_STAGES: StageDefinition[] = [
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

function getClientName(client: ClientAccount): string {
  return client.name || client.fullName || "Unnamed Client";
}

function getClientEmail(client: ClientAccount): string {
  return client.email || "";
}

function getClientContact(client: ClientAccount): string {
  return client.contact || client.phone || "";
}

async function readJsonResponse(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

export default function AdminProjectPage() {
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [selectedStageNumber, setSelectedStageNumber] =
    useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");

  const [loadingClients, setLoadingClients] = useState<boolean>(true);
  const [loadingStages, setLoadingStages] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadClients() {
    setLoadingClients(true);
    setError("");

    try {
      const response = await fetch("/api/admin/clients", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to load clients."
        );
      }

      const loadedClients = Array.isArray(result.clients)
        ? result.clients
        : [];

      setClients(loadedClients);

      if (loadedClients.length === 1 && !selectedClientId) {
        setSelectedClientId(String(loadedClients[0].id));

        if (loadedClients[0].projectName) {
          setProjectName(
            loadedClients[0].projectName || ""
          );
        }
      }
    } catch (err) {
      console.error("Failed to load clients:", err);

      setClients([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load clients."
      );
    } finally {
      setLoadingClients(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const selectedClient = useMemo(() => {
    return (
      clients.find(
        (client) =>
          String(client.id) === String(selectedClientId)
      ) || null
    );
  }, [clients, selectedClientId]);

  async function loadStages() {
    if (!selectedClientId) {
      setStages([]);
      return;
    }

    setLoadingStages(true);
    setError("");

    try {
      const client = clients.find(
        (item) =>
          String(item.id) === String(selectedClientId)
      );

      const clientEmail = client?.email || "";

      const url =
        `/api/project-stages?clientId=${encodeURIComponent(
          selectedClientId
        )}&clientEmail=${encodeURIComponent(clientEmail)}`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "Failed to load project stages."
        );
      }

      const loadedStages = Array.isArray(result.stages)
        ? result.stages
        : [];

      setStages(loadedStages);
    } catch (err) {
      console.error(
        "Failed to load project stages:",
        err
      );

      setStages([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project stages."
      );
    } finally {
      setLoadingStages(false);
    }
  }

  useEffect(() => {
    if (!selectedClientId) {
      setStages([]);
      return;
    }

    loadStages();
  }, [selectedClientId]);

  function getStageRecord(
    stageNumber: number
  ): ProjectStage | undefined {
    return stages.find(
      (stage) =>
        Number(stage.stage_number) === Number(stageNumber)
    );
  }

  function getStageStatus(
    stageNumber: number
  ): "upcoming" | "current" | "completed" {
    const record = getStageRecord(stageNumber);

    if (record) {
      return record.status;
    }

    if (stageNumber === 1) {
      return "completed";
    }

    if (stageNumber === 2) {
      return "current";
    }

    return "upcoming";
  }

  const currentStage =
    PROJECT_STAGES.find(
      (stage) =>
        getStageStatus(stage.number) === "current"
    ) || null;

  const selectedStage =
    PROJECT_STAGES.find(
      (stage) =>
        String(stage.number) ===
        String(selectedStageNumber)
    ) || null;

  const completedStageCount =
    PROJECT_STAGES.filter(
      (stage) =>
        getStageStatus(stage.number) === "completed"
    ).length;

  const progressPercentage =
    PROJECT_STAGES.length > 0
      ? Math.round(
          (completedStageCount /
            PROJECT_STAGES.length) *
            100
        )
      : 0;

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    setSelectedStageNumber("");
    setFile(null);
    setDocumentName("");
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const client = clients.find(
      (item) =>
        String(item.id) === String(clientId)
    );

    setProjectName(client?.projectName || "");
  }

  function handleStageChange(stageNumber: string) {
    setSelectedStageNumber(stageNumber);
    setError("");
    setSuccess("");

    const stage = PROJECT_STAGES.find(
      (item) =>
        String(item.number) === String(stageNumber)
    );

    if (stage) {
      setDocumentName(`${stage.name} - Approved`);
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0] || null;

    setFile(selectedFile);
    setError("");
    setSuccess("");

    if (selectedFile) {
      const filenameWithoutExtension =
        selectedFile.name.replace(
          /\.[^/.]+$/,
          ""
        );

      setDocumentName(filenameWithoutExtension);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedClient) {
      setError("Please select a client first.");
      return;
    }

    if (!selectedStage) {
      setError("Please select a project stage.");
      return;
    }

    if (!file) {
      setError("Please select a document to upload.");
      return;
    }

    if (!documentName.trim()) {
      setError("Please enter a document name.");
      return;
    }

    const stageStatus = getStageStatus(
      selectedStage.number
    );

    if (stageStatus === "completed") {
      setError(
        `${selectedStage.name} is already completed.`
      );
      return;
    }

    if (stageStatus === "upcoming") {
      setError(
        `${selectedStage.name} is not the current stage. Complete the current stage first.`
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "clientId",
        String(selectedClient.id)
      );

      formData.append(
        "clientName",
        getClientName(selectedClient)
      );

      formData.append(
        "clientEmail",
        getClientEmail(selectedClient)
      );

      formData.append(
        "projectName",
        projectName.trim() ||
          "KBX Spatial Atelier Project"
      );

      formData.append(
        "stageNumber",
        String(selectedStage.number)
      );

      formData.append(
        "stageKey",
        selectedStage.key
      );

      formData.append(
        "stageName",
        selectedStage.name
      );

      formData.append(
        "documentName",
        documentName.trim()
      );

      formData.append(
        "documentType",
        selectedStage.key
      );

      const response = await fetch(
        "/api/upload-documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await readJsonResponse(response);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to upload the document."
        );
      }

      setSuccess(
        `${selectedStage.name} has been completed successfully.`
      );

      setFile(null);
      setSelectedStageNumber("");
      setDocumentName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadStages();
    } catch (err) {
      console.error(
        "Document upload failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload the document."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

        <header className="mb-8 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-[0.22em]"
                style={{ color: RED }}
              >
                KBX Spatial Atelier
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Project Management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
                Manage client projects from Client
                Brief through Installation. Approved
                project documents uploaded here are made
                available to the client through the client
                portal.
              </p>
            </div>

            <div className="rounded-2xl bg-black px-6 py-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Project progress
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {progressPercentage}%
              </p>

              <p className="mt-1 text-xs text-white/45">
                {completedStageCount} of{" "}
                {PROJECT_STAGES.length} stages
              </p>
            </div>

          </div>
        </header>

        <section className="mb-6 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: RED }}
            >
              01 — Client
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Select client
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
              Clients are loaded directly from the
              database. Once a client has submitted a
              Client Brief, that submission is associated
              with the client&apos;s project automatically.
            </p>
          </div>

          {loadingClients ? (
            <div className="rounded-2xl bg-black/[0.03] px-5 py-5 text-sm text-black/50">
              Loading clients from database...
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5">

              <p className="font-semibold text-amber-900">
                No clients were found.
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800/75">
                Make sure the client account exists in
                Supabase and that the admin client API is
                configured correctly.
              </p>

              <button
                type="button"
                onClick={loadClients}
                className="mt-4 rounded-full bg-amber-900 px-5 py-2.5 text-xs font-bold text-white"
              >
                TRY AGAIN
              </button>

            </div>
          ) : (
            <select
              value={selectedClientId}
              onChange={(event) =>
                handleClientChange(
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
            >
              <option value="">
                Select a client
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {getClientName(client)}
                  {getClientEmail(client)
                    ? ` — ${getClientEmail(client)}`
                    : ""}
                </option>
              ))}
            </select>
          )}

          {selectedClient && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">

              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                  Client
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {getClientName(selectedClient)}
                </p>
              </div>

              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-semibold">
                  {getClientEmail(selectedClient) ||
                    "Not provided"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                  Contact
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {getClientContact(selectedClient) ||
                    "Not provided"}
                </p>
              </div>

            </div>
          )}

        </section>

        {selectedClient && (
          <section className="mb-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-[24px] border border-black/10 bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
                Current stage
              </p>

              <p
                className="mt-3 text-lg font-semibold"
                style={{ color: RED }}
              >
                {currentStage
                  ? currentStage.name
                  : "Project Complete"}
              </p>

              <p className="mt-1 text-xs text-black/40">
                {currentStage
                  ? "Ready for admin action"
                  : "All project stages completed"}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
                Client Brief
              </p>

              <p className="mt-3 text-lg font-semibold">
                {getStageStatus(2) === "completed"
                  ? "Completed"
                  : "Not completed"}
              </p>

              <p className="mt-1 text-xs text-black/40">
                {getStageStatus(2) === "completed"
                  ? "Automatically received from client"
                  : "Waiting for client submission"}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
                Project progress
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: RED,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-black/40">
                {progressPercentage}% complete
              </p>
            </div>

          </section>
        )}

        {selectedClient && (
          <section className="mb-6 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.18em]"
                  style={{ color: RED }}
                >
                  02 — Project Journey
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Project stages
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
                  Client Brief is handled through the
                  client submission process. Admin project
                  management begins at Site Survey.
                </p>
              </div>

              <button
                type="button"
                onClick={loadStages}
                disabled={loadingStages}
                className="rounded-full border border-black/15 px-5 py-2.5 text-xs font-semibold transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingStages
                  ? "REFRESHING..."
                  : "REFRESH"}
              </button>

            </div>

            {loadingStages ? (
              <div className="mt-6 rounded-2xl bg-black/[0.03] px-5 py-5 text-sm text-black/50">
                Loading project journey...
              </div>
            ) : (
              <div className="mt-7 space-y-3">

                {PROJECT_STAGES.map((stage) => {
                  const status = getStageStatus(
                    stage.number
                  );

                  const adminStage =
                    stage.number >= 3;

                  return (
                    <div
                      key={stage.number}
                      className={`rounded-2xl border p-4 transition ${
                        status === "completed"
                          ? "border-green-200 bg-green-50"
                          : status === "current"
                          ? "border-[#910B0A]/25 bg-[#910B0A]/5"
                          : "border-black/10 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            status === "completed"
                              ? "bg-green-600 text-white"
                              : status === "current"
                              ? "text-white"
                              : "bg-black/[0.05] text-black/35"
                          }`}
                          style={
                            status === "current"
                              ? {
                                  backgroundColor: RED,
                                }
                              : undefined
                          }
                        >
                          {status === "completed"
                            ? "✓"
                            : String(
                                stage.number
                              ).padStart(2, "0")}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="text-sm font-semibold">
                              {stage.name}
                            </p>

                            {stage.number === 2 &&
                              status === "completed" && (
                                <span className="rounded-full bg-green-600/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-green-700">
                                  Client submitted
                                </span>
                              )}

                            {adminStage &&
                              status === "current" && (
                                <span
                                  className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white"
                                  style={{
                                    backgroundColor: RED,
                                  }}
                                >
                                  Admin action
                                </span>
                              )}

                          </div>

                          <p className="mt-1 text-xs text-black/45">
                            {status === "completed"
                              ? "Completed"
                              : status === "current"
                              ? "Current stage"
                              : "Upcoming"}
                          </p>

                        </div>

                        <div
                          className={`hidden text-[10px] font-bold uppercase tracking-[0.14em] sm:block ${
                            status === "completed"
                              ? "text-green-700"
                              : status === "current"
                              ? "text-[#910B0A]"
                              : "text-black/25"
                          }`}
                        >
                          {status === "completed"
                            ? "Complete"
                            : status === "current"
                            ? "Current"
                            : "Upcoming"}
                        </div>

                      </div>

                      {stage.number === 2 &&
                        status === "completed" && (
                          <div className="mt-3 rounded-xl border border-green-200 bg-white/70 px-4 py-3 text-xs leading-5 text-green-800">
                            The Client Brief was submitted
                            by the client and is
                            automatically marked as
                            completed. You do not need
                            to upload it again.
                          </div>
                        )}

                    </div>
                  );
                })}

              </div>
            )}

          </section>
        )}

        {selectedClient &&
          currentStage &&
          currentStage.number >= 3 && (
            <section className="mb-6 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-7">
                <p
                  className="text-xs font-bold uppercase tracking-[0.18em]"
                  style={{ color: RED }}
                >
                  03 — Stage Completion
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Upload approved work
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
                  Upload the approved document for the
                  current project stage. After the upload
                  succeeds, the current stage will become
                  green and the next stage will become
                  current.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div>
                  <label
                    htmlFor="project-name"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                  >
                    Project name
                  </label>

                  <input
                    id="project-name"
                    type="text"
                    value={projectName}
                    onChange={(event) =>
                      setProjectName(
                        event.target.value
                      )
                    }
                    placeholder="KBX Spatial Atelier Project"
                    className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="project-stage"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                  >
                    Project stage
                  </label>

                  <select
                    id="project-stage"
                    value={selectedStageNumber}
                    onChange={(event) =>
                      handleStageChange(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
                  >
                    <option value="">
                      Select current stage
                    </option>

                    {PROJECT_STAGES
                      .filter(
                        (stage) =>
                          stage.number >= 3
                      )
                      .map((stage) => {
                        const status =
                          getStageStatus(
                            stage.number
                          );

                        return (
                          <option
                            key={stage.number}
                            value={String(
                              stage.number
                            )}
                            disabled={
                              status !== "current"
                            }
                          >
                            {String(
                              stage.number
                            ).padStart(2, "0")}{" "}
                            — {stage.name}
                            {status === "completed"
                              ? " — Completed"
                              : status === "upcoming"
                              ? " — Upcoming"
                              : " — Current"}
                          </option>
                        );
                      })}
                  </select>

                  <p className="mt-2 text-xs text-black/40">
                    Current stage:{" "}
                    <strong className="text-black/70">
                      {currentStage.name}
                    </strong>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="document-name"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                  >
                    Document name
                  </label>

                  <input
                    id="document-name"
                    type="text"
                    value={documentName}
                    onChange={(event) =>
                      setDocumentName(
                        event.target.value
                      )
                    }
                    placeholder="Site Survey - Approved"
                    className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="approved-document"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                  >
                    Approved document
                  </label>

                  <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf8] p-5">

                    <p className="text-sm font-semibold">
                      Upload stage document
                    </p>

                    <p className="mt-1 text-xs leading-5 text-black/40">
                      Select the approved PDF, drawing,
                      presentation, schedule, or other
                      project document for this stage.
                    </p>

                    <input
                      ref={fileInputRef}
                      id="approved-document"
                      type="file"
                      onChange={handleFileChange}
                      className="mt-4 block w-full text-sm"
                    />

                    {file && (
                      <div className="mt-4 rounded-xl bg-white px-4 py-3">

                        <p className="text-xs font-semibold">
                          Selected file
                        </p>

                        <p className="mt-1 break-all text-xs text-black/50">
                          {file.name}
                        </p>

                        <p className="mt-1 text-[10px] text-black/35">
                          {(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>

                      </div>
                    )}

                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm leading-6 text-green-800">

                    <p className="font-semibold">
                      {success}
                    </p>

                    <p className="mt-1 text-xs text-green-700/70">
                      The project journey has been
                      refreshed. The completed stage
                      should now be green and the next
                      stage should be current.
                    </p>

                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    uploading ||
                    !selectedStage ||
                    !file
                  }
                  className="w-full rounded-full px-6 py-4 text-sm font-bold tracking-[0.08em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    backgroundColor: RED,
                  }}
                >
                  {uploading
                    ? "UPLOADING & COMPLETING..."
                    : "UPLOAD & COMPLETE STAGE"}
                </button>

                <p className="text-center text-xs leading-5 text-black/35">
                  Only upload the approved work for
                  the current stage. The next stage
                  cannot be completed before the current
                  stage.
                </p>

              </form>

            </section>
          )}

        {selectedClient &&
          currentStage &&
          currentStage.number === 2 && (
            <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Waiting for client
              </p>

              <h2 className="mt-2 text-xl font-semibold text-amber-900">
                Client Brief has not been submitted.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800/70">
                The admin workflow begins at Site Survey.
                Once this client completes and submits the
                Client Brief, the project will automatically
                move forward and Site Survey will become the
                current admin stage.
              </p>

            </section>
          )}

        {selectedClient &&
          !currentStage &&
          completedStageCount ===
            PROJECT_STAGES.length && (
            <section className="rounded-[28px] border border-green-200 bg-green-50 p-8">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
                Project complete
              </p>

              <h2 className="mt-2 text-xl font-semibold text-green-900">
                All project stages are completed.
              </h2>

              <p className="mt-2 text-sm leading-6 text-green-800/70">
                This project has successfully reached
                Installation and there are no remaining
                stages to complete.
              </p>

            </section>
          )}

        {!selectedClient &&
          !loadingClients && (
            <section className="rounded-[28px] border border-dashed border-black/15 bg-white p-12 text-center">

              <div className="mx-auto max-w-md">

                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-light text-white"
                  style={{
                    backgroundColor: RED,
                  }}
                >
                  +
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                  Select a client to begin
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/45">
                  Choose a client from the database above
                  to view the project journey and manage
                  the current project stage.
                </p>

              </div>

            </section>
          )}

      </div>
    </main>
  );
}