import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";

export const runtime = "nodejs";

const RED = rgb(0.569, 0.043, 0.039);
const BLACK = rgb(0.05, 0.05, 0.05);
const GREY = rgb(0.38, 0.38, 0.38);
const LIGHT_GREY = rgb(0.94, 0.94, 0.92);
const WHITE = rgb(1, 1, 1);

/*
 * -------------------------------------------------------
 * EMAIL CONFIGURATION
 * -------------------------------------------------------
 *
 * This follows the same configuration used by the
 * existing working KBX client-brief email route.
 */

const KBX_EMAIL =
  process.env.KBX_EMAIL ||
  "otooisaackb2003@gmail.com";

const DEFAULT_FROM_EMAIL =
  "KBX Spatial Atelier <onboarding@resend.dev>";

const resendApiKey =
  process.env.RESEND_API_KEY;

function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    DEFAULT_FROM_EMAIL
  );
}

if (!resendApiKey) {
  console.warn(
    "RESEND_API_KEY is not configured."
  );
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function safeText(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not provided";
  }

  return String(value);
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function sanitizeFileName(
  value: string
): string {
  return (
    String(value)
      .trim()
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      )
      .slice(
        0,
        80
      ) ||
    "Client"
  );
}

function formattedDate(
  date: string
): string {
  if (!date) {
    return "Not provided";
  }

  const parsed =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function getConsultationMethod(
  method: string
): string {
  if (
    method === "whatsapp"
  ) {
    return "WhatsApp Video Call / Phone Call";
  }

  return "Face-to-Face Consultation";
}

/* -------------------------------------------------------
   PDF HELPERS
------------------------------------------------------- */

type PDFContext = {
  pdf: PDFDocument;
  page: ReturnType<
    PDFDocument["addPage"]
  >;
  regular: Awaited<
    ReturnType<
      PDFDocument["embedFont"]
    >
  >;
  bold: Awaited<
    ReturnType<
      PDFDocument["embedFont"]
    >
  >;
  width: number;
  height: number;
  margin: number;
  y: number;
};

function drawFooter(
  ctx: PDFContext
) {
  ctx.page.drawLine({
    start: {
      x: ctx.margin,
      y: 35,
    },
    end: {
      x:
        ctx.width -
        ctx.margin,
      y: 35,
    },
    thickness: 0.6,
    color: LIGHT_GREY,
  });

  ctx.page.drawText(
    "KBX Spatial Atelier",
    {
      x: ctx.margin,
      y: 20,
      size: 7,
      font: ctx.bold,
      color: GREY,
    }
  );

  ctx.page.drawText(
    "CONSULTATION REQUEST",
    {
      x:
        ctx.width -
        ctx.margin -
        105,
      y: 20,
      size: 7,
      font: ctx.regular,
      color: GREY,
    }
  );
}

function addNewPage(
  ctx: PDFContext
): PDFContext {
  const page =
    ctx.pdf.addPage([
      ctx.width,
      ctx.height,
    ]);

  const newContext: PDFContext = {
    ...ctx,
    page,
    y:
      ctx.height -
      ctx.margin,
  };

  drawFooter(
    newContext
  );

  return newContext;
}

function ensureSpace(
  ctx: PDFContext,
  requiredHeight = 60
): PDFContext {
  if (
    ctx.y <
    ctx.margin +
      requiredHeight
  ) {
    return addNewPage(
      ctx
    );
  }

  return ctx;
}

function wrapText(
  text: string,
  font: PDFContext["regular"],
  fontSize: number,
  maxWidth: number
): string[] {
  const words =
    String(text)
      .split(/\s+/);

  const lines: string[] =
    [];

  let currentLine =
    "";

  for (
    const word of words
  ) {
    const testLine =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    const width =
      font.widthOfTextAtSize(
        testLine,
        fontSize
      );

    if (
      width <= maxWidth
    ) {
      currentLine =
        testLine;
    } else {
      if (
        currentLine
      ) {
        lines.push(
          currentLine
        );
      }

      currentLine =
        word;
    }
  }

  if (
    currentLine
  ) {
    lines.push(
      currentLine
    );
  }

  return lines;
}

function drawWrappedText(
  ctx: PDFContext,
  text: string,
  options: {
    x?: number;
    size?: number;
    font?: PDFContext["regular"];
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
    lineHeight?: number;
  } = {}
): PDFContext {
  let current =
    ctx;

  const size =
    options.size ||
    9;

  const font =
    options.font ||
    current.regular;

  const color =
    options.color ||
    BLACK;

  const maxWidth =
    options.maxWidth ||
    current.width -
      current.margin * 2;

  const lineHeight =
    options.lineHeight ||
    size + 5;

  const x =
    options.x ||
    current.margin;

  const lines =
    wrapText(
      text,
      font,
      size,
      maxWidth
    );

  for (
    const line of lines
  ) {
    current =
      ensureSpace(
        current,
        lineHeight +
          10
      );

    current.page.drawText(
      line,
      {
        x,
        y:
          current.y,
        size,
        font,
        color,
      }
    );

    current.y -=
      lineHeight;
  }

  return current;
}

function drawSectionTitle(
  ctx: PDFContext,
  number: string,
  title: string
): PDFContext {
  let current =
    ensureSpace(
      ctx,
      70
    );

  current.page.drawText(
    number,
    {
      x:
        current.margin,
      y:
        current.y,
      size: 8,
      font:
        current.bold,
      color: RED,
    }
  );

  current.page.drawText(
    title,
    {
      x:
        current.margin +
        25,
      y:
        current.y - 1,
      size: 13,
      font:
        current.bold,
      color: BLACK,
    }
  );

  current.y -=
    22;

  current.page.drawLine({
    start: {
      x:
        current.margin,
      y:
        current.y,
    },
    end: {
      x:
        current.width -
        current.margin,
      y:
        current.y,
    },
    thickness: 0.7,
    color: LIGHT_GREY,
  });

  current.y -=
    18;

  return current;
}

function drawField(
  ctx: PDFContext,
  label: string,
  value: string
): PDFContext {
  let current =
    ensureSpace(
      ctx,
      45
    );

  current.page.drawText(
    label,
    {
      x:
        current.margin,
      y:
        current.y,
      size: 8,
      font:
        current.bold,
      color: GREY,
    }
  );

  current.y -=
    14;

  current =
    drawWrappedText(
      current,
      value,
      {
        size: 10,
        font:
          current.regular,
        color:
          BLACK,
        maxWidth:
          current.width -
          current.margin *
            2,
        lineHeight: 14,
      }
    );

  current.y -=
    12;

  return current;
}

/* -------------------------------------------------------
   BUILD CONSULTATION PDF
------------------------------------------------------- */

async function buildConsultationPDF(
  data: {
    fullName: string;
    email: string;
    phone: string;
    areaCity: string;
    specificLocation: string;
    method: string;
    preferredDate: string;
    preferredTime: string;
    alternativeDate: string;
    alternativeTime: string;
    message: string;
    faceToFaceAccepted: boolean;
    confirmed: boolean;
  }
): Promise<Uint8Array> {
  const pdf =
    await PDFDocument.create();

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold
    );

  const width =
    595.28;

  const height =
    841.89;

  const margin =
    48;

  let ctx: PDFContext = {
    pdf,

    page:
      pdf.addPage([
        width,
        height,
      ]),

    regular,
    bold,

    width,
    height,

    margin,

    y:
      height -
      margin,
  };

  /*
   * -------------------------------------------------------
   * HEADER
   * -------------------------------------------------------
   */

  ctx.page.drawRectangle({
    x: 0,
    y:
      height -
      112,
    width,
    height: 112,
    color: RED,
  });

  ctx.page.drawText(
    "KBX",
    {
      x: margin,
      y:
        height -
        55,
      size: 27,
      font: bold,
      color: WHITE,
    }
  );

  ctx.page.drawText(
    "SPATIAL ATELIER",
    {
      x: margin,
      y:
        height -
        75,
      size: 9,
      font: bold,
      color: WHITE,
    }
  );

  ctx.page.drawText(
    "FREE CONSULTATION REQUEST",
    {
      x: margin,
      y:
        height -
        94,
      size: 8,
      font: regular,
      color: WHITE,
    }
  );

  ctx.y =
    height -
    145;

  ctx.page.drawText(
    "Consultation Request",
    {
      x: margin,
      y: ctx.y,
      size: 22,
      font: bold,
      color: BLACK,
    }
  );

  ctx.y -=
    18;

  ctx.page.drawText(
    "Client consultation details",
    {
      x: margin,
      y: ctx.y,
      size: 9,
      font: regular,
      color: GREY,
    }
  );

  ctx.y -=
    32;

  /*
   * -------------------------------------------------------
   * SECTION 01 — CLIENT DETAILS
   * -------------------------------------------------------
   */

  ctx =
    drawSectionTitle(
      ctx,
      "01",
      "Client Details"
    );

  ctx =
    drawField(
      ctx,
      "FULL NAME",
      safeText(
        data.fullName
      )
    );

  ctx =
    drawField(
      ctx,
      "EMAIL ADDRESS",
      safeText(
        data.email
      )
    );

  ctx =
    drawField(
      ctx,
      "PHONE / WHATSAPP",
      safeText(
        data.phone
      )
    );

  ctx =
    drawField(
      ctx,
      "AREA / CITY",
      safeText(
        data.areaCity
      )
    );

  ctx =
    drawField(
      ctx,
      "SPECIFIC LOCATION / ADDRESS",
      safeText(
        data.specificLocation
      )
    );

  ctx.y -=
    5;

  /*
   * -------------------------------------------------------
   * SECTION 02 — CONSULTATION METHOD
   * -------------------------------------------------------
   */

  ctx =
    drawSectionTitle(
      ctx,
      "02",
      "Consultation Method"
    );

  const consultationMethod =
    getConsultationMethod(
      data.method
    );

  ctx =
    drawField(
      ctx,
      "METHOD",
      consultationMethod
    );

  if (
    data.method ===
    "whatsapp"
  ) {
    ctx =
      drawField(
        ctx,
        "CONSULTATION TYPE",
        "Remote Consultation"
      );

    ctx =
      drawField(
        ctx,
        "ARRANGEMENT",
        "A KBX Project Manager will contact the client directly via WhatsApp video call or phone call using the contact details provided, based on the requested consultation date and time."
      );
  }

  if (
    data.method ===
    "face-to-face"
  ) {
    ctx =
      drawField(
        ctx,
        "CONSULTATION TYPE",
        "Face-to-Face Consultation"
      );

    ctx =
      drawField(
        ctx,
        "ARRANGEMENT",
        "A KBX Project Manager will meet the client at the location provided, based on the requested consultation date and time."
      );

    ctx =
      drawField(
        ctx,
        "TRANSPORTATION TERMS",
        "Transportation costs for the visit are the responsibility of the client and will be settled after the consultation."
      );

    ctx =
      drawField(
        ctx,
        "CLIENT ACKNOWLEDGMENT",
        data.faceToFaceAccepted
          ? "Client has read and understood the Face-to-Face Consultation terms."
          : "Not acknowledged"
      );
  }

  ctx.y -=
    5;

  /*
   * -------------------------------------------------------
   * SECTION 03 — SCHEDULE
   * -------------------------------------------------------
   */

  ctx =
    drawSectionTitle(
      ctx,
      "03",
      "Schedule"
    );

  ctx =
    drawField(
      ctx,
      "PREFERRED DATE",
      formattedDate(
        data.preferredDate
      )
    );

  ctx =
    drawField(
      ctx,
      "PREFERRED TIME",
      safeText(
        data.preferredTime
      )
    );

  ctx =
    drawField(
      ctx,
      "ALTERNATIVE DATE",
      data.alternativeDate
        ? formattedDate(
            data.alternativeDate
          )
        : "Not provided"
    );

  ctx =
    drawField(
      ctx,
      "ALTERNATIVE TIME",
      data.alternativeTime
        ? safeText(
            data.alternativeTime
          )
        : "Not provided"
    );

  ctx.y -=
    5;

  /*
   * -------------------------------------------------------
   * SECTION 04 — CLIENT MESSAGE
   * -------------------------------------------------------
   */

  ctx =
    drawSectionTitle(
      ctx,
      "04",
      "Client Message"
    );

  ctx =
    drawField(
      ctx,
      "MESSAGE",
      data.message
        ? safeText(
            data.message
          )
        : "No additional message provided."
    );

  ctx.y -=
    5;

  /*
   * -------------------------------------------------------
   * SECTION 05 — REQUEST STATUS
   * -------------------------------------------------------
   */

  ctx =
    drawSectionTitle(
      ctx,
      "05",
      "Request Status"
    );

  ctx =
    drawField(
      ctx,
      "REQUEST STATUS",
      "Consultation requested — awaiting KBX confirmation."
    );

  ctx =
    drawField(
      ctx,
      "CLIENT CONFIRMATION",
      data.confirmed
        ? "Client confirmed that the information provided is accurate."
        : "Not confirmed"
    );

  /*
   * -------------------------------------------------------
   * FINAL NOTICE
   * -------------------------------------------------------
   */

  ctx =
    ensureSpace(
      ctx,
      115
    );

  ctx.y -=
    10;

  ctx.page.drawRectangle({
    x: margin,
    y:
      ctx.y -
      70,
    width:
      width -
      margin * 2,
    height: 70,
    color:
      LIGHT_GREY,
  });

  ctx.page.drawText(
    "IMPORTANT",
    {
      x:
        margin +
        14,
      y:
        ctx.y -
        20,
      size: 8,
      font: bold,
      color: RED,
    }
  );

  drawWrappedText(
    ctx,
    "The selected date and time are a consultation request and are not confirmed until a KBX Project Manager contacts the client.",
    {
      x:
        margin +
        14,
      size: 8.5,
      font: regular,
      color: GREY,
      maxWidth:
        width -
        margin * 2 -
        28,
      lineHeight: 12,
    }
  );

  /*
   * -------------------------------------------------------
   * FOOTERS
   * -------------------------------------------------------
   */

  const pages =
    pdf.getPages();

  for (
    let index = 0;
    index <
    pages.length;
    index++
  ) {
    const currentPage =
      pages[index];

    currentPage.drawLine({
      start: {
        x: margin,
        y: 35,
      },
      end: {
        x:
          width -
          margin,
        y: 35,
      },
      thickness: 0.6,
      color:
        LIGHT_GREY,
    });

    currentPage.drawText(
      "KBX Spatial Atelier",
      {
        x: margin,
        y: 20,
        size: 7,
        font: bold,
        color: GREY,
      }
    );

    currentPage.drawText(
      `Page ${
        index + 1
      } of ${
        pages.length
      }`,
      {
        x:
          width -
          margin -
          60,
        y: 20,
        size: 7,
        font: regular,
        color: GREY,
      }
    );
  }

  return await pdf.save();
}

/* -------------------------------------------------------
   POST
------------------------------------------------------- */

export async function POST(
  request: Request
) {
  try {
    /*
     * -------------------------------------------------------
     * READ REQUEST
     * -------------------------------------------------------
     */

    const body =
      await request.json();

    const {
      fullName,
      email,
      phone,
      areaCity,
      specificLocation,
      method,
      preferredDate,
      preferredTime,
      alternativeDate,
      alternativeTime,
      message,
      faceToFaceAccepted,
      confirmed,
    } = body;

    /*
     * -------------------------------------------------------
     * VALIDATION
     * -------------------------------------------------------
     */

    if (
      !fullName ||
      !email ||
      !phone ||
      !areaCity ||
      !specificLocation ||
      !method ||
      !preferredDate ||
      !preferredTime
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please complete all required consultation fields.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      method !==
        "whatsapp" &&
      method !==
        "face-to-face"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select a valid consultation method.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      method ===
        "face-to-face" &&
      !faceToFaceAccepted
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please confirm that you have read and understood the Face-to-Face Consultation terms.",
        },
        {
          status: 400,
        }
      );
    }

    if (!confirmed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please confirm that the information provided is accurate.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * RESEND CHECK
     * -------------------------------------------------------
     */

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email service is not configured. RESEND_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * BUILD PDF
     * -------------------------------------------------------
     */

    const pdfBytes =
      await buildConsultationPDF(
        {
          fullName:
            safeText(
              fullName
            ),

          email:
            safeText(
              email
            ),

          phone:
            safeText(
              phone
            ),

          areaCity:
            safeText(
              areaCity
            ),

          specificLocation:
            safeText(
              specificLocation
            ),

          method:
            safeText(
              method
            ),

          preferredDate:
            safeText(
              preferredDate
            ),

          preferredTime:
            safeText(
              preferredTime
            ),

          alternativeDate:
            safeText(
              alternativeDate
            ),

          alternativeTime:
            safeText(
              alternativeTime
            ),

          message:
            safeText(
              message
            ),

          faceToFaceAccepted:
            Boolean(
              faceToFaceAccepted
            ),

          confirmed:
            Boolean(
              confirmed
            ),
        }
      );

    const pdfBase64 =
      Buffer.from(
        pdfBytes
      ).toString(
        "base64"
      );

    const filename =
      `KBX-Consultation-${sanitizeFileName(
        fullName
      )}.pdf`;

    /*
     * -------------------------------------------------------
     * EMAIL
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * The consultation notification is sent ONLY to KBX.
     *
     * This follows the existing working brief system:
     *
     * KBX_EMAIL
     *   ↓
     * receives the submission + PDF
     *
     * The client does not receive the internal
     * consultation PDF.
     */

    const resend =
      new Resend(
        resendApiKey
      );

    const emailSubject =
      `New Free Consultation Request — ${fullName}`;

    const consultationMethod =
      getConsultationMethod(
        method
      );

    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f5;padding:40px 20px;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;">

          <div style="background:#910B0A;padding:28px 32px;color:#ffffff;">
            <div style="font-size:22px;font-weight:700;letter-spacing:0.02em;">
              KBX
            </div>

            <div style="font-size:10px;font-weight:600;letter-spacing:0.2em;margin-top:4px;">
              SPATIAL ATELIER
            </div>
          </div>

          <div style="padding:32px;">

            <p style="font-size:11px;font-weight:700;letter-spacing:0.15em;color:#910B0A;margin:0 0 8px;">
              NEW CONSULTATION REQUEST
            </p>

            <h1 style="font-size:26px;margin:0 0 24px;color:#111111;">
              ${escapeHtml(
                fullName
              )}
            </h1>

            <p style="font-size:14px;line-height:1.7;color:#555555;">
              A new free consultation request has been submitted through the KBX Spatial Atelier website.
              The complete consultation summary is attached as a PDF.
            </p>

            <div style="margin-top:28px;border:1px solid #e5e5e5;">

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  CLIENT
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    fullName
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  EMAIL
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    email
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  PHONE / WHATSAPP
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    phone
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  LOCATION
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    areaCity
                  )}
                </div>

                <div style="margin-top:4px;font-size:14px;color:#555555;">
                  ${escapeHtml(
                    specificLocation
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  CONSULTATION METHOD
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    consultationMethod
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  PREFERRED DATE
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    formattedDate(
                      preferredDate
                    )
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  PREFERRED TIME
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    preferredTime
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  ALTERNATIVE
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${
                    alternativeDate
                      ? escapeHtml(
                          formattedDate(
                            alternativeDate
                          )
                        )
                      : "No alternative date provided"
                  }
                </div>

                <div style="margin-top:4px;font-size:14px;color:#555555;">
                  ${
                    alternativeTime
                      ? escapeHtml(
                          alternativeTime
                        )
                      : "No alternative time provided"
                  }
                </div>
              </div>

            </div>

            ${
              message
                ? `
                  <div style="margin-top:28px;">

                    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                      CLIENT MESSAGE
                    </div>

                    <div style="margin-top:8px;padding:18px;background:#f7f7f5;font-size:14px;line-height:1.7;color:#444444;">
                      ${escapeHtml(
                        message
                      )}
                    </div>

                  </div>
                `
                : ""
            }

            ${
              method ===
              "face-to-face"
                ? `
                  <div style="margin-top:24px;padding:18px;background:#f7f7f5;font-size:12px;line-height:1.6;color:#666666;">
                    <strong style="color:#910B0A;">
                      Face-to-Face acknowledgment:
                    </strong>
                    The client confirmed that they have read and understood the Face-to-Face Consultation terms.
                  </div>
                `
                : ""
            }

            <div style="margin-top:30px;padding:18px;background:#f7f7f5;font-size:12px;line-height:1.6;color:#666666;">
              <strong style="color:#910B0A;">
                Action required:
              </strong>
              Contact the client to review and confirm the requested consultation date, time and arrangements.
            </div>

            <p style="margin-top:32px;font-size:12px;line-height:1.6;color:#888888;">
              This email was generated automatically by the KBX Spatial Atelier consultation portal.
            </p>

          </div>
        </div>
      </div>
    `;

    const {
      data,
      error,
    } =
      await resend.emails.send(
        {
          from:
            getFromEmail(),

          to: [
            KBX_EMAIL,
          ],

          subject:
            emailSubject,

          html:
            emailHtml,

          attachments: [
            {
              filename,
              content:
                pdfBase64,
            },
          ],
        }
      );

    if (error) {
      console.error(
        "Resend consultation email error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The consultation request could not be emailed. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "Consultation email sent successfully:",
      data?.id
    );

    /*
     * -------------------------------------------------------
     * SUCCESS
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Your consultation request has been submitted successfully.",

        emailedToKBX:
          true,

        pdfGenerated:
          true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Consultation submission error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Something went wrong while submitting the consultation request.";

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}