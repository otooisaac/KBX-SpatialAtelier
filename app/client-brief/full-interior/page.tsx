"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const RED = "#910B0A";

const CLIENT_ACCOUNTS_KEY = "kbxClientAccounts";
const CURRENT_CLIENT_KEY = "kbxCurrentClientId";
const LEGACY_CLIENT_KEY = "kbxClient";
const FULL_BRIEF_DRAFT_PREFIX = "kbxFullInteriorBrief_";
const MAX_REFERENCE_IMAGES = 8;

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  createdAt?: string;
};

type BriefForm = {
  projectName: string;
  projectLocation: string;
  projectType: string;
  projectStatus: string;

  spaces: string[];
  lifestyle: string[];

  designStyles: string[];
  atmosphere: string[];
  colors: string[];

  materials: string[];
  materialNotes: string;

  furniture: string[];
  storage: string[];

  kitchen: string[];
  bathrooms: string[];

  lighting: string[];
  technology: string[];

  priorities: string[];
  avoid: string[];
  avoidNotes: string;

  timeline: string;

  mustHaves: string;
  additionalNotes: string;

  confirmation: boolean;
};

type ClientData = {
  id: string;
  name: string;
  email: string;
  contact: string;
};

type BriefData = {
  client: ClientData;
  form: BriefForm;
};

type AutoSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";

const sections = [
  "Client & Project",
  "Areas & Lifestyle",
  "Design Direction",
  "Materials",
  "Furniture & Storage",
  "Kitchen & Bathrooms",
  "Lighting & Technology",
  "Priorities",
  "Timeline & Final Requirements",
  "Confirmation",
];

const initialForm: BriefForm = {
  projectName: "",
  projectLocation: "",
  projectType: "",
  projectStatus: "",

  spaces: [],
  lifestyle: [],

  designStyles: [],
  atmosphere: [],
  colors: [],

  materials: [],
  materialNotes: "",

  furniture: [],
  storage: [],

  kitchen: [],
  bathrooms: [],

  lighting: [],
  technology: [],

  priorities: [],
  avoid: [],
  avoidNotes: "",

  timeline: "",

  mustHaves: "",
  additionalNotes: "",

  confirmation: false,
};

/* =========================================================
   CLIENT
========================================================= */

function getCurrentClient(): ClientData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const currentClientId =
      localStorage.getItem(CURRENT_CLIENT_KEY);

    const accountsRaw =
      localStorage.getItem(CLIENT_ACCOUNTS_KEY);

    if (accountsRaw) {
      const accounts = JSON.parse(accountsRaw);

      if (
        Array.isArray(accounts) &&
        currentClientId
      ) {
        const account = accounts.find(
          (item: ClientAccount) =>
            item.id === currentClientId
        );

        if (account) {
          return {
            id: account.id,
            name: account.name,
            email: account.email,
            contact: account.contact || "",
          };
        }
      }
    }

    const legacyRaw =
      localStorage.getItem(LEGACY_CLIENT_KEY);

    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);

      if (
        legacy?.id &&
        legacy?.name &&
        legacy?.email
      ) {
        return {
          id: legacy.id,
          name: legacy.name,
          email: legacy.email,
          contact: legacy.contact || "",
        };
      }
    }
  } catch (error) {
    console.error(
      "Could not read client:",
      error
    );
  }

  return null;
}

/* =========================================================
   PAGE
========================================================= */

export default function FullInteriorBriefPage() {
  const [client, setClient] =
    useState<ClientData | null>(null);

  const [form, setForm] =
    useState<BriefForm>(initialForm);

  const [
    currentSection,
    setCurrentSection,
  ] = useState(0);

  const [
    referenceImages,
    setReferenceImages,
  ] = useState<File[]>([]);

  const [
    autoSaveStatus,
    setAutoSaveStatus,
  ] = useState<AutoSaveStatus>("idle");

  const [error, setError] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  /* =======================================================
     CLIENT INITIALIZATION
  ======================================================= */

  useEffect(() => {
    const currentClient =
      getCurrentClient();

    if (currentClient) {
      setClient(currentClient);
    } else {
      setError(
        "Please create or log into your client profile before completing the brief."
      );
    }

    setLoaded(true);
  }, []);

  /* =======================================================
     DRAFT KEY
  ======================================================= */

  const draftKey = useMemo(() => {
    if (!client?.id) {
      return null;
    }

    return `${FULL_BRIEF_DRAFT_PREFIX}${client.id}`;
  }, [client?.id]);

  /* =======================================================
     RESTORE DRAFT
  ======================================================= */

  useEffect(() => {
    if (
      !loaded ||
      !client?.id ||
      !draftKey
    ) {
      return;
    }

    try {
      const saved =
        localStorage.getItem(draftKey);

      if (!saved) {
        setAutoSaveStatus("idle");
        return;
      }

      const parsed = JSON.parse(saved);

      if (parsed?.form) {
        setForm({
          ...initialForm,
          ...parsed.form,
        });
      }

      if (
        typeof parsed?.currentSection ===
        "number"
      ) {
        setCurrentSection(
          Math.min(
            Math.max(
              parsed.currentSection,
              0
            ),
            sections.length - 1
          )
        );
      }

      setAutoSaveStatus("saved");
    } catch (restoreError) {
      console.error(
        "Could not restore brief:",
        restoreError
      );

      setAutoSaveStatus("error");
    }
  }, [
    loaded,
    client?.id,
    draftKey,
  ]);

  /* =======================================================
     SAVE DRAFT
     
     useCallback keeps the function stable so that the
     automatic-save effect can safely depend on it.
  ======================================================= */

  const performAutoSave = useCallback(
    (
      nextForm: BriefForm,
      section = currentSection
    ) => {
      if (
        !draftKey ||
        typeof window === "undefined"
      ) {
        return;
      }

      try {
        setAutoSaveStatus("saving");

        localStorage.setItem(
          draftKey,
          JSON.stringify({
            clientId: client?.id,
            form: nextForm,
            currentSection: section,
            updatedAt:
              new Date().toISOString(),
          })
        );

        window.setTimeout(() => {
          setAutoSaveStatus("saved");
        }, 250);
      } catch (saveError) {
        console.error(
          "Auto-save error:",
          saveError
        );

        setAutoSaveStatus("error");
      }
    },
    [
      client?.id,
      currentSection,
      draftKey,
    ]
  );

  function saveProgress() {
    performAutoSave(
      form,
      currentSection
    );
  }

  /* =======================================================
     AUTOMATIC FORM SAVE
  ======================================================= */

  useEffect(() => {
    if (
      !loaded ||
      !client?.id ||
      !draftKey ||
      submitted
    ) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        performAutoSave(
          form,
          currentSection
        );
      }, 700);

    return () =>
      window.clearTimeout(timeout);
  }, [
    form,
    currentSection,
    loaded,
    client?.id,
    draftKey,
    submitted,
    performAutoSave,
  ]);

  /* =======================================================
     UPDATE HELPERS
  ======================================================= */

  function updateField<
    K extends keyof BriefForm
  >(
    field: K,
    value: BriefForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleArrayValue(
    field:
      | "spaces"
      | "lifestyle"
      | "designStyles"
      | "atmosphere"
      | "colors"
      | "materials"
      | "furniture"
      | "storage"
      | "kitchen"
      | "bathrooms"
      | "lighting"
      | "technology"
      | "priorities"
      | "avoid",
    value: string
  ) {
    setForm((previous) => {
      const existing =
        previous[field];

      const exists =
        existing.includes(value);

      return {
        ...previous,
        [field]: exists
          ? existing.filter(
              (item) => item !== value
            )
          : [...existing, value],
      };
    });
  }

  /* =======================================================
     UI HELPERS
  ======================================================= */

  function inputClassName() {
    return "w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm text-black outline-none transition placeholder:text-black/25 focus:border-[#910B0A] focus:ring-1 focus:ring-[#910B0A]";
  }

  function textareaClassName() {
    return "min-h-[130px] w-full resize-y rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm leading-6 text-black outline-none transition placeholder:text-black/25 focus:border-[#910B0A] focus:ring-1 focus:ring-[#910B0A]";
  }

  function optionButton(
    selected: boolean
  ) {
    return `rounded-xl border px-4 py-3 text-left text-sm text-black transition ${
      selected
        ? "border-[#910B0A] bg-[#910B0A]/5"
        : "border-black/10 bg-white hover:border-black/25"
    }`;
  }

  function renderOptions(
    field:
      | "spaces"
      | "lifestyle"
      | "designStyles"
      | "atmosphere"
      | "colors"
      | "materials"
      | "furniture"
      | "storage"
      | "kitchen"
      | "bathrooms"
      | "lighting"
      | "technology"
      | "priorities"
      | "avoid",
    options: string[]
  ) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected =
            form[field].includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() =>
                toggleArrayValue(
                  field,
                  option
                )
              }
              className={optionButton(
                selected
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                    selected
                      ? "border-[#910B0A] bg-[#910B0A] text-white"
                      : "border-black/15 bg-white"
                  }`}
                  style={
                    !selected
                      ? {
                          color:
                            "transparent",
                        }
                      : undefined
                  }
                >
                  ✓
                </span>

                <span
                  className="text-black"
                  style={{
                    color: selected
                      ? RED
                      : "#111111",
                  }}
                >
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  function renderAutoSaveStatus() {
    if (
      autoSaveStatus === "saving"
    ) {
      return (
        <span className="text-[10px] font-medium text-black/35">
          Saving...
        </span>
      );
    }

    if (
      autoSaveStatus === "saved"
    ) {
      return (
        <span className="text-[10px] font-medium text-green-600">
          ✓ Saved
        </span>
      );
    }

    if (
      autoSaveStatus === "error"
    ) {
      return (
        <span className="text-[10px] font-medium text-[#910B0A]">
          Save failed
        </span>
      );
    }

    return (
      <span className="text-[10px] font-medium text-black/25">
        Auto-save on
      </span>
    );
  }

  /* =======================================================
     PROGRESS
  ======================================================= */

  const progress =
    ((currentSection + 1) /
      sections.length) *
    100;

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateCurrentSection() {
    if (currentSection === 0) {
      if (
        !form.projectName.trim()
      ) {
        return "Please enter your project name.";
      }

      if (
        !form.projectLocation.trim()
      ) {
        return "Please enter the project location.";
      }

      if (!form.projectType) {
        return "Please select the property type.";
      }

      if (!form.projectStatus) {
        return "Please select the property status.";
      }
    }

    if (currentSection === 9) {
      if (!form.confirmation) {
        return "Please confirm that the information provided is accurate before submitting.";
      }
    }

    return "";
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function nextSection() {
    const validation =
      validateCurrentSection();

    if (validation) {
      setError(validation);
      return;
    }

    setError("");

    const nextIndex =
      Math.min(
        currentSection + 1,
        sections.length - 1
      );

    performAutoSave(
      form,
      nextIndex
    );

    setCurrentSection(nextIndex);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function previousSection() {
    setError("");

    const previousIndex =
      Math.max(
        currentSection - 1,
        0
      );

    setCurrentSection(
      previousIndex
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     REFERENCE IMAGES
  ======================================================= */

  function handleReferenceImages(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    setError("");

    if (
      files.length >
      MAX_REFERENCE_IMAGES
    ) {
      setError(
        `You can upload a maximum of ${MAX_REFERENCE_IMAGES} reference images.`
      );

      event.target.value = "";
      return;
    }

    const invalidFile =
      files.find((file) => {
        const validType =
          file.type ===
            "image/jpeg" ||
          file.type ===
            "image/jpg" ||
          file.type ===
            "image/png";

        const validSize =
          file.size <=
          5 * 1024 * 1024;

        return (
          !validType ||
          !validSize
        );
      });

    if (invalidFile) {
      setError(
        `"${invalidFile.name}" is not supported or is larger than 5 MB. Please use JPEG or PNG images under 5 MB.`
      );

      event.target.value = "";
      return;
    }

    setReferenceImages(files);
  }

  function removeReferenceImage(
    index: number
  ) {
    setReferenceImages(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  }

  /* =======================================================
     COMPLETE BRIEF
  ======================================================= */

  async function completeBrief() {
    if (!client) {
      setError(
        "Your client profile could not be found. Please return to the Client Portal and log in again."
      );

      return;
    }

    const validation =
      validateCurrentSection();

    if (validation) {
      setError(validation);
      return;
    }

    setError("");
    setSubmitting(true);
    setSubmitted(false);

    try {
      const briefData: BriefData = {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          contact: client.contact,
        },

        form: {
          ...form,
        },
      };

      /* -----------------------------------------------
         FINAL LOCAL SAVE
      ------------------------------------------------ */

      if (draftKey) {
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              clientId: client.id,
              form,
              currentSection,
              updatedAt:
                new Date().toISOString(),
            })
          );
        } catch (storageError) {
          console.error(
            "Could not save final draft:",
            storageError
          );
        }
      }

      /* -----------------------------------------------
         FORM DATA
      ------------------------------------------------ */

      const formData =
        new FormData();

      formData.append(
        "briefType",
        "full_interior"
      );

      formData.append(
        "briefData",
        JSON.stringify(
          briefData
        )
      );

      referenceImages.forEach(
        (file) => {
          formData.append(
            "referenceImages",
            file,
            file.name
          );
        }
      );

      /* -----------------------------------------------
         SUBMIT TO UNIFIED API
         
         API ROUTE:
         app/api/send-brief/route.ts
         
         BROWSER ENDPOINT:
         /api/send-brief
      ------------------------------------------------ */

      const response =
        await fetch(
          "/api/send-brief",
          {
            method: "POST",
            body: formData,
          }
        );

      /* -----------------------------------------------
         SAFELY READ RESPONSE
      ------------------------------------------------ */

      const responseText =
        await response.text();

      let result: any = null;

      try {
        result =
          responseText.trim()
            ? JSON.parse(
                responseText
              )
            : null;
      } catch (jsonError) {
        console.error(
          "API returned a non-JSON response:",
          responseText
        );

        throw new Error(
          `The submission server returned an unexpected response (${response.status}). Please try again.`
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            `Unable to submit your brief. Server returned ${response.status}.`
        );
      }

      /* -----------------------------------------------
         CACHE DOCUMENT LOCALLY
      ------------------------------------------------ */

      if (
        result.documentId
      ) {
        try {
          const existing =
            localStorage.getItem(
              "kbxClientDocuments"
            );

          const documents =
            existing
              ? JSON.parse(existing)
              : [];

          const newDocument = {
            id: result.documentId,

            clientId:
              client.id,

            projectName:
              form.projectName ||
              "Full Interior Project",

            documentName:
              result.document
                ?.documentName ||
              `${
                form.projectName ||
                "Full_Interior_Project"
              }_Full_Interior_Brief.pdf`,

            documentType:
              "full_interior_brief",

            createdAt:
              result.document
                ?.createdAt ||
              new Date().toISOString(),
          };

          const updated =
            Array.isArray(
              documents
            )
              ? [
                  ...documents.filter(
                    (document: {
                      id?: string;
                    }) =>
                      document.id !==
                      result.documentId
                  ),
                  newDocument,
                ]
              : [newDocument];

          localStorage.setItem(
            "kbxClientDocuments",
            JSON.stringify(
              updated
            )
          );
        } catch (
          storageError
        ) {
          console.error(
            "Could not cache document:",
            storageError
          );
        }
      }

      /* -----------------------------------------------
         REMOVE EDITABLE DRAFT
      ------------------------------------------------ */

      if (draftKey) {
        try {
          localStorage.removeItem(
            draftKey
          );
        } catch (removeError) {
          console.error(
            "Could not remove draft:",
            removeError
          );
        }
      }

      setSubmitted(true);
      setAutoSaveStatus("saved");
      setError("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submissionError) {
      console.error(
        "Brief submission error:",
        submissionError
      );

      setError(
        submissionError instanceof
          Error
          ? submissionError.message
          : "Unable to submit the brief. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     RENDER SECTION
  ======================================================= */

  function renderSection() {
    /* =======================================================
       SECTION 01
    ======================================================= */

    if (currentSection === 0) {
      return (
        <div className="space-y-10">
          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Project Name *
            </label>

            <input
              type="text"
              value={form.projectName}
              onChange={(event) =>
                updateField(
                  "projectName",
                  event.target.value
                )
              }
              placeholder="e.g. Otoo Residence"
              className={inputClassName()}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Project Location *
            </label>

            <input
              type="text"
              value={form.projectLocation}
              onChange={(event) =>
                updateField(
                  "projectLocation",
                  event.target.value
                )
              }
              placeholder="e.g. East Legon, Accra"
              className={inputClassName()}
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Property Type *
            </p>

            {renderOptionsSingle(
              form.projectType,
              [
                "Apartment",
                "Detached House",
                "Semi-Detached House",
                "Townhouse",
                "Penthouse",
                "Office",
                "Commercial Space",
                "Other",
              ],
              (value) =>
                updateField(
                  "projectType",
                  value
                )
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Property Status *
            </p>

            {renderOptionsSingle(
              form.projectStatus,
              [
                "New Build",
                "Under Construction",
                "Recently Purchased",
                "Existing Home",
                "Renovation",
                "Rental Property",
                "Other",
              ],
              (value) =>
                updateField(
                  "projectStatus",
                  value
                )
            )}
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 02
    ======================================================= */

    if (currentSection === 1) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Which areas would you like us to design?
            </p>

            {renderOptions(
              "spaces",
              [
                "Living Room",
                "Dining Area",
                "Kitchen",
                "Master Bedroom",
                "Other Bedrooms",
                "Walk-in Closet",
                "Bathrooms",
                "Home Office",
                "Entrance / Foyer",
                "Corridor",
                "Outdoor / Terrace",
                "Entertainment Area",
              ]
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Who will primarily use the space?
            </p>

            {renderOptions(
              "lifestyle",
              [
                "Single Occupant",
                "Couple",
                "Family",
                "Children",
                "Guests",
                "Domestic Staff",
                "Work-from-home",
                "Frequent Entertaining",
              ]
            )}
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 03
    ======================================================= */

    if (currentSection === 2) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Which design styles appeal to you?
            </p>

            {renderOptions(
              "designStyles",
              [
                "Modern",
                "Contemporary",
                "Minimalist",
                "Luxury",
                "Classic",
                "Transitional",
                "Industrial",
                "Scandinavian",
                "Japandi",
                "African Contemporary",
                "Organic / Natural",
                "Eclectic",
              ]
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              What atmosphere should the space have?
            </p>

            {renderOptions(
              "atmosphere",
              [
                "Warm & Cozy",
                "Calm & Serene",
                "Elegant",
                "Luxurious",
                "Bold & Dramatic",
                "Bright & Airy",
                "Natural",
                "Sophisticated",
                "Minimal",
                "Creative",
              ]
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              What colour directions do you prefer?
            </p>

            {renderOptions(
              "colors",
              [
                "Warm Neutrals",
                "Cool Neutrals",
                "Earth Tones",
                "White & Minimal",
                "Black & Contrast",
                "Greige",
                "Wood Tones",
                "Deep / Moody Colours",
                "Soft Pastels",
                "Bold Accent Colours",
              ]
            )}
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 04
    ======================================================= */

    if (currentSection === 3) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Which materials and finishes interest you?
            </p>

            {renderOptions(
              "materials",
              [
                "Natural Wood",
                "Wood Grain Melamine",
                "Super Matte",
                "High Gloss",
                "Natural Stone",
                "Quartz",
                "Marble",
                "Porcelain",
                "Metal",
                "Glass",
                "Microcement",
                "Textured Finishes",
                "Veneer",
                "Thermal Foil",
              ]
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Tell us about any specific material or finish you already have in mind.
            </label>

            <textarea
              value={form.materialNotes}
              onChange={(event) =>
                updateField(
                  "materialNotes",
                  event.target.value
                )
              }
              placeholder="Tell us anything specific you would like us to consider..."
              className={textareaClassName()}
            />
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 05
    ======================================================= */

    if (currentSection === 4) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Furniture requirements
            </p>

            {renderOptions(
              "furniture",
              [
                "Sofa / Sectional",
                "Accent Chairs",
                "Coffee Table",
                "TV Console",
                "Dining Table",
                "Dining Chairs",
                "Bed",
                "Bedside Tables",
                "Dressing Table",
                "Home Office Desk",
                "Bookshelves",
                "Custom Furniture",
              ]
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Storage requirements
            </p>

            {renderOptions(
              "storage",
              [
                "Built-in Wardrobes",
                "Walk-in Closet",
                "Kitchen Cabinets",
                "TV Storage",
                "Display Cabinets",
                "Bookshelves",
                "Entryway Storage",
                "Laundry Storage",
                "Home Office Storage",
                "Hidden Storage",
                "Custom Joinery",
              ]
            )}
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 06
    ======================================================= */

    if (currentSection === 5) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Kitchen requirements
            </p>

            {renderOptions(
              "kitchen",
              [
                "Full Kitchen Design",
                "Island",
                "Breakfast Bar",
                "Tall Unit",
                "Built-in Oven",
                "Microwave",
                "Hob",
                "Extractor",
                "Integrated Refrigerator",
                "Pantry Storage",
                "Wine Storage",
                "Open Shelving",
                "Utility / Laundry Area",
              ]
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Bathroom requirements
            </p>

            {renderOptions(
              "bathrooms",
              [
                "Vanity Unit",
                "Double Vanity",
                "Walk-in Shower",
                "Bathtub",
                "Wall-Hung WC",
                "Mirrored Cabinet",
                "Storage",
                "Feature Wall",
                "Natural Stone",
                "Large Format Tiles",
                "Hotel-style Bathroom",
              ]
            )}
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 07
    ======================================================= */

    if (currentSection === 6) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Lighting preferences
            </p>

            {renderOptions(
              "lighting",
              [
                "Recessed Downlights",
                "Pendant Lights",
                "Wall Lights",
                "LED Strip Lighting",
                "Cove Lighting",
                "Feature Lighting",
                "Under-Cabinet Lighting",
                "Warm Lighting",
                "Cool Lighting",
                "Dimmable Lighting",
                "Smart Lighting",
              ]
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Technology / smart-home requirements
            </p>

            {renderOptions(
              "technology",
              [
                "Smart Lighting",
                "Smart Switches",
                "Automated Curtains",
                "Home Theatre",
                "TV / Media System",
                "Multi-room Audio",
                "Security System",
                "Smart Locks",
                "Voice Control",
                "Wi-Fi / Networking",
                "No Special Requirements",
              ]
            )}
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 08
    ======================================================= */

    if (currentSection === 7) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              What matters most to you?
            </p>

            {renderOptions(
              "priorities",
              [
                "Aesthetic Appeal",
                "Functionality",
                "Storage",
                "Comfort",
                "Durability",
                "Luxury",
                "Low Maintenance",
                "Budget Efficiency",
                "Entertainment",
                "Family-Friendly Design",
                "Resale Value",
                "Timelessness",
              ]
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Is there anything you definitely want to avoid?
            </p>

            {renderOptions(
              "avoid",
              [
                "Too Much Colour",
                "Too Much Wood",
                "Glossy Finishes",
                "Dark Interiors",
                "Very Minimal Design",
                "Traditional Styling",
                "Open Shelving",
                "Visible Clutter",
                "Heavy Furniture",
                "Overly Decorative Design",
              ]
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Other things you want us to avoid
            </label>

            <textarea
              value={form.avoidNotes}
              onChange={(event) =>
                updateField(
                  "avoidNotes",
                  event.target.value
                )
              }
              placeholder="Describe anything you definitely do not want..."
              className={textareaClassName()}
            />
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 09
    ======================================================= */

    if (currentSection === 8) {
      return (
        <div className="space-y-10">
          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              When would you ideally like the project completed?
            </p>

            {renderOptionsSingle(
              form.timeline,
              [
                "As soon as possible",
                "Within 1–3 months",
                "Within 3–6 months",
                "Within 6–12 months",
                "More than 12 months",
                "No fixed timeline",
              ],
              (value) =>
                updateField(
                  "timeline",
                  value
                )
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Absolute must-haves
            </label>

            <textarea
              value={form.mustHaves}
              onChange={(event) =>
                updateField(
                  "mustHaves",
                  event.target.value
                )
              }
              placeholder="What are the things your finished space absolutely must have?"
              className={textareaClassName()}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Additional notes
            </label>

            <textarea
              value={form.additionalNotes}
              onChange={(event) =>
                updateField(
                  "additionalNotes",
                  event.target.value
                )
              }
              placeholder="Anything else you would like the KBX design team to know..."
              className={textareaClassName()}
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-black/60">
              Reference Images
            </p>

            <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf8] p-6">
              <input
                id="reference-images"
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={
                  handleReferenceImages
                }
                className="block w-full text-xs text-black/50 file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-medium file:text-white"
              />

              <p className="mt-3 text-[11px] leading-5 text-black/35">
                Upload up to 8 JPEG or PNG reference images. Each image must be 5 MB or less.
              </p>
            </div>

            {referenceImages.length >
              0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {referenceImages.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-black/70">
                          {file.name}
                        </p>

                        <p className="mt-1 text-[10px] text-black/35">
                          {(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(
                            2
                          )}{" "}
                          MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeReferenceImage(
                            index
                          )
                        }
                        className="ml-3 text-[10px] font-semibold text-[#910B0A]"
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    /* =======================================================
       SECTION 10
    ======================================================= */

    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-[#f7f7f5] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/35">
            Almost there
          </p>

          <h3 className="mt-3 text-xl font-semibold">
            Review your information
          </h3>

          <p className="mt-3 text-sm leading-6 text-black/45">
            Please confirm that the information
            you have provided is accurate and that
            KBX Spatial Atelier may use it as the
            basis for your interior design
            consultation and proposal.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            updateField(
              "confirmation",
              !form.confirmation
            )
          }
          className={optionButton(
            form.confirmation
          )}
        >
          <div className="flex items-start gap-4">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                form.confirmation
                  ? "border-[#910B0A] bg-[#910B0A] text-white"
                  : "border-black/15 bg-white"
              }`}
              style={
                !form.confirmation
                  ? {
                      color:
                        "transparent",
                    }
                  : undefined
              }
            >
              ✓
            </span>

            <span
              className="text-sm leading-6"
              style={{
                color:
                  form.confirmation
                    ? RED
                    : "#111111",
              }}
            >
              I confirm that the information
              provided in this brief is accurate
              to the best of my knowledge, and I
              understand that KBX Spatial Atelier
              will use it to understand my project
              requirements.
            </span>
          </div>
        </button>

        <div className="rounded-2xl border border-black/10 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
            Submission
          </p>

          <p className="mt-3 text-sm leading-6 text-black/50">
            Once you click{" "}
            <strong className="text-black/70">
              Complete Brief
            </strong>
            , KBX will generate a PDF summary of
            your brief, save it securely to your
            Client Portal, and send the submission
            to the KBX team.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     SINGLE SELECT OPTIONS
  ======================================================= */

  function renderOptionsSingle(
    selected: string,
    options: string[],
    onChange: (
      value: string
    ) => void
  ) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected =
            selected === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() =>
                onChange(option)
              }
              className={optionButton(
                isSelected
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[#910B0A]"
                      : "border-black/15"
                  }`}
                >
                  {isSelected && (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          RED,
                      }}
                    />
                  )}
                </span>

                <span
                  className="text-black"
                  style={{
                    color: isSelected
                      ? RED
                      : "#111111",
                  }}
                >
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#910B0A]" />

            <p className="mt-4 text-xs text-black/40">
              Loading your brief...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     NO CLIENT
  ======================================================= */

  if (!client) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <header className="border-b border-black/10 bg-white px-5 py-5 md:px-8">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <Link
              href="/"
              className="flex items-center"
            >
              <div className="relative h-[48px] w-[100px]">
                <Image
                  src="/kbx-logo.svg"
                  alt="KBX Spatial Atelier"
                  fill
                  sizes="100px"
                  className="object-contain object-left"
                />
              </div>

              <div className="ml-2">
                <p className="text-sm font-semibold">
                  KBX Spatial Atelier
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-black/35">
                  Client Portal
                </p>
              </div>
            </Link>
          </div>
        </header>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold text-white"
              style={{
                backgroundColor:
                  RED,
              }}
            >
              !
            </div>

            <h1 className="mt-6 text-2xl font-semibold">
              Client profile required
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/45">
              Please create a client profile or
              log into your existing profile before
              completing the Full Interior Project
              Brief.
            </p>

            <Link
              href="/client-profile"
              className="mt-7 inline-flex rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#910B0A]"
            >
              Go to Client Portal →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-black/10 bg-white px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <Link
            href="/client-portal"
            className="flex items-center"
          >
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
                Client Portal
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-5 sm:flex">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.15em] text-black/30">
                Client
              </p>

              <p className="mt-1 text-xs font-medium text-black/60">
                {client.name}
              </p>
            </div>

            <Link
              href="/client-portal"
              className="text-xs font-medium text-black/45 transition hover:text-black"
            >
              ← Client Portal
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          PROGRESS
          
          IMPORTANT:
          This is NOT sticky.
          It will scroll normally with the page.
      ===================================================== */}

      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-[1000px] px-5 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: RED,
                }}
              >
                Full Interior Project
              </p>

              <p className="mt-1 text-xs text-black/40">
                Section{" "}
                {currentSection + 1}{" "}
                of {sections.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {renderAutoSaveStatus()}

              <span className="text-xs font-semibold text-black/45">
                {Math.round(progress)}
                %
              </span>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: RED,
              }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="px-5 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-[900px]">
          {currentSection === 0 && (
            <div className="mb-8 rounded-3xl bg-black p-7 text-white md:p-10">
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: RED,
                }}
              >
                KBX Client Design Brief
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
                Your space.
                <br />
                Your vision.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/50">
                Help us understand your project before
                we begin the design process. Most
                questions can be answered simply by
                selecting the options that apply to you.
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-10">
            <div className="flex items-start gap-5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{
                  backgroundColor:
                    RED,
                }}
              >
                {String(
                  currentSection + 1
                ).padStart(2, "0")}
              </div>

              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: RED,
                  }}
                >
                  Section{" "}
                  {String(
                    currentSection + 1
                  ).padStart(2, "0")}
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  {
                    sections[
                      currentSection
                    ]
                  }
                </h2>
              </div>
            </div>

            <div className="mt-10">
              {renderSection()}
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-8 rounded-xl border border-[#910B0A]/20 bg-[#910B0A]/5 px-4 py-4">
                <p
                  className="text-xs font-medium leading-5"
                  style={{
                    color: RED,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* SUCCESS */}

            {submitted && !error && (
              <div className="mt-8 rounded-xl border border-green-600/20 bg-green-600/5 px-4 py-4">
                <p className="text-xs font-medium leading-5 text-green-700">
                  Your brief has been submitted successfully. The PDF has been generated, saved to your Client Portal, and sent to KBX Spatial Atelier.
                </p>

                <Link
                  href="/client-portal"
                  className="mt-4 inline-flex rounded-lg bg-green-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  View My Documents →
                </Link>
              </div>
            )}

            {/* NAVIGATION */}

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-black/10 pt-6 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={
                  previousSection
                }
                disabled={
                  currentSection === 0 ||
                  submitting
                }
                className="rounded-xl border border-black/10 px-5 py-3.5 text-sm font-medium text-black transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    saveProgress
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Progress
                </button>

                {currentSection <
                sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={
                      nextSection
                    }
                    disabled={
                      submitting
                    }
                    className="rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor:
                        RED,
                    }}
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      completeBrief
                    }
                    disabled={
                      submitting ||
                      submitted
                    }
                    className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#910B0A] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting..."
                      : submitted
                      ? "Brief Submitted ✓"
                      : "Complete Brief ✓"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              SECTION NAVIGATION
          ================================================= */}

          <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
              Sections
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {sections.map(
                (
                  sectionName,
                  index
                ) => (
                  <button
                    key={
                      sectionName
                    }
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() => {
                      setCurrentSection(
                        index
                      );

                      setError("");

                      performAutoSave(
                        form,
                        index
                      );

                      window.scrollTo(
                        {
                          top: 0,
                          behavior:
                            "smooth",
                        }
                      );
                    }}
                    className={`rounded-lg px-3 py-2 text-[10px] font-medium transition disabled:cursor-not-allowed ${
                      currentSection ===
                      index
                        ? "text-white"
                        : "bg-[#f7f7f5] text-black"
                    }`}
                    style={
                      currentSection ===
                      index
                        ? {
                            backgroundColor:
                              RED,
                          }
                        : {
                            color:
                              "#111111",
                          }
                    }
                  >
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-black/10 bg-white px-5 py-8 md:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
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
                    Interior Design • Architecture • Bespoke Space
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-xs leading-5 text-black/40">
                Creating thoughtful, sophisticated
                environments through design,
                architecture and bespoke spatial
                solutions.
              </p>
            </div>

            <div className="text-xs text-black/40 md:text-right">
              <p className="font-medium text-black/55">
                Full Interior Project
              </p>

              <p className="mt-1">
                Client Design Brief
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-5">
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.15em] text-black/30 sm:flex-row sm:justify-between">
              <span>
                © 2026 KBX Spatial Atelier
              </span>

              <span>
                Interior Design • Interior Architecture • Bespoke Space
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}