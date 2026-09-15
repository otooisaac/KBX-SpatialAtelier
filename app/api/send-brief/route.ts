import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
  PDFFont,
  PDFImage,
} from "pdf-lib";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const RED = rgb(0.569, 0.043, 0.039);
const BLACK = rgb(0.04, 0.04, 0.04);
const DARK_GRAY = rgb(0.25, 0.25, 0.25);
const MID_GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.9, 0.9, 0.9);
const VERY_LIGHT = rgb(0.97, 0.97, 0.96);
const WHITE = rgb(1, 1, 1);

const KBX_EMAIL =
  process.env.KBX_EMAIL || "otooisaackb2003@gmail.com";

const DEFAULT_FROM_EMAIL =
  "KBX Spatial Atelier <onboarding@resend.dev>";

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "client-documents";

type BriefType =
  | "kitchen"
  | "wardrobe"
  | "tv_unit"
  | "full_interior";

type AnyObject = Record<string, any>;

type ReferenceImage = {
  file: File;
  name: string;
  type: string;
  bytes: Uint8Array;
};

type PDFContext = {
  pdf: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  width: number;
  height: number;
  margin: number;
  y: number;
};

function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    DEFAULT_FROM_EMAIL
  );
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function formatValue(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not provided";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Not provided";
    }

    return value
      .map((item) => formatValue(item))
      .join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "Not provided";
    }
  }

  return String(value);
}

function titleCaseKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function getBriefLabel(type: BriefType): string {
  switch (type) {
    case "kitchen":
      return "Kitchen & Storerooms";
    case "wardrobe":
      return "Wardrobes & Walk-in Closets";
    case "tv_unit":
      return "TV Unit";
    case "full_interior":
      return "Full Interior Project";
    default:
      return "Client Design Brief";
  }
}

function getBriefCode(type: BriefType): string {
  switch (type) {
    case "kitchen":
      return "01";
    case "wardrobe":
      return "02";
    case "tv_unit":
      return "03";
    case "full_interior":
      return "04";
    default:
      return "00";
  }
}

function safeFilename(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80) || "KBX_Client_Brief"
  );
}

function normalizeBriefType(
  value: unknown,
  briefData: AnyObject
): BriefType | null {
  const explicit = cleanText(value).toLowerCase();

  if (
    explicit === "kitchen" ||
    explicit === "wardrobe" ||
    explicit === "tv_unit" ||
    explicit === "full_interior"
  ) {
    return explicit;
  }

  /*
   * Fallback detection for older pages that may not yet
   * send briefType.
   */

  const form = briefData?.form || {};

  if (
    "tvBrandModel" in form ||
    "tvInstallation" in form ||
    "preferredTVSize" in form
  ) {
    return "tv_unit";
  }

  if (
    "wardrobeDoors" in form ||
    "hangingRequirements" in form ||
    "loftCabinets" in form ||
    "vanityDressingArea" in form
  ) {
    return "wardrobe";
  }

  if (
    "builtInCabinetry" in form ||
    "ownsAppliances" in form ||
    "sinkProvidedBy" in form ||
    "kitchenLayout" in form
  ) {
    return "kitchen";
  }

  if (
    "spaces" in form ||
    "lifestyle" in form ||
    "designStyles" in form
  ) {
    return "full_interior";
  }

  return null;
}

function getClient(
  briefData: AnyObject
): AnyObject {
  return (
    briefData?.client ||
    briefData?.form?.client ||
    {}
  );
}

function getForm(
  briefData: AnyObject
): AnyObject {
  return briefData?.form || {};
}

function getClientName(
  briefData: AnyObject
): string {
  const client = getClient(briefData);
  const form = getForm(briefData);

  return (
    cleanText(client.name) ||
    cleanText(form.clientName) ||
    "Client"
  );
}

function getClientEmail(
  briefData: AnyObject
): string {
  const client = getClient(briefData);
  const form = getForm(briefData);

  return (
    cleanText(client.email) ||
    cleanText(form.email)
  );
}

function getClientId(
  briefData: AnyObject
): string {
  const client = getClient(briefData);

  return (
    cleanText(client.id) ||
    cleanText(client.clientId) ||
    ""
  );
}

function getProjectName(
  briefData: AnyObject
): string {
  const form = getForm(briefData);

  return (
    cleanText(form.projectName) ||
    "Client Project"
  );
}

function addPage(ctx: PDFContext): PDFContext {
  const page = ctx.pdf.addPage([
    ctx.width,
    ctx.height,
  ]);

  drawPageHeader(
    page,
    ctx.regular,
    ctx.bold,
    ctx.width,
    ctx.height
  );

  return {
    ...ctx,
    page,
    y: ctx.height - 95,
  };
}

function ensureSpace(
  ctx: PDFContext,
  requiredHeight = 60
): PDFContext {
  if (ctx.y - requiredHeight < 50) {
    return addPage(ctx);
  }

  return ctx;
}

function drawPageHeader(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  width: number,
  height: number
) {
  page.drawLine({
    start: {
      x: 45,
      y: height - 38,
    },
    end: {
      x: width - 45,
      y: height - 38,
    },
    thickness: 1,
    color: LIGHT_GRAY,
  });

  page.drawText("KBX SPATIAL ATELIER", {
    x: 45,
    y: height - 30,
    size: 7,
    font: bold,
    color: DARK_GRAY,
  });

  page.drawText("CLIENT DESIGN BRIEF", {
    x: width - 45 - 90,
    y: height - 30,
    size: 7,
    font: regular,
    color: MID_GRAY,
  });
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);

    if (words.length === 1 && words[0] === "") {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of words) {
      const candidate = current
        ? `${current} ${word}`
        : word;

      const width = font.widthOfTextAtSize(
        candidate,
        fontSize
      );

      if (
        width <= maxWidth ||
        current.length === 0
      ) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

function drawWrappedText(
  ctx: PDFContext,
  text: string,
  options?: {
    size?: number;
    font?: PDFFont;
    color?: ReturnType<typeof rgb>;
    lineHeight?: number;
    maxWidth?: number;
  }
): PDFContext {
  let current = ensureSpace(ctx, 30);

  const size = options?.size || 9;
  const font = options?.font || current.regular;
  const color = options?.color || DARK_GRAY;
  const lineHeight =
    options?.lineHeight || size + 4;
  const maxWidth =
    options?.maxWidth ||
    current.width - current.margin * 2;

  const lines = wrapText(
    text,
    font,
    size,
    maxWidth
  );

  for (const line of lines) {
    current = ensureSpace(
      current,
      lineHeight + 8
    );

    if (line) {
      current.page.drawText(line, {
        x: current.margin,
        y: current.y,
        size,
        font,
        color,
      });
    }

    current.y -= lineHeight;
  }

  return current;
}

function drawSectionTitle(
  ctx: PDFContext,
  number: string,
  title: string
): PDFContext {
  let current = ensureSpace(ctx, 60);

  current.page.drawRectangle({
    x: current.margin,
    y: current.y - 5,
    width: 25,
    height: 25,
    color: RED,
  });

  current.page.drawText(number, {
    x: current.margin + 7,
    y: current.y + 2,
    size: 8,
    font: current.bold,
    color: WHITE,
  });

  current.page.drawText(
    title.toUpperCase(),
    {
      x: current.margin + 35,
      y: current.y + 2,
      size: 10,
      font: current.bold,
      color: BLACK,
    }
  );

  current.y -= 38;

  current.page.drawLine({
    start: {
      x: current.margin,
      y: current.y,
    },
    end: {
      x: current.width - current.margin,
      y: current.y,
    },
    thickness: 0.6,
    color: LIGHT_GRAY,
  });

  current.y -= 18;

  return current;
}

function drawField(
  ctx: PDFContext,
  label: string,
  value: unknown
): PDFContext {
  let current = ensureSpace(ctx, 50);

  const text = formatValue(value);

  current.page.drawText(label, {
    x: current.margin,
    y: current.y,
    size: 7.5,
    font: current.bold,
    color: MID_GRAY,
  });

  current.y -= 13;

  const lines = wrapText(
    text,
    current.regular,
    9,
    current.width - current.margin * 2
  );

  for (const line of lines) {
    current = ensureSpace(
      current,
      16
    );

    current.page.drawText(line, {
      x: current.margin,
      y: current.y,
      size: 9,
      font: current.regular,
      color: DARK_GRAY,
    });

    current.y -= 13;
  }

  current.y -= 7;

  return current;
}

function drawFieldGrid(
  ctx: PDFContext,
  fields: Array<[string, unknown]>
): PDFContext {
  let current = ctx;

  for (let i = 0; i < fields.length; i += 2) {
    current = ensureSpace(current, 50);

    const left = fields[i];
    const right = fields[i + 1];

    const gap = 18;
    const columnWidth =
      (current.width -
        current.margin * 2 -
        gap) /
      2;

    const startY = current.y;

    current.page.drawText(left[0], {
      x: current.margin,
      y: startY,
      size: 7.5,
      font: current.bold,
      color: MID_GRAY,
    });

    const leftLines = wrapText(
      formatValue(left[1]),
      current.regular,
      9,
      columnWidth
    );

    for (let lineIndex = 0; lineIndex < leftLines.length; lineIndex++) {
      current.page.drawText(
        leftLines[lineIndex],
        {
          x: current.margin,
          y:
            startY -
            13 -
            lineIndex * 13,
          size: 9,
          font: current.regular,
          color: DARK_GRAY,
        }
      );
    }

    if (right) {
      const rightX =
        current.margin +
        columnWidth +
        gap;

      current.page.drawText(
        right[0],
        {
          x: rightX,
          y: startY,
          size: 7.5,
          font: current.bold,
          color: MID_GRAY,
        }
      );

      const rightLines = wrapText(
        formatValue(right[1]),
        current.regular,
        9,
        columnWidth
      );

      for (
        let lineIndex = 0;
        lineIndex < rightLines.length;
        lineIndex++
      ) {
        current.page.drawText(
          rightLines[lineIndex],
          {
            x: rightX,
            y:
              startY -
              13 -
              lineIndex * 13,
            size: 9,
            font: current.regular,
            color: DARK_GRAY,
          }
        );
      }
    }

    const maxLines = Math.max(
      leftLines.length,
      right
        ? wrapText(
            formatValue(right[1]),
            current.regular,
            9,
            columnWidth
          ).length
        : 1
    );

    current.y =
      startY -
      13 -
      maxLines * 13 -
      12;
  }

  return current;
}

function drawObjectFields(
  ctx: PDFContext,
  object: AnyObject,
  options?: {
    exclude?: string[];
    maxDepth?: number;
  }
): PDFContext {
  let current = ctx;

  const excluded = new Set(
    options?.exclude || []
  );

  const maxDepth =
    options?.maxDepth ?? 2;

  function render(
    valueObject: AnyObject,
    depth: number
  ) {
    const entries = Object.entries(
      valueObject
    ).filter(
      ([key, value]) =>
        !excluded.has(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
    );

    for (const [key, value] of entries) {
      if (
        depth < maxDepth &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        current = drawSubheading(
          current,
          titleCaseKey(key)
        );

        render(value, depth + 1);
        continue;
      }

      current = drawField(
        current,
        titleCaseKey(key),
        value
      );
    }
  }

  render(object, 0);

  return current;
}

function drawSubheading(
  ctx: PDFContext,
  title: string
): PDFContext {
  let current = ensureSpace(ctx, 35);

  current.page.drawText(title, {
    x: current.margin,
    y: current.y,
    size: 8.5,
    font: current.bold,
    color: RED,
  });

  current.y -= 18;

  return current;
}

function getSections(
  type: BriefType,
  form: AnyObject
): Array<{
  title: string;
  fields?: Array<[string, unknown]>;
  object?: AnyObject;
  exclude?: string[];
}> {
  if (type === "tv_unit") {
    return [
      {
        title: "Project Information",
        fields: [
          ["Project Name", form.projectName],
          ["Client Name", form.clientName],
          [
            "Project Location",
            form.projectLocation,
          ],
          ["Date", form.date],
          [
            "Project Type",
            form.projectType,
          ],
          [
            "Other Project Type",
            form.projectTypeOther,
          ],
        ],
      },
      {
        title: "General Design Requirements",
        fields: [
          [
            "Design Goal",
            form.designGoal,
          ],
          [
            "Preferred Design Style",
            form.designStyles,
          ],
          [
            "Other Design Style",
            form.designStyleOther,
          ],
          [
            "Reference Images Available",
            form.referenceImagesAvailable,
          ],
        ],
      },
      {
        title: "TV Requirements",
        fields: [
          ["Existing TV", form.hasTV],
          [
            "TV Brand / Model",
            form.tvBrandModel,
          ],
          ["TV Width", form.tvWidth],
          ["TV Height", form.tvHeight],
          ["TV Depth", form.tvDepth],
          [
            "Preferred TV Size",
            form.preferredTVSize,
          ],
          [
            "TV Installation",
            form.tvInstallation,
          ],
        ],
      },
      {
        title: "Storage Requirements",
        fields: [
          [
            "Storage Required",
            form.storageRequired,
          ],
          [
            "Storage Types",
            form.storageTypes,
          ],
          [
            "Other Storage",
            form.storageOther,
          ],
          [
            "Storage Items",
            form.storageItems,
          ],
          [
            "Other Storage Items",
            form.storageItemsOther,
          ],
        ],
      },
      {
        title: "Electronics & Cable Management",
        fields: [
          ["Equipment", form.equipment],
          [
            "Other Equipment",
            form.equipmentOther,
          ],
          [
            "Cable Management",
            form.cableManagement,
          ],
          [
            "Equipment Visibility",
            form.equipmentVisibility,
          ],
          [
            "Special Electronics Requirements",
            form.electronicsSpecialRequirements,
          ],
        ],
      },
      {
        title: "Design Features & Finishes",
        fields: [
          [
            "Design Features",
            form.designFeatures,
          ],
          [
            "Other Design Feature",
            form.designFeatureOther,
          ],
          [
            "Wall Cladding Required",
            form.wallCladdingRequired,
          ],
          [
            "Wall Cladding Material",
            form.wallCladdingMaterial,
          ],
          [
            "Main Finish",
            form.mainFinish,
          ],
          [
            "Other Main Finish",
            form.mainFinishOther,
          ],
        ],
      },
      {
        title: "Client Do Not Want",
        fields: [
          [
            "Do Not Want",
            form.doNotWant,
          ],
          [
            "Other Do Not Want",
            form.doNotWantOther,
          ],
        ],
      },
      {
        title: "Client Confirmation",
        fields: [
          [
            "Information Checked",
            form.informationChecked,
          ],
          [
            "Client Requirements Confirmed",
            form.clientRequirementsConfirmed,
          ],
          [
            "Ready For Design",
            form.readyForDesign,
          ],
          [
            "Client Signature",
            form.clientSignature,
          ],
        ],
      },
    ];
  }

  if (type === "wardrobe") {
    return [
      {
        title: "Project Information",
        fields: [
          ["Project Name", form.projectName],
          ["Client Name", form.clientName],
          [
            "Project Location",
            form.projectLocation,
          ],
          ["Date", form.date],
          [
            "Person Handling Client",
            form.personHandlingClient,
          ],
          [
            "Project Type",
            form.projectType,
          ],
          [
            "Other Project Type",
            form.projectTypeOther,
          ],
        ],
      },
      {
        title: "General Design Requirements",
        fields: [
          [
            "Design Goal",
            form.designGoal,
          ],
          [
            "Preferred Design Style",
            form.designStyles,
          ],
          [
            "Other Design Style",
            form.designStyleOther,
          ],
          [
            "Reference Images Available",
            form.referenceImagesAvailable,
          ],
        ],
      },
      {
        title: "Client Preferences",
        fields: [
          [
            "Wardrobe Doors",
            form.wardrobeDoors,
          ],
          [
            "Door Finish",
            form.doorFinish,
          ],
          ["Glass Type", form.glassType],
          ["Handles", form.handles],
          [
            "Preferred Colour / Finish",
            form.preferredColourFinish,
          ],
        ],
      },
      {
        title: "Storage Requirements",
        fields: [
          [
            "Storage Needs",
            form.storageNeeds,
          ],
          [
            "Other Storage",
            form.storageOther,
          ],
          [
            "Hanging Requirements",
            form.hangingRequirements,
          ],
          [
            "Other Hanging Requirement",
            form.hangingOther,
          ],
          [
            "Drawers Required",
            form.drawersRequired,
          ],
          [
            "Open Shelves Required",
            form.openShelvesRequired,
          ],
        ],
      },
      {
        title: "Ceiling, Loft & Access",
        fields: [
          [
            "Reach Ceiling",
            form.reachCeiling,
          ],
          [
            "Loft Cabinets",
            form.loftCabinets,
          ],
          [
            "Loft Access",
            form.loftAccess,
          ],
          [
            "Other Loft Access",
            form.loftAccessOther,
          ],
        ],
      },
      {
        title: "Lighting & Display",
        fields: [
          [
            "Internal LED Lighting",
            form.internalLedLighting,
          ],
          [
            "Sensor Lighting",
            form.sensorLighting,
          ],
          [
            "Glass Display Sections",
            form.glassDisplaySections,
          ],
          [
            "Shoe Display",
            form.shoeDisplay,
          ],
        ],
      },
      {
        title: "Special Requirements",
        fields: [
          [
            "Special Requirements",
            form.specialRequirements,
          ],
          [
            "Other Special Requirement",
            form.specialRequirementOther,
          ],
          [
            "Central Island",
            form.centralIsland,
          ],
          ["Seating", form.seating],
          [
            "Vanity / Dressing Area",
            form.vanityDressingArea,
          ],
        ],
      },
      {
        title: "Client Do Not Want",
        fields: [
          [
            "Do Not Want",
            form.doNotWant,
          ],
          [
            "Other Do Not Want",
            form.doNotWantOther,
          ],
        ],
      },
      {
        title: "Client Confirmation",
        fields: [
          [
            "Information Checked",
            form.informationChecked,
          ],
          [
            "Ready For Design",
            form.readyForDesign,
          ],
          [
            "Client Signature",
            form.clientSignature,
          ],
        ],
      },
    ];
  }

  if (type === "kitchen") {
    /*
     * Kitchen has a more detailed form and its exact
     * field structure may evolve. The important point
     * is that the PDF preserves every submitted field.
     */
    return [
      {
        title: "Project Information",
        fields: [
          ["Project Name", form.projectName],
          ["Client Name", form.clientName],
          [
            "Project Location",
            form.projectLocation,
          ],
          ["Room / Area", form.roomArea],
          ["Designer", form.designer],
          [
            "Person Responsible for Client Communication",
            form.communicationPerson,
          ],
        ],
      },
      {
        title: "Client Requirements",
        fields: [
          [
            "Design Goal",
            form.designGoal,
          ],
          [
            "Main Requirements",
            form.mainRequirements,
          ],
          [
            "Preferred Design Style",
            form.designStyles,
          ],
          [
            "Other Design Style",
            form.designStyleOther,
          ],
          [
            "Reference Images Available",
            form.referenceImagesAvailable,
          ],
        ],
      },
      {
        title: "Kitchen Requirements",
        fields: [
          [
            "Built-in Cabinetry",
            form.builtInCabinetry,
          ],
          [
            "Owns Appliances",
            form.ownsAppliances,
          ],
          [
            "Sink Provided By",
            form.sinkProvidedBy,
          ],
          [
            "Kitchen Layout",
            form.kitchenLayout,
          ],
        ],
      },
      {
        title: "Additional Kitchen Information",
        object: form,
        exclude: [
          "projectName",
          "clientName",
          "projectLocation",
          "roomArea",
          "designer",
          "communicationPerson",
          "designGoal",
          "mainRequirements",
          "designStyles",
          "designStyleOther",
          "referenceImagesAvailable",
          "completed",
          "submitted",
          "completedAt",
          "referenceImages",
          "client",
        ],
      },
    ];
  }

  /*
   * FULL INTERIOR
   *
   * The Full Interior form has many structured
   * fields. We intentionally render the complete
   * submitted object so no client answer is lost
   * if new fields are added later.
   */
  return [
    {
      title: "Full Interior Project Information",
      fields: [
        ["Project Name", form.projectName],
        [
          "Project Location",
          form.projectLocation,
        ],
        [
          "Project Type",
          form.projectType,
        ],
        [
          "Project Status",
          form.projectStatus,
        ],
        ["Client Name", form.clientName],
      ],
    },
    {
      title: "Client Requirements",
      object: form,
      exclude: [
        "projectName",
        "projectLocation",
        "projectType",
        "projectStatus",
        "clientName",
        "client",
        "completed",
        "submitted",
        "completedAt",
        "referenceImages",
        "currentSection",
      ],
    },
  ];
}

function drawCoverPage(
  ctx: PDFContext,
  type: BriefType,
  briefData: AnyObject
): PDFContext {
  let current = ctx;

  const projectName =
    getProjectName(briefData);

  const clientName =
    getClientName(briefData);

  const location =
    cleanText(
      getForm(briefData).projectLocation
    ) || "Not provided";

  /*
   * Logo
   *
   * pdf-lib cannot directly embed SVG, so the
   * PDF version should be placed at:
   *
   * public/kbx-logo-pdf.png
   */
  try {
    // handled asynchronously before this function
  } catch {
    // ignore logo failure
  }

  current.page.drawText(
    "KBX SPATIAL ATELIER",
    {
      x: current.margin,
      y: current.height - 145,
      size: 10,
      font: current.bold,
      color: RED,
    }
  );

  current.page.drawText(
    getBriefLabel(type),
    {
      x: current.margin,
      y: current.height - 205,
      size: 27,
      font: current.bold,
      color: BLACK,
    }
  );

  current.page.drawText(
    "CLIENT DESIGN BRIEF",
    {
      x: current.margin,
      y: current.height - 232,
      size: 8,
      font: current.regular,
      color: MID_GRAY,
    }
  );

  current.page.drawLine({
    start: {
      x: current.margin,
      y: current.height - 265,
    },
    end: {
      x: current.width - current.margin,
      y: current.height - 265,
    },
    thickness: 1,
    color: LIGHT_GRAY,
  });

  let infoY =
    current.height - 315;

  const coverFields = [
    ["Project", projectName],
    ["Client", clientName],
    ["Location", location],
    [
      "Document Type",
      getBriefLabel(type),
    ],
  ];

  for (const [label, value] of coverFields) {
    current.page.drawText(label, {
      x: current.margin,
      y: infoY,
      size: 7,
      font: current.bold,
      color: MID_GRAY,
    });

    current.page.drawText(value, {
      x: current.margin + 95,
      y: infoY,
      size: 10,
      font: current.regular,
      color: DARK_GRAY,
    });

    infoY -= 30;
  }

  current.page.drawRectangle({
    x: current.margin,
    y: 80,
    width:
      current.width -
      current.margin * 2,
    height: 52,
    color: VERY_LIGHT,
  });

  current.page.drawText(
    "Prepared by KBX Spatial Atelier",
    {
      x: current.margin + 18,
      y: 111,
      size: 8,
      font: current.bold,
      color: DARK_GRAY,
    }
  );

  current.page.drawText(
    "Interior Design • Interior Architecture • Bespoke Space",
    {
      x: current.margin + 18,
      y: 94,
      size: 7,
      font: current.regular,
      color: MID_GRAY,
    }
  );

  return current;
}

async function loadPdfLogo(
  pdf: PDFDocument
): Promise<PDFImage | null> {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "kbx-logo-pdf.png"
    );

    const logoBytes =
      await fs.readFile(logoPath);

    return await pdf.embedPng(logoBytes);
  } catch {
    return null;
  }
}

function drawLogoOnCover(
  page: PDFPage,
  logo: PDFImage | null,
  width: number,
  height: number
) {
  if (!logo) {
    return;
  }

  const maxWidth = 280;
  const maxHeight = 90;

  const scale = Math.min(
    maxWidth / logo.width,
    maxHeight / logo.height
  );

  const logoWidth =
    logo.width * scale;

  const logoHeight =
    logo.height * scale;

  page.drawImage(logo, {
    x: 45,
    y:
      height -
      55 -
      logoHeight,
    width: logoWidth,
    height: logoHeight,
  });
}

async function buildPDF(
  type: BriefType,
  briefData: AnyObject
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

  const width = 595.28;
  const height = 841.89;
  const margin = 45;

  let ctx: PDFContext = {
    pdf,
    page: pdf.addPage([
      width,
      height,
    ]),
    regular,
    bold,
    width,
    height,
    margin,
    y: height - 95,
  };

  const logo =
    await loadPdfLogo(pdf);

  drawLogoOnCover(
    ctx.page,
    logo,
    width,
    height
  );

  ctx = drawCoverPage(
    ctx,
    type,
    briefData
  );

  /*
   * Start detailed content on a fresh page.
   */
  ctx = addPage(ctx);

  const sections =
    getSections(
      type,
      getForm(briefData)
    );

  let sectionNumber = 1;

  for (const section of sections) {
    ctx = drawSectionTitle(
      ctx,
      String(sectionNumber).padStart(2, "0"),
      section.title
    );

    if (
      section.fields &&
      section.fields.length > 0
    ) {
      ctx = drawFieldGrid(
        ctx,
        section.fields
      );
    }

    if (section.object) {
      ctx = drawObjectFields(
        ctx,
        section.object,
        {
          exclude:
            section.exclude,
          maxDepth: 2,
        }
      );
    }

    ctx.y -= 10;

    sectionNumber++;
  }

  /*
   * Metadata / submission details.
   */
  ctx = drawSectionTitle(
    ctx,
    "99",
    "Submission Information"
  );

  ctx = drawFieldGrid(ctx, [
    [
      "Brief Type",
      getBriefLabel(type),
    ],
    [
      "Submission Date",
      cleanText(
        briefData.completedAt
      ) ||
        new Date().toISOString(),
    ],
    [
      "Client ID",
      getClientId(briefData) ||
        "Not provided",
    ],
    [
      "Submitted",
      briefData.submitted !== false,
    ],
  ]);

  /*
   * Footer on every page.
   */
  const pages = pdf.getPages();

  for (
    let pageIndex = 0;
    pageIndex < pages.length;
    pageIndex++
  ) {
    const page = pages[pageIndex];

    page.drawLine({
      start: {
        x: 45,
        y: 35,
      },
      end: {
        x: width - 45,
        y: 35,
      },
      thickness: 0.6,
      color: LIGHT_GRAY,
    });

    page.drawText(
      "KBX Spatial Atelier",
      {
        x: 45,
        y: 22,
        size: 7,
        font: bold,
        color: MID_GRAY,
      }
    );

    page.drawText(
      `Page ${pageIndex + 1} of ${pages.length}`,
      {
        x: width - 95,
        y: 22,
        size: 7,
        font: regular,
        color: MID_GRAY,
      }
    );
  }

  return await pdf.save();
}

async function appendReferenceImages(
  pdfBytes: Uint8Array,
  images: ReferenceImage[]
): Promise<Uint8Array> {
  if (images.length === 0) {
    return pdfBytes;
  }

  const pdf =
    await PDFDocument.load(pdfBytes);

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold
    );

  const width = 595.28;
  const height = 841.89;
  const margin = 45;

  let page =
    pdf.addPage([
      width,
      height,
    ]);

  let y =
    height - 65;

  page.drawText(
    "REFERENCE IMAGES",
    {
      x: margin,
      y,
      size: 14,
      font: bold,
      color: BLACK,
    }
  );

  y -= 22;

  page.drawText(
    "Client-provided visual references",
    {
      x: margin,
      y,
      size: 8,
      font: regular,
      color: MID_GRAY,
    }
  );

  y -= 30;

  let imageCount = 0;

  for (
    const reference of images.slice(0, 12)
  ) {
    let embedded:
      | PDFImage
      | null = null;

    try {
      const type =
        reference.type.toLowerCase();

      if (
        type === "image/png" ||
        reference.name
          .toLowerCase()
          .endsWith(".png")
      ) {
        embedded =
          await pdf.embedPng(
            reference.bytes
          );
      } else if (
        type === "image/jpeg" ||
        type === "image/jpg" ||
        reference.name
          .toLowerCase()
          .endsWith(".jpg") ||
        reference.name
          .toLowerCase()
          .endsWith(".jpeg")
      ) {
        embedded =
          await pdf.embedJpg(
            reference.bytes
          );
      }
    } catch {
      embedded = null;
    }

    if (!embedded) {
      continue;
    }

    const maxWidth =
      width - margin * 2;

    const maxHeight = 330;

    const scale = Math.min(
      maxWidth / embedded.width,
      maxHeight / embedded.height,
      1
    );

    const displayWidth =
      embedded.width * scale;

    const displayHeight =
      embedded.height * scale;

    if (
      y -
        displayHeight -
        45 <
      45
    ) {
      page = pdf.addPage([
        width,
        height,
      ]);

      y = height - 65;

      page.drawText(
        "REFERENCE IMAGES",
        {
          x: margin,
          y,
          size: 14,
          font: bold,
          color: BLACK,
        }
      );

      y -= 25;
    }

    const x =
      margin +
      (maxWidth -
        displayWidth) /
        2;

    page.drawImage(embedded, {
      x,
      y:
        y -
        displayHeight,
      width: displayWidth,
      height: displayHeight,
    });

    y -=
      displayHeight +
      14;

    page.drawText(
      `${imageCount + 1}. ${reference.name}`,
      {
        x: margin,
        y,
        size: 7.5,
        font: regular,
        color: MID_GRAY,
      }
    );

    y -= 25;

    imageCount++;
  }

  const pages = pdf.getPages();

  for (
    let pageIndex = 0;
    pageIndex < pages.length;
    pageIndex++
  ) {
    const currentPage =
      pages[pageIndex];

    currentPage.drawLine({
      start: {
        x: 45,
        y: 35,
      },
      end: {
        x: width - 45,
        y: 35,
      },
      thickness: 0.6,
      color: LIGHT_GRAY,
    });

    currentPage.drawText(
      "KBX Spatial Atelier",
      {
        x: 45,
        y: 22,
        size: 7,
        font: bold,
        color: MID_GRAY,
      }
    );

    currentPage.drawText(
      `Page ${pageIndex + 1} of ${pages.length}`,
      {
        x: width - 95,
        y: 22,
        size: 7,
        font: regular,
        color: MID_GRAY,
      }
    );
  }

  return await pdf.save();
}

async function readReferenceImages(
  formData: FormData
): Promise<ReferenceImage[]> {
  const entries =
    formData.getAll(
      "referenceImages"
    );

  const images: ReferenceImage[] = [];

  for (const entry of entries) {
    if (!(entry instanceof File)) {
      continue;
    }

    if (!entry.type.startsWith("image/")) {
      continue;
    }

    /*
     * Protect the API from unnecessarily huge uploads.
     */
    if (
      entry.size >
      5 * 1024 * 1024
    ) {
      continue;
    }

    const bytes =
      new Uint8Array(
        await entry.arrayBuffer()
      );

    images.push({
      file: entry,
      name:
        entry.name ||
        `reference-${images.length + 1}`,
      type: entry.type,
      bytes,
    });
  }

  return images;
}

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured."
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function savePdfToSupabase(
  pdfBytes: Uint8Array,
  filename: string,
  briefData: AnyObject,
  type: BriefType
) {
  const supabase =
    getSupabase();

  const clientId =
    getClientId(briefData);

  const clientEmail =
    getClientEmail(briefData);

  const clientFolder =
    safeFilename(
      clientId ||
        clientEmail ||
        getClientName(briefData)
    );

  const timestamp =
    Date.now();

  const storagePath =
    `briefs/${clientFolder}/${type}/${timestamp}_${filename}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(
      storagePath,
      Buffer.from(pdfBytes),
      {
        contentType:
          "application/pdf",
        upsert: true,
      }
    );

  if (uploadError) {
    throw new Error(
      `Supabase Storage upload failed: ${uploadError.message}`
    );
  }

  const {
    data: publicUrlData,
  } =
    supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(
        storagePath
      );

  const pdfUrl =
    publicUrlData?.publicUrl || "";

  if (!pdfUrl) {
    throw new Error(
      "The PDF was uploaded but Supabase did not return a public URL."
    );
  }

  /*
   * Create client_documents record.
   *
   * The route attempts the most useful document
   * metadata fields used by the portal.
   */
  const documentPayload = {
    client_id:
      clientId || null,
    title:
      `${getBriefLabel(type)} — ${getProjectName(
        briefData
      )}`,
    document_type:
      "client_brief",
    file_url: pdfUrl,
    file_path: storagePath,
    file_name: filename,
    mime_type:
      "application/pdf",
    created_at:
      new Date().toISOString(),
  };

  const {
    data: documentRecord,
    error: documentError,
  } = await supabase
    .from("client_documents")
    .insert(
      documentPayload
    )
    .select()
    .single();

  if (documentError) {
    throw new Error(
      `Client document record creation failed: ${documentError.message}`
    );
  }

  return {
    pdfUrl,
    pdfPath: storagePath,
    documentRecord,
  };
}

async function sendEmail(
  resend: Resend,
  options: {
    to: string;
    subject: string;
    heading: string;
    message: string;
    filename: string;
    pdfBytes: Uint8Array;
  }
) {
  if (!options.to) {
    throw new Error(
      "No recipient email address was provided."
    );
  }

  const result =
    await resend.emails.send({
      from: getFromEmail(),
      to: [options.to],
      subject:
        options.subject,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f5; padding:32px;">
          <div style="max-width:680px; margin:0 auto; background:#ffffff; padding:36px; border:1px solid #e8e8e5;">
            <div style="font-size:11px; letter-spacing:2px; font-weight:700; color:#910B0A; text-transform:uppercase;">
              KBX Spatial Atelier
            </div>

            <h1 style="font-size:26px; margin:18px 0 10px; color:#111111;">
              ${options.heading}
            </h1>

            <p style="font-size:14px; line-height:1.7; color:#555555;">
              ${options.message}
            </p>

            <div style="margin-top:28px; padding:18px; background:#f7f7f5; border-left:3px solid #910B0A;">
              <div style="font-size:12px; font-weight:700; color:#222222;">
                Attached document
              </div>
              <div style="font-size:12px; color:#777777; margin-top:5px;">
                ${options.filename}
              </div>
            </div>

            <p style="font-size:11px; line-height:1.6; color:#999999; margin-top:30px;">
              KBX Spatial Atelier<br/>
              Interior Design • Interior Architecture • Bespoke Space
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename:
            options.filename,
          content:
            Buffer.from(
              options.pdfBytes
            ).toString("base64"),
        },
      ],
    });

  if (result.error) {
    throw new Error(
      `Email delivery failed: ${result.error.message}`
    );
  }

  return result;
}

export async function POST(
  request: Request
) {
  let briefType: BriefType | null =
    null;

  try {
    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    let briefData: AnyObject;
    let referenceImages: ReferenceImage[] =
      [];

    /*
     * -------------------------------------------------------
     * READ REQUEST
     * -------------------------------------------------------
     *
     * All current brief pages use multipart/form-data
     * because reference images may be attached.
     */
    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const formData =
        await request.formData();

      const rawBriefType =
        formData.get(
          "briefType"
        );

      const rawBriefData =
        formData.get(
          "briefData"
        );

      if (
        typeof rawBriefData !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Missing briefData.",
          },
          {
            status: 400,
          }
        );
      }

      try {
        briefData =
          JSON.parse(
            rawBriefData
          );
      } catch {
        return NextResponse.json(
          {
            success: false,
            error:
              "briefData is not valid JSON.",
          },
          {
            status: 400,
          }
        );
      }

      briefType =
        normalizeBriefType(
          rawBriefType,
          briefData
        );

      referenceImages =
        await readReferenceImages(
          formData
        );
    } else {
      /*
       * Also support JSON requests.
       */
      const body =
        await request.json();

      briefData =
        body?.briefData ||
        body;

      briefType =
        normalizeBriefType(
          body?.briefType,
          briefData
        );
    }

    if (!briefType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to determine the brief type. Send briefType as kitchen, wardrobe, tv_unit, or full_interior.",
        },
        {
          status: 400,
        }
      );
    }

    const clientName =
      getClientName(
        briefData
      );

    const clientEmail =
      getClientEmail(
        briefData
      );

    const projectName =
      getProjectName(
        briefData
      );

    if (!clientEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The client email address is missing from the client profile.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * GENERATE PDF
     * -------------------------------------------------------
     */
    let pdfBytes =
      await buildPDF(
        briefType,
        briefData
      );

    /*
     * Add uploaded reference images.
     */
    if (
      referenceImages.length > 0
    ) {
      pdfBytes =
        await appendReferenceImages(
          pdfBytes,
          referenceImages
        );
    }

    const filename =
      `${safeFilename(
        projectName
      )}_${safeFilename(
        getBriefLabel(
          briefType
        )
      )}_Brief.pdf`;

    /*
     * -------------------------------------------------------
     * SUPABASE STORAGE
     * -------------------------------------------------------
     */
    const storageResult =
      await savePdfToSupabase(
        pdfBytes,
        filename,
        briefData,
        briefType
      );

    /*
     * -------------------------------------------------------
     * RESEND
     * -------------------------------------------------------
     */
    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured."
      );
    }

    const resend =
      new Resend(
        resendApiKey
      );

    /*
     * IMPORTANT:
     *
     * Resend's test mode only allows sending to
     * the verified/test recipient.
     *
     * Once your domain is verified, set:
     *
     * RESEND_ALLOW_EXTERNAL_RECIPIENTS=true
     *
     * Then the real client email will be used.
     */
    const allowExternalRecipients =
      process.env
        .RESEND_ALLOW_EXTERNAL_RECIPIENTS ===
      "true";

    const testRecipient =
      process.env
        .RESEND_TEST_RECIPIENT ||
      KBX_EMAIL;

    const actualClientRecipient =
      allowExternalRecipients
        ? clientEmail
        : testRecipient;

    /*
     * Email KBX.
     */
    await sendEmail(
      resend,
      {
        to: KBX_EMAIL,
        subject:
          `New ${getBriefLabel(
            briefType
          )} Brief — ${projectName}`,
        heading:
          `New ${getBriefLabel(
            briefType
          )} brief submitted`,
        message:
          `${clientName} has submitted a ${getBriefLabel(
            briefType
          )} design brief for "${projectName}". The completed PDF is attached.`,
        filename,
        pdfBytes,
      }
    );

    /*
     * Email client.
     */
    await sendEmail(
      resend,
      {
        to:
          actualClientRecipient,
        subject:
          `Your ${getBriefLabel(
            briefType
          )} Design Brief — ${projectName}`,
        heading:
          "Your design brief has been received",
        message:
          `Thank you, ${clientName}. Your ${getBriefLabel(
            briefType
          )} brief for "${projectName}" has been successfully received by KBX Spatial Atelier. A copy of your completed brief is attached to this email.`,
        filename,
        pdfBytes,
      }
    );

    /*
     * -------------------------------------------------------
     * SUCCESS
     * -------------------------------------------------------
     */
    return NextResponse.json(
      {
        success: true,

        briefType,

        briefLabel:
          getBriefLabel(
            briefType
          ),

        pdfGenerated: true,

        pdfStored: true,

        pdfUrl:
          storageResult.pdfUrl,

        pdfPath:
          storageResult.pdfPath,

        pdfFilename:
          filename,

        documentId:
          storageResult
            .documentRecord?.id ||
          null,

        emailedToKBX: true,

        emailedToClient: true,

        clientEmail,

        clientName,

        projectName,

        referenceImageCount:
          referenceImages.length,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unified brief submission error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing the brief.";

    return NextResponse.json(
      {
        success: false,
        briefType,
        error: message,
        pdfGenerated: false,
        pdfStored: false,
        emailedToKBX: false,
        emailedToClient: false,
      },
      {
        status: 500,
      }
    );
  }
}