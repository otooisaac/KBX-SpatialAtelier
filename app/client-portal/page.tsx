"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const RED = "#910B0A";

const CLIENT_ACCOUNTS_KEY = "kbxClientAccounts";
const CURRENT_CLIENT_KEY = "kbxCurrentClientId";
const LEGACY_CLIENT_KEY = "kbxClient";

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  createdAt?: string;
};

type BriefStatus =
  | "not-started"
  | "in-progress"
  | "completed";

type ClientDocument = {
  id: string;
  client_id: string;

  client_name?: string;
  client_email?: string;

  project_name: string | null;

  document_name: string;
  document_type: string;

  storage_path?: string | null;
  mime_type?: string | null;
  file_size?: number | null;

  created_at: string;

  file_name?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  title?: string | null;

  view_url?: string | null;
  download_url?: string | null;
};

/*
 * ============================================================
 * SUPPORTED BRIEF DOCUMENT TYPES
 * ============================================================
 *
 * These are the document_type values produced by
 * /api/send-brief.
 *
 * "client_brief" is retained for compatibility with
 * documents created by the older version of the API.
 */

const SUBMITTED_BRIEF_TYPES = new Set([
  "kitchen_brief",
  "wardrobe_brief",
  "tv_unit_brief",
  "full_interior_brief",
  "client_brief",
]);

function isSubmittedBriefDocument(
  document: ClientDocument
) {
  return SUBMITTED_BRIEF_TYPES.has(
    document.document_type
  );
}

function isFullInteriorBriefDocument(
  document: ClientDocument
) {
  return (
    document.document_type ===
      "full_interior_brief" ||
    document.document_type === "client_brief"
  );
}

/*
 * ============================================================
 * LOCAL STORAGE HELPERS
 * ============================================================
 */

function getBriefStorageKey(clientId: string) {
  return `kbxFullInteriorBrief_${clientId}`;
}

function getLegacyBriefStorageKey(clientId: string) {
  return `kbxBrief_fullInterior_${clientId}`;
}

function readStoredData(key: string) {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch {
    return null;
  }
}

/*
 * ============================================================
 * LOCAL BRIEF STATUS
 * ============================================================
 */

function hasMeaningfulFormData(form: any) {
  if (
    !form ||
    typeof form !== "object"
  ) {
    return false;
  }

  return Object.entries(form).some(
    ([key, value]) => {
      if (key === "confirmation") {
        return value === true;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      if (typeof value === "boolean") {
        return value;
      }

      return (
        value !== null &&
        value !== undefined
      );
    }
  );
}

function getBriefStatus(
  brief: any
): BriefStatus {
  if (!brief) {
    return "not-started";
  }

  if (
    brief.completed === true ||
    brief.submitted === true
  ) {
    return "completed";
  }

  if (
    hasMeaningfulFormData(
      brief.form
    )
  ) {
    return "in-progress";
  }

  return "not-started";
}

/*
 * ============================================================
 * DOCUMENT DATE
 * ============================================================
 */

function formatDocumentDate(
  dateString: string
) {
  try {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date(dateString)
    );
  } catch {
    return "Date unavailable";
  }
}

/*
 * ============================================================
 * DOCUMENT TYPE LABEL
 * ============================================================
 */

function getDocumentTypeLabel(
  documentType: string
) {
  switch (documentType) {
    case "kitchen_brief":
      return "Kitchen Brief";

    case "wardrobe_brief":
      return "Wardrobe Brief";

    case "tv_unit_brief":
      return "TV Unit Brief";

    case "full_interior_brief":
      return "Full Interior Brief";

    case "client_brief":
      return "Client Brief";

    default:
      return "Project Document";
  }
}

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function ClientPortal() {
  const [client, setClient] =
    useState<ClientAccount>({
      id: "",
      name: "",
      email: "",
      contact: "",
    });

  const [isLoaded, setIsLoaded] =
    useState(false);

  /*
   * ==========================================================
   * FULL INTERIOR LOCAL STATUS
   * ==========================================================
   */

  const [
    fullInteriorStatus,
    setFullInteriorStatus,
  ] =
    useState<BriefStatus>(
      "not-started"
    );

  const [
    fullInteriorBrief,
    setFullInteriorBrief,
  ] =
    useState<any>(null);

  /*
   * ==========================================================
   * SERVER COMPLETION
   * ==========================================================
   *
   * Supabase-backed documents are authoritative.
   */

  const [
    serverBriefCompleted,
    setServerBriefCompleted,
  ] = useState(false);

  const [
    serverFullInteriorCompleted,
    setServerFullInteriorCompleted,
  ] = useState(false);

  /*
   * ==========================================================
   * DOCUMENT STATE
   * ==========================================================
   */

  const [
    documents,
    setDocuments,
  ] =
    useState<ClientDocument[]>(
      []
    );

  const [
    documentsLoading,
    setDocumentsLoading,
  ] =
    useState(false);

  const [
    documentsError,
    setDocumentsError,
  ] = useState("");

  const [
    selectedDocument,
    setSelectedDocument,
  ] =
    useState<ClientDocument | null>(
      null
    );

  const [
    documentViewerOpen,
    setDocumentViewerOpen,
  ] = useState(false);

  /*
   * ==========================================================
   * LOAD CLIENT
   * ==========================================================
   *
   * This keeps the current authentication/account mechanism
   * intact for now.
   *
   * Supabase Auth migration will be handled separately.
   */

  useEffect(() => {
    function loadClient() {
      try {
        const currentClientId =
          localStorage.getItem(
            CURRENT_CLIENT_KEY
          );

        const accountsRaw =
          localStorage.getItem(
            CLIENT_ACCOUNTS_KEY
          );

        let accounts: ClientAccount[] =
          [];

        if (accountsRaw) {
          try {
            const parsed =
              JSON.parse(
                accountsRaw
              );

            if (
              Array.isArray(parsed)
            ) {
              accounts = parsed;
            }
          } catch {
            accounts = [];
          }
        }

        /*
         * CURRENT ACCOUNT
         */

        if (currentClientId) {
          const account =
            accounts.find(
              (item) =>
                item.id ===
                currentClientId
            );

          if (account) {
            setClient({
              id: account.id,
              name:
                account.name ||
                "",
              email:
                account.email ||
                "",
              contact:
                account.contact ||
                "",
            });

            setIsLoaded(true);

            return;
          }
        }

        /*
         * LEGACY FALLBACK
         */

        const legacy =
          readStoredData(
            LEGACY_CLIENT_KEY
          );

        if (
          legacy &&
          legacy.id
        ) {
          setClient({
            id: legacy.id,
            name:
              legacy.name || "",
            email:
              legacy.email || "",
            contact:
              legacy.contact || "",
          });
        }
      } catch (error) {
        console.error(
          "Unable to load client profile:",
          error
        );
      } finally {
        setIsLoaded(true);
      }
    }

    loadClient();
  }, []);

  /*
   * ==========================================================
   * LOAD LOCAL FULL INTERIOR DRAFT
   * ==========================================================
   *
   * LocalStorage is only a draft/provisional source.
   *
   * Supabase document completion always takes priority.
   */

  useEffect(() => {
    if (
      !isLoaded ||
      !client.id
    ) {
      return;
    }

    function loadLocalBrief() {
      let brief =
        readStoredData(
          getBriefStorageKey(
            client.id
          )
        );

      /*
       * Legacy key fallback
       */

      if (!brief) {
        brief =
          readStoredData(
            getLegacyBriefStorageKey(
              client.id
            )
          );
      }

      setFullInteriorBrief(
        brief
      );

      /*
       * Never allow localStorage to downgrade
       * a server-confirmed completed state.
       */

      if (
        !serverBriefCompleted
      ) {
        setFullInteriorStatus(
          getBriefStatus(
            brief
          )
        );
      }
    }

    loadLocalBrief();

    window.addEventListener(
      "storage",
      loadLocalBrief
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadLocalBrief
      );
    };
  }, [
    isLoaded,
    client.id,
    serverBriefCompleted,
  ]);

  /*
   * ==========================================================
   * LOAD CLIENT DOCUMENTS
   * ==========================================================
   *
   * useCallback prevents the function from being recreated
   * on every render and fixes the React effect dependency
   * problem.
   */

  const loadDocuments =
    useCallback(
      async (
        clientId: string
      ) => {
        if (!clientId) {
          return;
        }

        setDocumentsLoading(
          true
        );

        setDocumentsError("");

        try {
          const apiUrl =
            `/api/client-documents?clientId=${encodeURIComponent(
              clientId
            )}`;

          const response =
            await fetch(
              apiUrl,
              {
                method: "GET",
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          /*
           * Read text first so HTML errors do not
           * produce misleading JSON parsing errors.
           */

          const responseText =
            await response.text();

          let result: any =
            null;

          try {
            result =
              responseText
                ? JSON.parse(
                    responseText
                  )
                : null;
          } catch {
            console.error(
              "Client documents API returned non-JSON:",
              responseText.substring(
                0,
                500
              )
            );

            throw new Error(
              `The document service returned an invalid response (HTTP ${response.status}).`
            );
          }

          if (!response.ok) {
            throw new Error(
              result?.error ||
                `Unable to load project documents. HTTP ${response.status}.`
            );
          }

          if (
            !result ||
            result.success !==
              true
          ) {
            throw new Error(
              result?.error ||
                "The document service did not return a valid result."
            );
          }

          const loadedDocuments =
            Array.isArray(
              result.documents
            )
              ? result.documents
              : [];

          setDocuments(
            loadedDocuments
          );

          /*
           * ====================================================
           * SERVER BRIEF COMPLETION
           * ====================================================
           *
           * Any recognized submitted brief means the
           * Client Brief stage has been completed.
           */

          const submittedBrief =
            loadedDocuments.find(
              (
                document: ClientDocument
              ) =>
                isSubmittedBriefDocument(
                  document
                )
            );

          if (
            submittedBrief
          ) {
            setServerBriefCompleted(
              true
            );

            setFullInteriorStatus(
              "completed"
            );
          } else {
            setServerBriefCompleted(
              false
            );

            /*
             * If no server document exists,
             * use the local Full Interior draft.
             */

            setFullInteriorStatus(
              getBriefStatus(
                fullInteriorBrief
              )
            );
          }

          /*
           * Specifically check whether the Full Interior
           * Brief has been saved.
           */

          const fullInteriorDocument =
            loadedDocuments.find(
              (
                document: ClientDocument
              ) =>
                isFullInteriorBriefDocument(
                  document
                )
            );

          setServerFullInteriorCompleted(
            Boolean(
              fullInteriorDocument
            )
          );
        } catch (error) {
          console.error(
            "Unable to load client documents:",
            error
          );

          setDocumentsError(
            error instanceof
              Error
              ? error.message
              : "Unable to load project documents."
          );
        } finally {
          setDocumentsLoading(
            false
          );
        }
      },
      [fullInteriorBrief]
    );

  /*
   * ==========================================================
   * LOAD DOCUMENTS AFTER CLIENT LOADS
   * ==========================================================
   */

  useEffect(() => {
    if (
      !isLoaded ||
      !client.id
    ) {
      return;
    }

    loadDocuments(
      client.id
    );
  }, [
    isLoaded,
    client.id,
    loadDocuments,
  ]);

  /*
   * ==========================================================
   * KEEP SERVER COMPLETION SYNCHRONIZED
   * ==========================================================
   */

  useEffect(() => {
    const submittedBrief =
      documents.find(
        (document) =>
          isSubmittedBriefDocument(
            document
          )
      );

    const fullInteriorDocument =
      documents.find(
        (document) =>
          isFullInteriorBriefDocument(
            document
          )
      );

    if (submittedBrief) {
      setServerBriefCompleted(
        true
      );

      setFullInteriorStatus(
        "completed"
      );
    }

    setServerFullInteriorCompleted(
      Boolean(
        fullInteriorDocument
      )
    );
  }, [documents]);

  /*
   * ==========================================================
   * DOCUMENT VIEWER
   * ==========================================================
   */

  function openDocument(
    doc: ClientDocument
  ) {
    if (!doc.view_url) {
      setDocumentsError(
        "This document does not currently have a valid viewing link."
      );

      return;
    }

    setSelectedDocument(
      doc
    );

    setDocumentViewerOpen(
      true
    );

    window.document.body.style.overflow =
      "hidden";
  }

  function closeDocument() {
    setDocumentViewerOpen(
      false
    );

    setSelectedDocument(
      null
    );

    window.document.body.style.overflow =
      "";
  }

  /*
   * ==========================================================
   * ESCAPE KEY
   * ==========================================================
   */

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
          "Escape" &&
        documentViewerOpen
      ) {
        closeDocument();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    documentViewerOpen,
  ]);

  /*
   * ==========================================================
   * INITIALS
   * ==========================================================
   */

  const getInitials = (
    name: string
  ) => {
    if (!name.trim()) {
      return "C";
    }

    const words =
      name
        .trim()
        .split(/\s+/);

    if (
      words.length === 1
    ) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[
        words.length - 1
      ].charAt(0)
    ).toUpperCase();
  };

  const initials =
    getInitials(
      client.name
    );

  /*
   * ==========================================================
   * BRIEF STATUS
   * ==========================================================
   */

  const fullInteriorCompleted =
    fullInteriorStatus ===
    "completed";

  const fullInteriorInProgress =
    fullInteriorStatus ===
    "in-progress";

  /*
   * ==========================================================
   * SUBMITTED DOCUMENTS
   * ==========================================================
   */

  const submittedBriefDocuments =
    documents.filter(
      (document) =>
        isSubmittedBriefDocument(
          document
        )
    );

  /*
   * ==========================================================
   * FULL INTERIOR DOCUMENT
   * ==========================================================
   */

  const completedBriefDocument =
    documents.find(
      (document) =>
        isFullInteriorBriefDocument(
          document
        )
    );

  /*
   * This indicator specifically means the
   * Full Interior Brief has been saved.
   */

  const briefSavedToPortal =
    Boolean(
      completedBriefDocument
    );

  /*
   * ==========================================================
   * PDF PROCESSING INFORMATION
   * ==========================================================
   *
   * These values are retained for compatibility with
   * the existing local submission response.
   */

  const pdfGenerated =
    fullInteriorBrief?.pdfGenerated ===
    true;

  const emailedToKBX =
    fullInteriorBrief?.emailedToKBX ===
    true;

  const emailedToClient =
    fullInteriorBrief?.emailedToClient ===
    true;

  const submissionComplete =
    fullInteriorBrief?.submitted ===
      true &&
    pdfGenerated &&
    emailedToKBX &&
    emailedToClient;

  /*
   * ==========================================================
   * CLIENT BRIEF COMPLETION
   * ==========================================================
   *
   * Server confirmation takes priority.
   *
   * This is the important change:
   *
   * A successfully stored brief PDF means the
   * Client Brief stage is complete.
   */

  const clientBriefCompleted =
    serverBriefCompleted ||
    fullInteriorStatus ===
      "completed";

  /*
   * ==========================================================
   * PROJECT PROGRESS
   * ==========================================================
   */

  const completedStageCount =
    clientBriefCompleted
      ? 2
      : 1;

  const progressPercentage =
    (completedStageCount /
      9) *
    100;

  /*
   * ==========================================================
   * BRIEF LABEL
   * ==========================================================
   */

  function getBriefLabel() {
    if (
      clientBriefCompleted
    ) {
      return "Completed";
    }

    if (
      fullInteriorInProgress
    ) {
      return "In Progress";
    }

    return "Start";
  }

  function getBriefBottomText() {
    if (
      clientBriefCompleted
    ) {
      return "Brief completed";
    }

    if (
      fullInteriorInProgress
    ) {
      return "Your progress is saved";
    }

    return "Not started";
  }

  /*
   * ==========================================================
   * PROJECT STAGES
   * ==========================================================
   */

  const projectStages = [
    {
      number: "01",
      title: "Consultation",
    },
    {
      number: "02",
      title: "Client Brief",
    },
    {
      number: "03",
      title: "Site Survey",
    },
    {
      number: "04",
      title: "Concept",
    },
    {
      number: "05",
      title: "Spatial Planning",
    },
    {
      number: "06",
      title: "3D Development",
    },
    {
      number: "07",
      title: "Technical Documentation",
    },
    {
      number: "08",
      title: "Fabrication",
    },
    {
      number: "09",
      title: "Installation",
    },
  ];

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black" />

          <p className="mt-4 text-xs text-black/40">
            Loading your client portal...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * NO CLIENT
   * ==========================================================
   */

  if (!client.id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
            KBX
          </div>

          <h1 className="mt-6 text-2xl font-semibold">
            Client profile required
          </h1>

          <p className="mt-3 text-sm leading-6 text-black/45">
            Please create or log in
            to your client profile
            before accessing the
            project portal.
          </p>

          <Link
            href="/client-profile"
            className="mt-7 inline-flex rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
            style={{
              backgroundColor: RED,
            }}
          >
            Go to Client Profile →
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * MAIN PORTAL
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">

      {/* =======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[100px] max-w-[1400px] items-center justify-between px-5 md:px-8">

          <Link
            href="/"
            className="flex items-center"
          >
            <div className="relative h-[64px] w-[130px] shrink-0 sm:h-[70px] sm:w-[140px]">
              <Image
                src="/kbx-logo.svg"
                alt="KBX Spatial Atelier"
                fill
                priority
                sizes="140px"
                className="object-contain object-left"
              />
            </div>

            <div className="ml-2 hidden leading-none sm:block">
              <p className="text-sm font-semibold tracking-tight">
                KBX Spatial Atelier
              </p>

              <p className="mt-[6px] text-[10px] uppercase tracking-[0.2em] text-black/45">
                Client Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {client.name ||
                  "Client"}
              </p>

              <p className="text-[10px] text-black/40">
                Active profile
              </p>
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{
                backgroundColor: RED,
              }}
            >
              {initials}
            </div>
          </div>

        </div>
      </header>

      {/* =======================================================
          MAIN
      ======================================================= */}

      <section className="px-5 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-[1200px]">

          {/* ===================================================
              WELCOME
          =================================================== */}

          <div className="mb-10">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{
                color: RED,
              }}
            >
              KBX Client Portal
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              Welcome,
              <br className="hidden md:block" />
              {client.name ||
                "Client"}.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-black/45">
              Manage your project
              information, complete
              your design brief, and
              follow the progress of
              your project with KBX
              Spatial Atelier.
            </p>
          </div>

          {/* ===================================================
              TOP CARDS
          =================================================== */}

          <div className="grid gap-5 md:grid-cols-3">

            {/* CLIENT PROFILE */}

            <div className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                  ◉
                </div>

                <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-black/45">
                  Profile
                </span>
              </div>

              <h2 className="mt-6 text-lg font-semibold">
                Client Profile
              </h2>

              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-black/35">
                    Full name
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {client.name ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-black/35">
                    Email address
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {client.email ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-black/35">
                    WhatsApp / Contact
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {client.contact ||
                      "—"}
                  </p>
                </div>

              </div>

              <div className="mt-6 border-t border-black/10 pt-5">
                <div className="flex items-center justify-between">

                  <p className="text-xs text-black/40">
                    Profile status
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-600" />

                    <p className="text-xs font-medium text-green-700">
                      Active
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* CLIENT BRIEF */}

            <Link
              href="/client-brief-project-type"
              className={`group rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg ${
                clientBriefCompleted
                  ? "border-green-600/20 bg-green-50"
                  : fullInteriorInProgress
                  ? "border-[#910B0A]/30 bg-[#910B0A]/5"
                  : "border-black/10 bg-white hover:border-[#910B0A]/30"
              }`}
            >

              <div className="flex items-center justify-between">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${
                    clientBriefCompleted
                      ? "bg-green-600"
                      : ""
                  }`}
                  style={
                    clientBriefCompleted
                      ? undefined
                      : {
                          backgroundColor:
                            RED,
                        }
                  }
                >
                  {clientBriefCompleted
                    ? "✓"
                    : fullInteriorInProgress
                    ? "↗"
                    : "✦"}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider ${
                    clientBriefCompleted
                      ? "bg-green-600 text-white"
                      : fullInteriorInProgress
                      ? "bg-[#910B0A] text-white"
                      : "text-white"
                  }`}
                  style={
                    clientBriefCompleted ||
                    fullInteriorInProgress
                      ? undefined
                      : {
                          backgroundColor:
                            RED,
                        }
                  }
                >
                  {getBriefLabel()}
                </span>

              </div>

              <h2 className="mt-6 text-lg font-semibold">
                Client Brief
              </h2>

              <p className="mt-2 text-sm leading-5 text-black/45">
                Tell us about your
                project, requirements,
                preferences, and design
                vision.
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">

                <span
                  className={`text-xs ${
                    clientBriefCompleted
                      ? "text-green-700"
                      : fullInteriorInProgress
                      ? "text-[#910B0A]"
                      : "text-black/40"
                  }`}
                >
                  {getBriefBottomText()}
                </span>

                <span
                  className="text-sm font-semibold transition group-hover:translate-x-1"
                  style={{
                    color:
                      clientBriefCompleted
                        ? "#15803d"
                        : RED,
                  }}
                >
                  {clientBriefCompleted
                    ? "View Brief →"
                    : fullInteriorInProgress
                    ? "Continue Brief →"
                    : "Open Brief →"}
                </span>

              </div>

            </Link>

            {/* PROJECT PROGRESS */}

            <div className="rounded-2xl border border-black/10 bg-white p-6">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                  ↗
                </div>

                <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-black/45">
                  Progress
                </span>

              </div>

              <h2 className="mt-6 text-lg font-semibold">
                Project Progress
              </h2>

              <p className="mt-2 text-sm leading-5 text-black/45">
                Follow each stage of your
                project from
                consultation to
                installation.
              </p>

              <div className="mt-6 border-t border-black/10 pt-5">

                <div className="flex items-center justify-between text-xs">

                  <span className="text-black/40">
                    Current stage
                  </span>

                  <span
                    className="font-semibold"
                    style={{
                      color:
                        clientBriefCompleted
                          ? "#15803d"
                          : RED,
                    }}
                  >
                    {clientBriefCompleted
                      ? "Site Survey"
                      : "Client Brief"}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* ===================================================
              PROJECT JOURNEY
          =================================================== */}

          <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 md:p-8">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div>

                <p
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: RED,
                  }}
                >
                  Your project
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Project Journey
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-black/45">
                  Your project will move
                  through the following
                  stages. Completed
                  stages will become
                  available as the
                  project progresses.
                </p>

              </div>

              <div className="rounded-full bg-[#f7f7f5] px-4 py-2 text-xs font-medium text-black/50">
                {completedStageCount} of 9
                stages
              </div>

            </div>

            <div className="mt-8 h-2 overflow-hidden rounded-full bg-black/5">

              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: RED,
                }}
              />

            </div>

            <div className="mt-8 space-y-3">

              {projectStages.map(
                (stage) => {

                  const completed =
                    stage.number ===
                      "01" ||
                    (
                      stage.number ===
                        "02" &&
                      clientBriefCompleted
                    );

                  const current =
                    (
                      stage.number ===
                        "02" &&
                      !clientBriefCompleted
                    ) ||
                    (
                      stage.number ===
                        "03" &&
                      clientBriefCompleted
                    );

                  return (
                    <div
                      key={
                        stage.number
                      }
                      className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                        completed
                          ? "border-green-600/20 bg-green-50"
                          : current
                          ? "border-[#910B0A]/30 bg-[#910B0A]/5"
                          : "border-black/10 bg-[#f7f7f5]"
                      }`}
                    >

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          completed
                            ? "bg-green-600 text-white"
                            : current
                            ? "text-white"
                            : "bg-black/5 text-black/35"
                        }`}
                        style={
                          current
                            ? {
                                backgroundColor:
                                  RED,
                              }
                            : undefined
                        }
                      >
                        {completed
                          ? "✓"
                          : stage.number}
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-semibold">
                          {stage.title}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {completed
                            ? "Completed"
                            : current
                            ? "Action required"
                            : "Upcoming"}
                        </p>

                      </div>

                      {completed && (
                        <span className="hidden rounded-full bg-green-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-700 sm:block">
                          Complete
                        </span>
                      )}

                      {current && (
                        <span
                          className="hidden rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white sm:block"
                          style={{
                            backgroundColor:
                              RED,
                          }}
                        >
                          Current
                        </span>
                      )}

                      {!completed &&
                        !current && (
                          <span className="hidden text-[10px] uppercase tracking-wider text-black/25 sm:block">
                            Upcoming
                          </span>
                        )}

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* ===================================================
              DOCUMENTS + HELP
          =================================================== */}

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            {/* DOCUMENTS */}

            <div className="rounded-2xl border border-black/10 bg-white p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{
                      color: RED,
                    }}
                  >
                    Documents
                  </p>

                  <h2 className="mt-3 text-xl font-semibold">
                    Project Documents
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-black/45">
                    Your project documents
                    and approved files will
                    appear here as your
                    project develops.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    loadDocuments(
                      client.id
                    )
                  }
                  disabled={
                    documentsLoading
                  }
                  className="shrink-0 rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/50 transition hover:border-black/25 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {documentsLoading
                    ? "Loading..."
                    : "Refresh"}
                </button>

              </div>

              {/* ================================================
                  SAVED FULL INTERIOR SUCCESS
              ================================================= */}

              {briefSavedToPortal && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-600/20 bg-green-50 p-4">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                    ✓
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-green-800">
                      Full Interior Brief
                      saved
                    </p>

                    <p className="mt-1 text-xs leading-5 text-green-700">
                      Your submitted brief is
                      safely stored in your
                      project documents.
                    </p>

                  </div>

                </div>
              )}

              {/* ================================================
                  DOCUMENT API ERROR
              ================================================= */}

              {documentsError && (
                <div className="mt-6 rounded-xl border border-[#910B0A]/20 bg-[#910B0A]/5 p-5">

                  <p
                    className="text-sm font-medium"
                    style={{
                      color: RED,
                    }}
                  >
                    Documents unavailable
                  </p>

                  <p className="mt-1 break-words text-xs leading-5 text-black/45">
                    {documentsError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      loadDocuments(
                        client.id
                      )
                    }
                    className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                    style={{
                      backgroundColor:
                        RED,
                    }}
                  >
                    Try Again
                  </button>

                </div>
              )}

              {/* ================================================
                  DOCUMENT LOADING
              ================================================= */}

              {!documentsError &&
                documentsLoading &&
                documents.length ===
                  0 && (
                  <div className="mt-6 rounded-xl border border-black/10 bg-[#f7f7f5] p-6">

                    <div className="flex items-center gap-4">

                      <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-black" />

                      <div>

                        <p className="text-sm font-medium">
                          Loading documents
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          Checking your project
                          files...
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              {/* ================================================
                  SAVED DOCUMENTS
              ================================================= */}

              {!documentsError &&
                documents.length >
                  0 && (

                  <div className="mt-6 space-y-3">

                    {documents.map(
                      (doc) => {

                        const hasViewUrl =
                          Boolean(
                            doc.view_url
                          );

                        const hasDownloadUrl =
                          Boolean(
                            doc.download_url
                          );

                        return (
                          <div
                            key={
                              doc.id
                            }
                            className="group rounded-xl border border-black/10 bg-[#f7f7f5] p-4 transition hover:border-black/20 hover:bg-white"
                          >

                            <div className="flex items-start gap-4">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#910B0A] shadow-sm">
                                PDF
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                  <p className="break-words text-sm font-semibold">
                                    {
                                      doc.document_name
                                    }
                                  </p>

                                  <span className="rounded-full bg-black/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-black/40">
                                    {
                                      getDocumentTypeLabel(
                                        doc.document_type
                                      )
                                    }
                                  </span>

                                </div>

                                {doc.project_name && (
                                  <p className="mt-1 truncate text-xs text-black/45">
                                    {
                                      doc.project_name
                                    }
                                  </p>
                                )}

                                <p className="mt-2 text-[10px] uppercase tracking-wider text-black/30">
                                  {formatDocumentDate(
                                    doc.created_at
                                  )}
                                </p>

                              </div>

                            </div>

                            <div className="mt-4 flex flex-col gap-2 border-t border-black/10 pt-4 sm:flex-row">

                              <button
                                type="button"
                                onClick={() =>
                                  openDocument(
                                    doc
                                  )
                                }
                                disabled={
                                  !hasViewUrl
                                }
                                className="flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                style={{
                                  backgroundColor:
                                    RED,
                                }}
                              >
                                {hasViewUrl
                                  ? "View Document"
                                  : "View Unavailable"}
                              </button>

                              {hasDownloadUrl ? (
                                <a
                                  href={
                                    doc.download_url ||
                                    "#"
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-center text-xs font-semibold text-black transition hover:border-black/25"
                                >
                                  Download PDF
                                </a>
                              ) : (
                                <span className="flex-1 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-center text-xs font-semibold text-black/30">
                                  Download Unavailable
                                </span>
                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              {/* ================================================
                  NO DOCUMENTS
              ================================================= */}

              {!documentsError &&
                !documentsLoading &&
                documents.length ===
                  0 && (

                  <div className="mt-6 rounded-xl border border-dashed border-black/10 bg-[#f7f7f5] p-5">

                    <div className="flex items-center gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg">
                        ▧
                      </div>

                      <div>

                        <p className="text-sm font-medium">
                          No project documents yet
                        </p>

                        <p className="mt-1 text-xs leading-5 text-black/35">
                          Your submitted brief
                          summary PDFs will
                          appear here after
                          they have been
                          successfully
                          submitted.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              {/* ================================================
                  FULL INTERIOR COMPLETED BUT DOCUMENT NOT FOUND
              ================================================= */}

              {documents.length ===
                0 &&
                !documentsError &&
                fullInteriorCompleted &&
                !briefSavedToPortal && (

                  <div className="mt-4 rounded-xl border border-yellow-600/20 bg-yellow-50 p-5">

                    <p className="text-sm font-medium text-yellow-800">
                      Full Interior Brief
                    </p>

                    <p className="mt-1 text-xs leading-5 text-yellow-700">
                      Your brief is marked as
                      completed, but the
                      document has not yet
                      been returned by the
                      document service.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        loadDocuments(
                          client.id
                        )
                      }
                      className="mt-4 rounded-lg bg-yellow-700 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Check Again
                    </button>

                  </div>
                )}

              {/* ================================================
                  FULL INTERIOR IN PROGRESS
              ================================================= */}

              {documents.length ===
                0 &&
                !documentsError &&
                fullInteriorInProgress && (

                  <div className="mt-4 rounded-xl border border-[#910B0A]/20 bg-[#910B0A]/5 p-5">

                    <p
                      className="text-sm font-medium"
                      style={{
                        color: RED,
                      }}
                    >
                      Full Interior Brief
                    </p>

                    <p className="mt-1 text-xs leading-5 text-black/45">
                      Your answers are saved.
                      Continue your brief
                      whenever you&apos;re
                      ready.
                    </p>

                  </div>
                )}

            </div>

            {/* =================================================
                HELP
            ================================================= */}

            <div className="rounded-2xl bg-black p-6 text-white">

              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: RED,
                }}
              >
                Need assistance?
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                We&apos;re here to help.
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                If you have questions
                about your project or
                need assistance
                completing your brief,
                contact KBX Spatial
                Atelier.
              </p>

              <Link
                href="/#contact"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#910B0A] hover:text-white"
              >
                Contact KBX →
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =======================================================
          FOOTER
      ======================================================= */}

      <footer className="border-t border-black/10 bg-white px-5 py-8 md:px-8">

        <div className="mx-auto max-w-[1400px]">

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

            {/* FOOTER BRAND */}

            <div>

              <div className="flex items-center">

                <div className="relative h-[48px] w-[100px] shrink-0 sm:h-[52px] sm:w-[105px]">

                  <Image
                    src="/kbx-logo.svg"
                    alt="KBX Spatial Atelier"
                    fill
                    sizes="105px"
                    className="object-contain object-left"
                  />

                </div>

                <div className="ml-2 leading-none">

                  <p className="text-sm font-semibold">
                    KBX Spatial Atelier
                  </p>

                  <p className="mt-[5px] text-[10px] uppercase tracking-[0.18em] text-black/40">
                    Interior Design •
                    Architecture • Bespoke
                    Space
                  </p>

                </div>

              </div>

              <p className="mt-5 max-w-sm text-xs leading-5 text-black/40">
                Creating thoughtful,
                sophisticated
                environments through
                design, architecture
                and bespoke spatial
                solutions.
              </p>

            </div>

            {/* FOOTER CONTACT */}

            <div className="flex flex-col gap-4 text-xs text-black/50">

              <div className="flex flex-wrap gap-5">

                <a
                  href="tel:+233558167009"
                  className="transition hover:text-black"
                >
                  ☎ +233 558 167 009
                </a>

                <a
                  href="tel:+233209468411"
                  className="transition hover:text-black"
                >
                  ☎ +233 209 468 411
                </a>

              </div>

              <div className="flex flex-wrap gap-5">

                <Link
                  href="/"
                  className="transition hover:text-black"
                >
                  Website ↗
                </Link>

                <Link
                  href="/client-profile"
                  className="transition hover:text-black"
                >
                  Client Profile ↗
                </Link>

              </div>

            </div>

          </div>

          {/* COPYRIGHT */}

          <div className="mt-8 border-t border-black/10 pt-5">

            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.15em] text-black/30 sm:flex-row sm:justify-between">

              <span>
                © 2026 KBX Spatial Atelier
              </span>

              <span>
                Designed with intention.
              </span>

            </div>

            <p className="mt-4 text-center text-[9px] text-black/25">
              Website developed by Isaac
              Otoo, CEO of KBX Spatial
              Atelier.
            </p>

          </div>

        </div>

      </footer>

      {/* =======================================================
          PDF DOCUMENT VIEWER MODAL
      ======================================================= */}

      {documentViewerOpen &&
        selectedDocument && (

          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeDocument();
              }
            }}
          >

            <div className="flex h-full max-h-[95vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* VIEWER HEADER */}

              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-black/10 bg-white px-4 py-4 sm:px-6">

                <div className="min-w-0">

                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      color: RED,
                    }}
                  >
                    Project Document
                  </p>

                  <h2 className="mt-1 truncate text-sm font-semibold sm:text-base">
                    {
                      selectedDocument.document_name
                    }
                  </h2>

                </div>

                <div className="flex shrink-0 items-center gap-2">

                  {selectedDocument.download_url && (
                    <a
                      href={
                        selectedDocument.download_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 sm:inline-flex"
                      style={{
                        backgroundColor:
                          RED,
                      }}
                    >
                      Download PDF
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={
                      closeDocument
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 text-lg text-black/50 transition hover:border-black/25 hover:text-black"
                    aria-label="Close document viewer"
                  >
                    ×
                  </button>

                </div>

              </div>

              {/* PDF VIEWER */}

              <div className="min-h-0 flex-1 bg-[#e9e9e7]">

                {selectedDocument.view_url ? (
                  <iframe
                    src={
                      selectedDocument.view_url
                    }
                    title={
                      selectedDocument.document_name
                    }
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">

                    <div>

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-xl">
                        PDF
                      </div>

                      <h3 className="mt-4 text-lg font-semibold">
                        Document preview
                        unavailable
                      </h3>

                      <p className="mt-2 text-sm text-black/40">
                        The document was
                        saved, but its
                        viewing link is
                        unavailable.
                      </p>

                    </div>

                  </div>
                )}

              </div>

              {/* MOBILE DOWNLOAD */}

              {selectedDocument.download_url && (
                <div className="flex shrink-0 border-t border-black/10 bg-white p-3 sm:hidden">

                  <a
                    href={
                      selectedDocument.download_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl px-5 py-3 text-xs font-semibold text-white"
                    style={{
                      backgroundColor:
                        RED,
                    }}
                  >
                    Download PDF
                  </a>

                </div>
              )}

            </div>

          </div>
        )}

    </main>
  );
}