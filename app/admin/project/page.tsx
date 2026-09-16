"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const RED = "#910B0A";

type Client = {
  id?: string;
  clientId?: string;
  name?: string;
  email?: string;
  phone?: string;
  projectName?: string;
  projectType?: string;
};

type DocumentItem = {
  id: string;
  name: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  category: string;
  description?: string;
  url?: string;
  createdAt?: string;
};

const categories = [
  "Client Brief",
  "Site Survey",
  "Floor Plan",
  "Concept",
  "3D Visualization",
  "Technical Drawing",
  "Quotation",
  "Invoice",
  "Material Selection",
  "Fabrication",
  "Installation",
  "Other",
];

function formatFileSize(bytes?: number) {
  if (!bytes) return "—";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getClientId(client: Client | null) {
  if (!client) return "";

  return (
    client.id ||
    client.clientId ||
    ""
  );
}

export default function AdminProjectPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");

  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ========================================================= */
  /* LOAD CLIENT */
  /* ========================================================= */

  useEffect(() => {
    try {
      const currentClientId =
        localStorage.getItem("kbxCurrentClientId");

      const clientData =
        localStorage.getItem("kbxClient");

      const clientAccounts =
        localStorage.getItem("kbxClientAccounts");

      let foundClient: Client | null = null;

      /*
       * First try the currently selected client.
       */
      if (clientAccounts && currentClientId) {
        try {
          const accounts = JSON.parse(clientAccounts);

          if (Array.isArray(accounts)) {
            foundClient =
              accounts.find(
                (account: Client) =>
                  getClientId(account) === currentClientId
              ) || null;
          } else if (
            accounts &&
            typeof accounts === "object"
          ) {
            foundClient =
              accounts[currentClientId] || null;
          }
        } catch {
          // Ignore malformed account storage.
        }
      }

      /*
       * Fall back to kbxClient.
       */
      if (!foundClient && clientData) {
        try {
          foundClient = JSON.parse(clientData);
        } catch {
          foundClient = null;
        }
      }

      setClient(foundClient);
    } catch {
      setClient(null);
    } finally {
      setLoadingClient(false);
    }
  }, []);

  /* ========================================================= */
  /* LOAD DOCUMENTS */
  /* ========================================================= */

  useEffect(() => {
    const clientId = getClientId(client);

    if (!clientId) {
      setDocuments([]);
      return;
    }

    loadDocuments(clientId);
  }, [client]);

  async function loadDocuments(clientId: string) {
    setLoadingDocuments(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/documents?clientId=${encodeURIComponent(
          clientId
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load documents."
        );
      }

      setDocuments(
        Array.isArray(data.documents)
          ? data.documents
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }

  /* ========================================================= */
  /* SELECT FILE */
  /* ========================================================= */

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);

    if (!documentName) {
      setDocumentName(
        selectedFile.name.replace(/\.[^/.]+$/, "")
      );
    }

    setMessage("");
    setError("");
  }

  /* ========================================================= */
  /* UPLOAD DOCUMENT */
  /* ========================================================= */

  async function handleUpload(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const clientId = getClientId(client);

    if (!clientId) {
      setError(
        "No client is currently selected. Open a client project first."
      );
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

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("clientId", clientId);
      formData.append(
        "clientName",
        client?.name || ""
      );
      formData.append(
        "projectName",
        client?.projectName || ""
      );
      formData.append(
        "projectType",
        client?.projectType || ""
      );
      formData.append(
        "documentName",
        documentName.trim()
      );
      formData.append("category", category);
      formData.append(
        "description",
        description.trim()
      );

      const response = await fetch(
        "/api/admin/documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Document upload failed."
        );
      }

      setMessage("Document uploaded successfully.");

      setDocuments((current) => [
        data.document,
        ...current,
      ]);

      setFile(null);
      setDocumentName("");
      setCategory("Other");
      setDescription("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Document upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  /* ========================================================= */
  /* DELETE DOCUMENT */
  /* ========================================================= */

  async function handleDelete(document: DocumentItem) {
    const clientId = getClientId(client);

    if (!clientId) return;

    const confirmed = window.confirm(
      `Delete "${document.name}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/admin/documents",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: document.id,
            clientId,
            fileName: document.fileName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to delete document."
        );
      }

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== document.id
        )
      );

      setMessage("Document deleted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete document."
      );
    }
  }

  /* ========================================================= */
  /* NO CLIENT */
  /* ========================================================= */

  if (!loadingClient && !client) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-black">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-8">
            <Link
              href="/"
              className="text-sm font-semibold"
            >
              KBX Spatial Atelier
            </Link>

            <Link
              href="/"
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium"
            >
              Back to Website
            </Link>
          </div>
        </header>

        <section className="mx-auto flex min-h-[70vh] max-w-[700px] items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-xl text-white"
              style={{ backgroundColor: RED }}
            >
              !
            </div>

            <h1 className="mt-6 text-2xl font-semibold">
              No client selected
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
              Select or open a client project before
              uploading project documents.
            </p>

            <Link
              href="/client-profile"
              className="mt-7 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: RED }}
            >
              Open Client Profile
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const clientId = getClientId(client);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-8">

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight"
            >
              KBX Spatial Atelier
            </Link>

            <span className="text-black/20">
              /
            </span>

            <span className="text-xs text-black/45">
              Admin
            </span>

            <span className="text-black/20">
              /
            </span>

            <span className="text-xs font-medium">
              Project
            </span>
          </div>

          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium transition hover:border-black/25"
          >
            Website
          </Link>

        </div>
      </header>

      {/* ===================================================== */}
      {/* PAGE */}
      {/* ===================================================== */}

      <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-8 md:py-10">

        {/* PAGE HEADER */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: RED }}
            >
              Project Management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Client Documents
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-black/50">
              Manage documents associated with this
              client project and upload files as the
              project progresses.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
              Client ID
            </p>

            <p className="mt-1 break-all text-xs font-medium">
              {clientId || "—"}
            </p>
          </div>

        </div>

        {/* ================================================= */}
        {/* CLIENT CARD */}
        {/* ================================================= */}

        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 md:p-7">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                Current Client
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {client?.name || "Unnamed Client"}
              </h2>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/50">

                {client?.email && (
                  <span>
                    {client.email}
                  </span>
                )}

                {client?.phone && (
                  <span>
                    {client.phone}
                  </span>
                )}

              </div>
            </div>

            <div className="text-left md:text-right">

              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                Project
              </p>

              <p className="mt-2 text-sm font-medium">
                {client?.projectName ||
                  "Untitled Project"}
              </p>

              {client?.projectType && (
                <p className="mt-1 text-xs text-black/45">
                  {client.projectType}
                </p>
              )}

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* STATUS */}
        {/* ================================================= */}

        {(message || error) && (
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {error || message}
          </div>
        )}

        {/* ================================================= */}
        {/* MAIN GRID */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">

          {/* ================================================= */}
          {/* UPLOAD */}
          {/* ================================================= */}

          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-7">

            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: RED }}
              >
                Upload
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Add a project document
              </h2>

              <p className="mt-2 text-xs leading-5 text-black/45">
                Upload drawings, briefs, quotations,
                surveys, renders or other project files.
              </p>
            </div>

            <form
              onSubmit={handleUpload}
              className="mt-7 space-y-4"
            >

              {/* FILE */}

              <div>

                <label className="mb-2 block text-xs font-semibold">
                  File
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full cursor-pointer rounded-xl border border-black/10 bg-[#f7f7f5] px-3 py-3 text-xs file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
                />

                {file && (
                  <div className="mt-2 rounded-xl bg-[#f7f7f5] px-3 py-2 text-xs text-black/50">
                    Selected:{" "}
                    <span className="font-medium text-black">
                      {file.name}
                    </span>{" "}
                    ({formatFileSize(file.size)})
                  </div>
                )}

              </div>

              {/* DOCUMENT NAME */}

              <div>

                <label className="mb-2 block text-xs font-semibold">
                  Document name
                </label>

                <input
                  type="text"
                  value={documentName}
                  onChange={(event) =>
                    setDocumentName(event.target.value)
                  }
                  placeholder="e.g. Site Survey Measurements"
                  className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                />

              </div>

              {/* CATEGORY */}

              <div>

                <label className="mb-2 block text-xs font-semibold">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                >
                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-xs font-semibold">
                  Description
                  <span className="ml-1 font-normal text-black/35">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Add a short description..."
                  className="w-full resize-none rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                />

              </div>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: RED,
                }}
              >
                {uploading
                  ? "Uploading..."
                  : "Upload Document →"}
              </button>

            </form>

          </section>

          {/* ================================================= */}
          {/* DOCUMENT LIST */}
          {/* ================================================= */}

          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-7">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p
                  className="text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ color: RED }}
                >
                  Project Files
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Uploaded documents
                </h2>

              </div>

              <div className="rounded-full bg-[#f7f7f5] px-3 py-1.5 text-xs font-medium">
                {documents.length}{" "}
                {documents.length === 1
                  ? "file"
                  : "files"}
              </div>

            </div>

            <div className="mt-6">

              {loadingDocuments ? (
                <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-8 text-center">
                  <p className="text-sm text-black/45">
                    Loading documents...
                  </p>
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#f7f7f5] p-10 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg text-white">
                    ↑
                  </div>

                  <h3 className="mt-4 text-sm font-semibold">
                    No documents yet
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-black/40">
                    Uploaded project documents will
                    appear here.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="group rounded-2xl border border-black/10 p-4 transition hover:border-black/20"
                    >

                      <div className="flex gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f7f5] text-sm">
                          📄
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                            <div className="min-w-0">

                              <h3 className="truncate text-sm font-semibold">
                                {document.name}
                              </h3>

                              <p className="mt-1 truncate text-xs text-black/40">
                                {document.fileName}
                              </p>

                            </div>

                            <span className="w-fit shrink-0 rounded-full bg-[#f7f7f5] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-black/50">
                              {document.category}
                            </span>

                          </div>

                          {document.description && (
                            <p className="mt-3 text-xs leading-5 text-black/45">
                              {document.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-black/35">

                            <span>
                              {formatFileSize(
                                document.fileSize
                              )}
                            </span>

                            {document.createdAt && (
                              <span>
                                {new Date(
                                  document.createdAt
                                ).toLocaleDateString()}
                              </span>
                            )}

                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">

                            {document.url && (
                              <a
                                href={document.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-black px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#910B0A]"
                              >
                                Open Document ↗
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  document
                                )
                              }
                              className="rounded-full border border-red-200 px-3 py-2 text-[10px] font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}