import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";

const RED = rgb(0.569, 0.043, 0.039);

const resendApiKey = process.env.RESEND_API_KEY;
const recipientEmail = process.env.RESEND_TO_EMAIL;
const fromEmail = process.env.RESEND_FROM_EMAIL;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not configured.");
}

if (!recipientEmail) {
  console.warn("RESEND_TO_EMAIL is not configured.");
}

if (!fromEmail) {
  console.warn("RESEND_FROM_EMAIL is not configured.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

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
          error: "Please complete all required consultation fields.",
        },
        { status: 400 }
      );
    }

    if (method !== "whatsapp" && method !== "face-to-face") {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a valid consultation method.",
        },
        { status: 400 }
      );
    }

    if (method === "face-to-face" && !faceToFaceAccepted) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please confirm that you have read and understood the Face-to-Face Consultation terms.",
        },
        { status: 400 }
      );
    }

    if (!confirmed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please confirm that the information provided is accurate.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       EMAIL CONFIGURATION
    ------------------------------------------------------- */

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email service is not configured. RESEND_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Consultation recipient email is not configured. RESEND_TO_EMAIL is missing.",
        },
        { status: 500 }
      );
    }

    if (!fromEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sender email is not configured. RESEND_FROM_EMAIL is missing.",
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------
       HELPERS
    ------------------------------------------------------- */

    const safeText = (value: unknown) => {
      if (value === null || value === undefined || value === "") {
        return "Not provided";
      }

      return String(value);
    };

    const consultationMethod =
      method === "whatsapp"
        ? "WhatsApp Video Call / Phone Call"
        : "Face-to-Face Consultation";

    const formattedDate = (date: string) => {
      if (!date) return "Not provided";

      const parsed = new Date(`${date}T00:00:00`);

      if (Number.isNaN(parsed.getTime())) {
        return date;
      }

      return parsed.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    /* -------------------------------------------------------
       CREATE PDF
    ------------------------------------------------------- */

    const pdfDoc = await PDFDocument.create();

    const regularFont = await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

    const boldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

    let page = pdfDoc.addPage([595.28, 841.89]);

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const margin = 48;
    const contentWidth = pageWidth - margin * 2;

    let y = pageHeight - margin;

    const black = rgb(0.05, 0.05, 0.05);
    const grey = rgb(0.38, 0.38, 0.38);
    const lightGrey = rgb(0.94, 0.94, 0.92);
    const white = rgb(1, 1, 1);

    const drawFooter = () => {
      page.drawLine({
        start: {
          x: margin,
          y: 35,
        },
        end: {
          x: pageWidth - margin,
          y: 35,
        },
        thickness: 0.6,
        color: lightGrey,
      });

      page.drawText("KBX Spatial Atelier", {
        x: margin,
        y: 20,
        size: 7,
        font: boldFont,
        color: grey,
      });

      page.drawText("CONSULTATION REQUEST", {
        x: pageWidth - margin - 105,
        y: 20,
        size: 7,
        font: regularFont,
        color: grey,
      });
    };

    const checkPage = (requiredHeight = 60) => {
      if (y < margin + requiredHeight) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = pageHeight - margin;
        drawFooter();
      }
    };

    const drawWrappedText = (
      text: string,
      x: number,
      startY: number,
      maxWidth: number,
      size: number,
      font = regularFont,
      color = black,
      lineHeight = size + 5
    ) => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine
          ? `${currentLine} ${word}`
          : word;

        const width = font.widthOfTextAtSize(
          testLine,
          size
        );

        if (width <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }

          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      let currentY = startY;

      for (const line of lines) {
        checkPage(lineHeight + 10);

        page.drawText(line, {
          x,
          y: currentY,
          size,
          font,
          color,
        });

        currentY -= lineHeight;
        y = currentY;
      }

      return currentY;
    };

    const drawSectionTitle = (
      number: string,
      title: string
    ) => {
      checkPage(70);

      page.drawText(number, {
        x: margin,
        y,
        size: 8,
        font: boldFont,
        color: RED,
      });

      page.drawText(title, {
        x: margin + 25,
        y: y - 1,
        size: 13,
        font: boldFont,
        color: black,
      });

      y -= 22;

      page.drawLine({
        start: {
          x: margin,
          y,
        },
        end: {
          x: pageWidth - margin,
          y,
        },
        thickness: 0.7,
        color: lightGrey,
      });

      y -= 18;
    };

    const drawField = (
      label: string,
      value: string
    ) => {
      checkPage(45);

      page.drawText(label, {
        x: margin,
        y,
        size: 8,
        font: boldFont,
        color: grey,
      });

      y -= 14;

      const newY = drawWrappedText(
        value,
        margin,
        y,
        contentWidth,
        10,
        regularFont,
        black,
        14
      );

      y = newY - 12;
    };

    /* -------------------------------------------------------
       PDF HEADER
    ------------------------------------------------------- */

    page.drawRectangle({
      x: 0,
      y: pageHeight - 112,
      width: pageWidth,
      height: 112,
      color: RED,
    });

    page.drawText("KBX", {
      x: margin,
      y: pageHeight - 55,
      size: 27,
      font: boldFont,
      color: white,
    });

    page.drawText("SPATIAL ATELIER", {
      x: margin,
      y: pageHeight - 75,
      size: 9,
      font: boldFont,
      color: white,
    });

    page.drawText("FREE CONSULTATION REQUEST", {
      x: margin,
      y: pageHeight - 94,
      size: 8,
      font: regularFont,
      color: white,
    });

    y = pageHeight - 145;

    page.drawText("Consultation Request", {
      x: margin,
      y,
      size: 22,
      font: boldFont,
      color: black,
    });

    y -= 18;

    page.drawText("Client consultation details", {
      x: margin,
      y,
      size: 9,
      font: regularFont,
      color: grey,
    });

    y -= 32;

    /* -------------------------------------------------------
       SECTION 01 — CLIENT DETAILS
    ------------------------------------------------------- */

    drawSectionTitle("01", "Client Details");

    drawField("FULL NAME", safeText(fullName));

    drawField("EMAIL ADDRESS", safeText(email));

    drawField("PHONE / WHATSAPP", safeText(phone));

    drawField("AREA / CITY", safeText(areaCity));

    drawField(
      "SPECIFIC LOCATION / ADDRESS",
      safeText(specificLocation)
    );

    y -= 5;

    /* -------------------------------------------------------
       SECTION 02 — CONSULTATION METHOD
    ------------------------------------------------------- */

    drawSectionTitle(
      "02",
      "Consultation Method"
    );

    drawField(
      "METHOD",
      consultationMethod
    );

    if (method === "whatsapp") {
      drawField(
        "CONSULTATION TYPE",
        "Remote Consultation"
      );

      drawField(
        "ARRANGEMENT",
        "A KBX Project Manager will contact the client directly via WhatsApp video call or phone call using the contact details provided."
      );
    }

    if (method === "face-to-face") {
      drawField(
        "CONSULTATION TYPE",
        "Face-to-Face Consultation"
      );

      drawField(
        "ARRANGEMENT",
        "A KBX Project Manager will meet the client at the location provided."
      );

      drawField(
        "TRANSPORTATION TERMS",
        "Transportation costs for the visit are the responsibility of the client and will be settled after the consultation."
      );

      drawField(
        "CLIENT ACKNOWLEDGMENT",
        faceToFaceAccepted
          ? "Client has read and understood the Face-to-Face Consultation terms."
          : "Not acknowledged"
      );
    }

    y -= 5;

    /* -------------------------------------------------------
       SECTION 03 — SCHEDULE
    ------------------------------------------------------- */

    drawSectionTitle("03", "Schedule");

    drawField(
      "PREFERRED DATE",
      formattedDate(preferredDate)
    );

    drawField(
      "PREFERRED TIME",
      safeText(preferredTime)
    );

    drawField(
      "ALTERNATIVE DATE",
      alternativeDate
        ? formattedDate(alternativeDate)
        : "Not provided"
    );

    drawField(
      "ALTERNATIVE TIME",
      alternativeTime
        ? safeText(alternativeTime)
        : "Not provided"
    );

    y -= 5;

    /* -------------------------------------------------------
       SECTION 04 — CLIENT MESSAGE
    ------------------------------------------------------- */

    drawSectionTitle(
      "04",
      "Client Message"
    );

    drawField(
      "MESSAGE",
      message
        ? safeText(message)
        : "No additional message provided."
    );

    y -= 5;

    /* -------------------------------------------------------
       SECTION 05 — REQUEST STATUS
    ------------------------------------------------------- */

    drawSectionTitle(
      "05",
      "Request Status"
    );

    drawField(
      "REQUEST STATUS",
      "Consultation requested — awaiting KBX confirmation."
    );

    drawField(
      "CLIENT CONFIRMATION",
      confirmed
        ? "Client confirmed that the information provided is accurate."
        : "Not confirmed"
    );

    /* -------------------------------------------------------
       FINAL NOTICE
    ------------------------------------------------------- */

    checkPage(110);

    y -= 10;

    page.drawRectangle({
      x: margin,
      y: y - 70,
      width: contentWidth,
      height: 70,
      color: lightGrey,
    });

    page.drawText("IMPORTANT", {
      x: margin + 14,
      y: y - 20,
      size: 8,
      font: boldFont,
      color: RED,
    });

    drawWrappedText(
      "The selected date and time are a consultation request and are not confirmed until a KBX Project Manager contacts the client.",
      margin + 14,
      y - 36,
      contentWidth - 28,
      8.5,
      regularFont,
      grey,
      12
    );

    drawFooter();

    /* -------------------------------------------------------
       SAVE PDF
    ------------------------------------------------------- */

    const pdfBytes = await pdfDoc.save();

    const pdfBase64 = Buffer.from(pdfBytes).toString(
      "base64"
    );

    /* -------------------------------------------------------
       SEND EMAIL
    ------------------------------------------------------- */

    const resend = new Resend(resendApiKey);

    const emailSubject =
      `New Free Consultation Request — ${fullName}`;

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
              ${escapeHtml(fullName)}
            </h1>

            <p style="font-size:14px;line-height:1.7;color:#555555;">
              A new free consultation request has been submitted through the KBX Spatial Atelier website.
              The consultation details are included below and the complete PDF summary is attached.
            </p>

            <div style="margin-top:28px;border:1px solid #e5e5e5;">

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  CONSULTATION METHOD
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(consultationMethod)}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  PREFERRED DATE
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(
                    formattedDate(preferredDate)
                  )}
                </div>
              </div>

              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  PREFERRED TIME
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(preferredTime)}
                </div>
              </div>

              <div style="padding:18px 20px;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#888888;">
                  CONTACT
                </div>

                <div style="margin-top:6px;font-size:14px;color:#111111;">
                  ${escapeHtml(phone)}
                </div>

                <div style="margin-top:4px;font-size:14px;color:#111111;">
                  ${escapeHtml(email)}
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
                      ${escapeHtml(message)}
                    </div>

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

    const { data, error } =
      await resend.emails.send({
        from: fromEmail,
        to: [recipientEmail],
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename:
              `KBX-Consultation-${sanitizeFileName(
                fullName
              )}.pdf`,
            content: pdfBase64,
          },
        ],
      });

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
        { status: 500 }
      );
    }

    console.log(
      "Consultation email sent successfully:",
      data?.id
    );

    return NextResponse.json({
      success: true,
      message:
        "Your consultation request has been submitted successfully.",
    });
  } catch (error) {
    console.error(
      "Consultation submission error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while submitting the consultation request.",
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   ESCAPE HTML
------------------------------------------------------- */

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------------------------------------------
   SANITIZE FILE NAME
------------------------------------------------------- */

function sanitizeFileName(value: string) {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}