import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

type AnyObject = Record<string, any>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const CLIENT_BRIEF_DOCUMENT_TYPES = [
  "kitchen_brief",
  "wardrobe_brief",
  "tv_unit_brief",
  "full_interior_brief",
  "client_brief",
];

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function normalizeBriefType(value: unknown): string {
  const type = cleanText(value).toLowerCase();

  if (
    type === "kitchen" ||
    type === "kitchen_brief" ||
    type === "kitchen brief"
  ) {
    return "kitchen_brief";
  }

  if (
    type === "wardrobe" ||
    type === "wardrobe_brief" ||
    type === "wardrobe brief" ||
    type === "closet" ||
    type === "closet_brief"
  ) {
    return "wardrobe_brief";
  }

  if (
    type === "tv" ||
    type === "tv_unit" ||
    type === "tv_unit_brief" ||
    type === "tv unit" ||
    type === "tv unit brief"
  ) {
    return "tv_unit_brief";
  }

  if (
    type === "full_interior" ||
    type === "full_interior_brief" ||
    type === "full interior" ||
    type === "full interior brief"
  ) {
    return "full_interior_brief";
  }

  if (type === "client_brief" || type === "client brief") {
    return "client_brief";
  }

  return type || "client_brief";
}

function getDocumentType(briefData: AnyObject): string {
  return normalizeBriefType(
    briefData.documentType ||
      briefData.document_type ||
      briefData.briefType ||
      briefData.brief_type ||
      briefData.type ||
      briefData.form?.documentType ||
      briefData.form?.document_type ||
      briefData.form?.briefType ||
      briefData.form?.brief_type ||
      briefData.form?.type
  );
}

function getClient(briefData: AnyObject): AnyObject {
  return (
    briefData.client ||
    briefData.form?.client ||
    briefData.customer ||
    briefData.form?.customer ||
    {}
  );
}

function getClientId(briefData: AnyObject): string {
  const client = getClient(briefData);

  return (
    cleanText(client.id) ||
    cleanText(client.clientId) ||
    cleanText(briefData.clientId) ||
    cleanText(briefData.client_id) ||
    cleanText(briefData.form?.clientId) ||
    cleanText(briefData.form?.client_id) ||
    ""
  );
}

function getClientName(briefData: AnyObject): string {
  const client = getClient(briefData);

  const directName =
    cleanText(client.name) ||
    cleanText(client.fullName) ||
    cleanText(client.full_name);

  if (directName) return directName;

  const firstName =
    cleanText(client.firstName) || cleanText(client.first_name);

  const lastName =
    cleanText(client.lastName) || cleanText(client.last_name);

  const combined = `${firstName} ${lastName}`.trim();

  if (combined) return combined;

  return (
    cleanText(briefData.clientName) ||
    cleanText(briefData.client_name) ||
    cleanText(briefData.name) ||
    "KBX Client"
  );
}

function getClientEmail(briefData: AnyObject): string {
  const client = getClient(briefData);

  return (
    cleanText(client.email) ||
    cleanText(client.emailAddress) ||
    cleanText(client.email_address) ||
    cleanText(briefData.clientEmail) ||
    cleanText(briefData.client_email) ||
    cleanText(briefData.email) ||
    cleanText(briefData.form?.email) ||
    ""
  );
}

function getProjectName(briefData: AnyObject): string {
  return (
    cleanText(briefData.projectName) ||
    cleanText(briefData.project_name) ||
    cleanText(briefData.form?.projectName) ||
    cleanText(briefData.form?.project_name) ||
    cleanText(briefData.project) ||
    "Interior Design Project"
  );
}

function getProjectLocation(briefData: AnyObject): string {
  return (
    cleanText(briefData.projectLocation) ||
    cleanText(briefData.project_location) ||
    cleanText(briefData.location) ||
    cleanText(briefData.form?.projectLocation) ||
    cleanText(briefData.form?.project_location) ||
    ""
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return JSON.stringify(item);
        }

        return String(item);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function flattenObject(
  value: AnyObject,
  prefix = ""
): Array<{ label: string; value: string }> {
  const result: Array<{ label: string; value: string }> = [];

  for (const [key, rawValue] of Object.entries(value)) {
    if (
      key === "client" ||
      key === "form" ||
      key === "files" ||
      key === "attachments"
    ) {
      continue;
    }

    const label = prefix ? `${prefix} / ${key}` : key;

    if (
      rawValue &&
      typeof rawValue === "object" &&
      !Array.isArray(rawValue)
    ) {
      result.push(...flattenObject(rawValue, label));
      continue;
    }

    const formatted = formatValue(rawValue);

    if (formatted) {
      result.push({
        label,
        value: formatted,
      });
    }
  }

  return result;
}

function sanitizeFileName(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

async function generatePdf(
  briefData: AnyObject,
  documentType: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      const clientName = getClientName(briefData);
      const clientEmail = getClientEmail(briefData);
      const projectName = getProjectName(briefData);
      const projectLocation = getProjectLocation(briefData);

      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("KBX SPATIAL ATELIER", {
          align: "center",
        });

      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .font("Helvetica")
        .text("Client Project Brief", {
          align: "center",
        });

      doc.moveDown(1.5);

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(
          documentType
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
        );

      doc.moveDown(1);

      doc.fontSize(10).font("Helvetica");

      const projectInformation = [
        ["Client", clientName],
        ["Email", clientEmail],
        ["Project", projectName],
        ["Location", projectLocation],
      ];

      for (const [label, value] of projectInformation) {
        if (!value) continue;

        doc
          .font("Helvetica-Bold")
          .text(`${label}: `, {
            continued: true,
          })
          .font("Helvetica")
          .text(value);

        doc.moveDown(0.3);
      }

      doc.moveDown(1);

      const entries = flattenObject(briefData);

      for (const entry of entries) {
        if (!entry.value) continue;

        if (doc.y > 720) {
          doc.addPage();
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(entry.label);

        doc
          .fontSize(9)
          .font("Helvetica")
          .text(entry.value, {
            width: 490,
          });

        doc.moveDown(0.7);
      }

      doc.moveDown(1);

      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Generated by KBX Spatial Atelier • ${new Date().toLocaleString(
            "en-GH"
          )}`,
          {
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function savePdfToSupabase(
  briefData: AnyObject,
  documentType: string,
  pdfBuffer: Buffer
) {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const clientId = getClientId(briefData);

  /*
   * IMPORTANT:
   * A brief must always have a client ID.
   *
   * Previously the route allowed client_id to become null.
   * That meant the brief could be successfully submitted but
   * project-stages could not associate it with the client.
   */
  if (!clientId) {
    throw new Error(
      "Client ID is missing from the submitted brief. Please reopen the client portal and submit the brief again."
    );
  }

  const clientName = getClientName(briefData);
  const clientEmail = getClientEmail(briefData);
  const projectName = getProjectName(briefData);

  const pdfFileName = `${sanitizeFileName(
    clientName || "client"
  )}-${sanitizeFileName(documentType)}-${Date.now()}.pdf`;

  const storagePath = `${sanitizeFileName(
    clientId
  )}/${pdfFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(
      `Failed to upload PDF to Supabase Storage: ${uploadError.message}`
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("client-documents")
    .getPublicUrl(storagePath);

  const documentUrl = publicUrlData?.publicUrl || null;

  const documentName =
    projectName && projectName !== "Interior Design Project"
      ? `${projectName} - ${documentType.replace(/_/g, " ")}`
      : `${clientName} - ${documentType.replace(/_/g, " ")}`;

  const { data: insertedDocument, error: insertError } = await supabase
    .from("client_documents")
    .insert({
      client_id: clientId,
      document_type: documentType,
      document_name: documentName,
      file_url: documentUrl,
      storage_path: storagePath,
      mime_type: "application/pdf",
      file_size: pdfBuffer.length,
      metadata: {
        client_name: clientName,
        client_email: clientEmail,
        project_name: projectName,
        source: "client_brief_submission",
      },
    })
    .select()
    .single();

  if (insertError) {
    /*
     * If the database insert fails after storage succeeds,
     * remove the uploaded file so we do not leave orphan files.
     */
    try {
      await supabase.storage
        .from("client-documents")
        .remove([storagePath]);
    } catch {
      // Ignore cleanup failure.
    }

    throw new Error(
      `Failed to save client document: ${insertError.message}`
    );
  }

  return {
    document: insertedDocument,
    documentUrl,
    storagePath,
    clientId,
  };
}

async function sendEmail(
  briefData: AnyObject,
  documentType: string,
  pdfBuffer: Buffer,
  documentName: string
) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const emailFrom =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    smtpUser ||
    "";

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.warn(
      "SMTP configuration is missing. Skipping email notification."
    );

    return {
      sent: false,
      skipped: true,
    };
  }

  const clientEmail = getClientEmail(briefData);
  const clientName = getClientName(briefData);
  const projectName = getProjectName(briefData);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: Number(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const recipients = new Set<string>();

  if (clientEmail) {
    recipients.add(clientEmail);
  }

  const adminEmail =
    process.env.ADMIN_EMAIL ||
    process.env.NOTIFICATION_EMAIL ||
    "";

  if (adminEmail) {
    recipients.add(adminEmail);
  }

  if (recipients.size === 0) {
    console.warn(
      "No email recipients were configured. Skipping email notification."
    );

    return {
      sent: false,
      skipped: true,
    };
  }

  await transporter.sendMail({
    from: emailFrom,
    to: Array.from(recipients).join(","),
    subject: `KBX Spatial Atelier — ${documentType.replace(
      /_/g,
      " "
    )} submitted`,
    text: `A new client brief has been submitted.

Client: ${clientName}
Email: ${clientEmail || "Not provided"}
Project: ${projectName}
Brief Type: ${documentType.replace(/_/g, " ")}

The submitted brief PDF is attached.`,
    attachments: [
      {
        filename: documentName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    sent: true,
    skipped: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const briefData = await request.json();

    if (!briefData || typeof briefData !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid brief data.",
        },
        { status: 400 }
      );
    }

    const documentType = getDocumentType(briefData);
    const clientId = getClientId(briefData);
    const clientName = getClientName(briefData);
    const clientEmail = getClientEmail(briefData);
    const projectName = getProjectName(briefData);

    if (!CLIENT_BRIEF_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported brief type: ${documentType}`,
        },
        { status: 400 }
      );
    }

    /*
     * IMPORTANT FIX:
     *
     * Do not silently accept a brief without a client ID.
     * Without this ID, the brief is stored but cannot be
     * connected to the client's project stages.
     */
    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The client ID is missing from the submitted brief. Please reopen the client portal and submit the brief again.",
        },
        { status: 400 }
      );
    }

    if (!clientEmail) {
      console.warn(
        "Brief submitted without a client email. Continuing because email is not required for database association."
      );
    }

    console.log("Submitting client brief:", {
      clientId,
      clientName,
      clientEmail,
      projectName,
      documentType,
    });

    const pdfBuffer = await generatePdf(
      briefData,
      documentType
    );

    const saved = await savePdfToSupabase(
      briefData,
      documentType,
      pdfBuffer
    );

    const documentName =
      saved.document?.document_name ||
      `${clientName} - ${documentType.replace(/_/g, " ")}.pdf`;

    let emailResult = {
      sent: false,
      skipped: true,
    };

    try {
      emailResult = await sendEmail(
        briefData,
        documentType,
        pdfBuffer,
        documentName
      );
    } catch (emailError) {
      /*
       * Email failure should not make the database submission
       * look unsuccessful. The document has already been saved.
       */
      console.error(
        "Email notification failed:",
        emailError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Client brief submitted successfully.",
      clientId,
      documentId: saved.document?.id || null,
      documentType,
      documentName,
      documentUrl: saved.documentUrl,
      storagePath: saved.storagePath,
      emailSent: emailResult.sent,
    });
  } catch (error) {
    console.error("SEND BRIEF ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while submitting the brief.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}