"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

const RED = "#910B0A";

type ClientAccount = {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  contact?: string;
  phone?: string;
  createdAt?: string;
};

type ProjectStage = {
  id: string;
  client_id: string;
  stage_number: number;
  stage_key: string;
  stage_name: string;
  status: "upcoming" | "current" | "completed";
  document_id: string | null;
  completed_at: string | null;
};

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

function getClientName(client: ClientAccount) {
  return (
    client.fullName ||
    client.name ||
    "Unnamed Client"
  );
}

function getClientEmail(client: ClientAccount) {
  return client.email || "";
}

function getClientPhone(client: ClientAccount) {
  return client.contact || client.phone || "";
}

export default function ProjectManagementPage() {
  const [clients, setClients] =
    useState<ClientAccount[]>([]);

  const [selectedClientId, setSelectedClientId] =
    useState("");

  const [stages, setStages] =
    useState<ProjectStage[]>([]);

  const [selectedStageNumber, setSelectedStageNumber] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [documentName, setDocumentName] =
    useState("");

  const [documentType, setDocumentType] =
    useState("approved_stage_document");

  const [projectName, setProjectName] =
    useState("");

  const [loadingClients, setLoadingClients] =
    useState(true);

  const [loadingStages, setLoadingStages] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * Load the existing client accounts.
   *
   * This uses the same temporary compatibility
   * localStorage account system currently used
   * by the client portal.
   */
  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(
          "kbxClientAccounts"
        );

      if (!raw) {
        setClients([]);
        return;
      }

      const parsed =
        JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setClients(parsed);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error(
        "Could not load client accounts:",
        error
      );

      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  /*
   * Load project stages whenever a client
   * is selected.
   */
  useEffect(() => {
    if (!selectedClientId) {
      setStages([]);
      return;
    }

    async function loadStages() {
      setLoadingStages(true);
      setError("");
      setSuccess("");

      try {
        const response =
          await fetch(
            `/api/project-stages?clientId=${encodeURIComponent(
              selectedClientId
            )}`,
            {
              cache: "no-store",
            }
          );

        const text =
          await response.text();

        let result: any = null;

        try {
          result =
            text ? JSON.parse(text) : null;
        } catch {
          throw new Error(
            "The project stages API returned an invalid response."
          );
        }

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.error ||
              "Failed to load project stages."
          );
        }

        setStages(
          Array.isArray(result.stages)
            ? result.stages
            : []
        );
      } catch (error) {
        console.error(
          "Project stages loading failed:",
          error
        );

        setStages([]);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load project stages."
        );
      } finally {
        setLoadingStages(false);
      }
    }

    loadStages();
  }, [selectedClientId]);

  const selectedClient = useMemo(
    () =>
      clients.find(
        (client) =>
          client.id ===
          selectedClientId
      ) || null,
    [clients, selectedClientId]
  );

  const selectedStage =
    PROJECT_STAGES.find(
      (stage) =>
        String(stage.number) ===
        selectedStageNumber
    ) || null;

  const selectedStageRecord =
    stages.find(
      (stage) =>
        stage.stage_number ===
        Number(selectedStageNumber)
    ) || null;

  /*
   * The API initializes stages when necessary.
   *
   * This helper gives the UI a sensible fallback
   * while the project stage records are being created.
   */
  function getDisplayStageStatus(
    stageNumber: number
  ): "upcoming" | "current" | "completed" {
    const existing =
      stages.find(
        (stage) =>
          stage.stage_number ===
          stageNumber
      );

    if (existing) {
      return existing.status;
    }

    if (stageNumber === 1) {
      return "completed";
    }

    if (stageNumber === 2) {
      return "current";
    }

    return "upcoming";
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0] ||
      null;

    setFile(selectedFile);

    if (selectedFile) {
      setSuccess("");
      setError("");

      /*
       * Automatically create a sensible
       * document name from the filename.
       */
      if (!documentName) {
        const withoutExtension =
          selectedFile.name.replace(
            /\.[^/.]+$/,
            ""
          );

        setDocumentName(
          withoutExtension
        );
      }
    }
  }

  function handleStageChange(
    value: string
  ) {
    setSelectedStageNumber(value);
    setSuccess("");
    setError("");

    const stage =
      PROJECT_STAGES.find(
        (item) =>
          String(item.number) ===
          value
      );

    if (stage) {
      setDocumentName(
        `${stage.name} - Approved`
      );
    }
  }

  async function refreshStages() {
    if (!selectedClientId) {
      return;
    }

    setLoadingStages(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/project-stages?clientId=${encodeURIComponent(
            selectedClientId
          )}`,
          {
            cache: "no-store",
          }
        );

      const text =
        await response.text();

      let result: any = null;

      try {
        result =
          text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          "The project stages API returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to refresh project stages."
        );
      }

      setStages(
        Array.isArray(result.stages)
          ? result.stages
          : []
      );
    } catch (error) {
      console.error(
        "Project stages refresh failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to refresh project stages."
      );
    } finally {
      setLoadingStages(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedClient) {
      setError(
        "Please select a client."
      );
      return;
    }

    if (!selectedStage) {
      setError(
        "Please select a project stage."
      );
      return;
    }

    if (!file) {
      setError(
        "Please select the approved document."
      );
      return;
    }

    if (!documentName.trim()) {
      setError(
        "Please enter a document name."
      );
      return;
    }

    /*
     * The API only allows the current stage
     * to be completed.
     *
     * Stage 1 is already treated as completed.
     */
    const displayStatus =
      getDisplayStageStatus(
        selectedStage.number
      );

    if (
      displayStatus ===
      "completed"
    ) {
      setError(
        `${selectedStage.name} is already completed.`
      );
      return;
    }

    if (
      displayStatus ===
      "upcoming"
    ) {
      setError(
        `${selectedStage.name} is not the current stage. Complete the current stage first.`
      );
      return;
    }

    setUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "clientId",
        selectedClient.id
      );

      formData.append(
        "clientName",
        getClientName(
          selectedClient
        )
      );

      formData.append(
        "clientEmail",
        getClientEmail(
          selectedClient
        )
      );

      formData.append(
        "projectName",
        projectName.trim() ||
          "KBX Spatial Atelier Project"
      );

      formData.append(
        "stageNumber",
        String(
          selectedStage.number
        )
      );

      formData.append(
        "documentName",
        documentName.trim()
      );

      formData.append(
        "documentType",
        documentType
      );

      const response =
        await fetch(
          "/api/upload-documents",
          {
            method: "POST",
            body: formData,
          }
        );

      const text =
        await response.text();

      let result: any = null;

      try {
        result =
          text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          "The upload API returned an invalid response."
        );
      }

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

      const fileInput =
        document.getElementById(
          "approved-document"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await refreshStages();
    } catch (error) {
      console.error(
        "Stage completion failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to complete the project stage."
      );
    } finally {
      setUploading(false);
    }
  }

  const completedCount =
    PROJECT_STAGES.filter(
      (stage) =>
        getDisplayStageStatus(
          stage.number
        ) === "completed"
    ).length;

  const progress =
    Math.round(
      (completedCount /
        PROJECT_STAGES.length) *
        100
    );

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {/* Header */}
        <header className="mb-8 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-[0.22em]"
                style={{
                  color: RED,
                }}
              >
                KBX Spatial Atelier
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Project Management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
              Upload final approved project
documents and update the client&apos;s
project journey.
              </p>
            </div>

            <div className="rounded-2xl bg-black px-5 py-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Project progress
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {progress}%
              </p>
            </div>
          </div>
        </header>

        {/* Client Selection */}
        <section className="mb-6 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{
                color: RED,
              }}
            >
              01 — Client
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Select a client
            </h2>
          </div>

          {loadingClients ? (
            <div className="rounded-2xl bg-black/[0.03] px-5 py-4 text-sm text-black/60">
              Loading clients...
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              No client accounts were found in
              the current client account system.
            </div>
          ) : (
            <select
              value={selectedClientId}
              onChange={(event) => {
                setSelectedClientId(
                  event.target.value
                );
                setSelectedStageNumber("");
                setFile(null);
                setDocumentName("");
                setError("");
                setSuccess("");
              }}
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
            >
              <option value="">
                Select a client
              </option>

              {clients.map(
                (client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {getClientName(
                      client
                    )}{" "}
                    {getClientEmail(
                      client
                    )
                      ? `— ${getClientEmail(
                          client
                        )}`
                      : ""}
                  </option>
                )
              )}
            </select>
          )}

          {selectedClient && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40">
                  Client
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {getClientName(
                    selectedClient
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40">
                  Email
                </p>
                <p className="mt-1 break-all text-sm font-semibold">
                  {getClientEmail(
                    selectedClient
                  ) || "Not provided"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40">
                  Phone
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {getClientPhone(
                    selectedClient
                  ) || "Not provided"}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Project Journey */}
        {selectedClient && (
          <section className="mb-6 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: RED,
                  }}
                >
                  02 — Project Journey
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Stage status
                </h2>
              </div>

              <button
                type="button"
                onClick={refreshStages}
                disabled={loadingStages}
                className="rounded-full border border-black/15 px-4 py-2.5 text-xs font-semibold transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingStages
                  ? "REFRESHING..."
                  : "REFRESH STAGES"}
              </button>
            </div>

            {loadingStages ? (
              <div className="mt-6 rounded-2xl bg-black/[0.03] px-5 py-5 text-sm text-black/60">
                Loading project stages...
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {PROJECT_STAGES.map(
                  (stage) => {
                    const status =
                      getDisplayStageStatus(
                        stage.number
                      );

                    return (
                      <div
                        key={
                          stage.number
                        }
                        className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                          status ===
                          "completed"
                            ? "border-emerald-200 bg-emerald-50"
                            : status ===
                              "current"
                            ? "border-black bg-black text-white"
                            : "border-black/10 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              status ===
                              "completed"
                                ? "bg-emerald-600 text-white"
                                : status ===
                                  "current"
                                ? "bg-white text-black"
                                : "bg-black/[0.06] text-black/40"
                            }`}
                          >
                            {String(
                              stage.number
                            ).padStart(
                              2,
                              "0"
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold">
                              {stage.name}
                            </p>

                            <p
                              className={`mt-1 text-xs ${
                                status ===
                                "current"
                                  ? "text-white/55"
                                  : "text-black/45"
                              }`}
                            >
                              {status ===
                              "completed"
                                ? "Completed"
                                : status ===
                                  "current"
                                ? "Current stage"
                                : "Upcoming"}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`text-xs font-bold uppercase tracking-[0.14em] ${
                            status ===
                            "completed"
                              ? "text-emerald-700"
                              : status ===
                                "current"
                              ? "text-white"
                              : "text-black/35"
                          }`}
                        >
                          {status ===
                          "completed"
                            ? "✓ Completed"
                            : status ===
                              "current"
                            ? "Current"
                            : "Upcoming"}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* Upload */}
        {selectedClient && (
          <section className="mb-6 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p
                className="text-xs font-bold uppercase tracking-[0.18em]"
                style={{
                  color: RED,
                }}
              >
                03 — Approved Document
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Complete a project stage
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
              Upload the final approved document
for the client&apos;s current stage. The
stage will be marked completed and
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="stage"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                >
                  Project stage
                </label>

                <select
                  id="stage"
                  value={
                    selectedStageNumber
                  }
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

                  {PROJECT_STAGES.map(
                    (stage) => {
                      const status =
                        getDisplayStageStatus(
                          stage.number
                        );

                      return (
                        <option
                          key={
                            stage.number
                          }
                          value={String(
                            stage.number
                          )}
                          disabled={
                            status !==
                            "current"
                          }
                        >
                          {String(
                            stage.number
                          ).padStart(
                            2,
                            "0"
                          )}{" "}
                          —{" "}
                          {stage.name}
                          {status ===
                          "completed"
                            ? " — Completed"
                            : status ===
                              "upcoming"
                            ? " — Upcoming"
                            : " — Current"}
                        </option>
                      );
                    }
                  )}
                </select>

                {selectedStageRecord && (
                  <p className="mt-2 text-xs text-black/45">
                    Current status:{" "}
                    <strong>
                      {
                        selectedStageRecord.status
                      }
                    </strong>
                  </p>
                )}
              </div>

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
                  placeholder="e.g. Otoo Residence — Full Interior"
                  className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                />
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
                  placeholder="e.g. Site Survey — Approved"
                  className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="document-type"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                >
                  Document type
                </label>

                <select
                  id="document-type"
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
                >
                  <option value="approved_stage_document">
                    Approved Stage Document
                  </option>

                  <option value="site_survey">
                    Site Survey
                  </option>

                  <option value="concept">
                    Concept
                  </option>

                  <option value="spatial_planning">
                    Spatial Planning
                  </option>

                  <option value="3d_development">
                    3D Development
                  </option>

                  <option value="technical_documentation">
                    Technical Documentation
                  </option>

                  <option value="fabrication">
                    Fabrication
                  </option>

                  <option value="installation">
                    Installation
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="approved-document"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                >
                  Approved document
                </label>

                <input
                  id="approved-document"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={
                    handleFileChange
                  }
                  className="block w-full rounded-2xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                />

                {file && (
                  <p className="mt-2 text-xs text-black/50">
                    Selected:{" "}
                    <strong>
                      {file.name}
                    </strong>
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                  {success}
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
                  backgroundColor:
                    RED,
                }}
              >
                {uploading
                  ? "UPLOADING & COMPLETING..."
                  : "UPLOAD & COMPLETE STAGE"}
              </button>

              <p className="text-center text-xs leading-5 text-black/40">
                Only upload a document after the
                client has reviewed and approved the
                final version.
              </p>
            </form>
          </section>
        )}

        {!selectedClient && !loadingClients && (
          <section className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-semibold">
                Select a client to begin.
              </p>

              <p className="mt-2 text-sm leading-6 text-black/50">
                Once a client is selected, their
                project journey and approved-document
                workflow will appear here.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}