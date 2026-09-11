"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
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

type MultiField =
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
  | "avoid";

type SingleField =
  | "projectType"
  | "projectStatus"
  | "timeline";

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

const projectTypes = [
  "Apartment",
  "Detached House",
  "Semi-Detached House",
  "Townhouse",
  "Penthouse",
  "Office",
  "Commercial Space",
  "Other",
];

const projectStatuses = [
  "New Build",
  "Under Construction",
  "Recently Purchased",
  "Existing Home",
  "Renovation",
  "Rental Property",
  "Other",
];

const spaces = [
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
];

const lifestyle = [
  "Single Occupant",
  "Couple",
  "Family",
  "Children",
  "Guests",
  "Domestic Staff",
  "Work-from-home",
  "Frequent Entertaining",
];

const designStyles = [
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
];

const atmosphere = [
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
];

const colors = [
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
];

const materials = [
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
];

const furniture = [
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
  "Drawers",
];

const storage = [
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
  "Open Shelving",
  "Drawers",
];

const kitchen = [
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
  "Drawers",
];

const bathrooms = [
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
];

const lighting = [
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
];

const technology = [
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
];

const priorities = [
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
];

const avoid = [
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
];

const timelines = [
  "As soon as possible",
  "Within 1–3 months",
  "Within 3–6 months",
  "Within 6–12 months",
  "More than 12 months",
  "No fixed timeline",
];

const sections = [
  {
    number: "01",
    title: "Project Information",
    description:
      "Tell us about the property and the current stage of your project.",
  },
  {
    number: "02",
    title: "Spaces & Lifestyle",
    description:
      "Tell us which spaces are involved and how the property will be used.",
  },
  {
    number: "03",
    title: "Design Direction",
    description:
      "Define the visual style, atmosphere and colour direction.",
  },
  {
    number: "04",
    title: "Materials & Finishes",
    description:
      "Choose the materials and finishes that best represent your vision.",
  },
  {
    number: "05",
    title: "Furniture & Storage",
    description:
      "Identify the furniture, joinery and storage requirements.",
  },
  {
    number: "06",
    title: "Kitchen",
    description:
      "Tell us about your kitchen layout, functions and features.",
  },
  {
    number: "07",
    title: "Bathrooms",
    description:
      "Select the bathroom features and finishes you require.",
  },
  {
    number: "08",
    title: "Lighting & Technology",
    description:
      "Define your lighting preferences and smart-home requirements.",
  },
  {
    number: "09",
    title: "Priorities & Preferences",
    description:
      "Tell us what matters most and what you would prefer to avoid.",
  },
  {
    number: "10",
    title: "Timeline & Final Requirements",
    description:
      "Give us your timeline and any requirements we should know.",
  },
  {
    number: "11",
    title: "References & Confirmation",
    description:
      "Upload references, review your information and confirm the brief.",
  },
];

function getAccounts(): ClientAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CLIENT_ACCOUNTS_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeForm(savedForm: Partial<BriefForm>): BriefForm {
  return {
    ...initialForm,
    ...savedForm,

    spaces: Array.isArray(savedForm.spaces)
      ? savedForm.spaces
      : [],

    lifestyle: Array.isArray(savedForm.lifestyle)
      ? savedForm.lifestyle
      : [],

    designStyles: Array.isArray(savedForm.designStyles)
      ? savedForm.designStyles
      : [],

    atmosphere: Array.isArray(savedForm.atmosphere)
      ? savedForm.atmosphere
      : [],

    colors: Array.isArray(savedForm.colors)
      ? savedForm.colors
      : [],

    materials: Array.isArray(savedForm.materials)
      ? savedForm.materials
      : [],

    furniture: Array.isArray(savedForm.furniture)
      ? savedForm.furniture
      : [],

    storage: Array.isArray(savedForm.storage)
      ? savedForm.storage
      : [],

    kitchen: Array.isArray(savedForm.kitchen)
      ? savedForm.kitchen
      : [],

    bathrooms: Array.isArray(savedForm.bathrooms)
      ? savedForm.bathrooms
      : [],

    lighting: Array.isArray(savedForm.lighting)
      ? savedForm.lighting
      : [],

    technology: Array.isArray(savedForm.technology)
      ? savedForm.technology
      : [],

    priorities: Array.isArray(savedForm.priorities)
      ? savedForm.priorities
      : [],

    avoid: Array.isArray(savedForm.avoid)
      ? savedForm.avoid
      : [],

    confirmation: Boolean(savedForm.confirmation),
  };
}

function MultiSelectGroup({
  title,
  description,
  field,
  options,
  form,
  onToggle,
}: {
  title: string;
  description?: string;
  field: MultiField;
  options: string[];
  form: BriefForm;
  onToggle: (field: MultiField, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-black">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm leading-6 text-black/50">
            {description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const selected = form[field].includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(field, option)}
              aria-pressed={selected}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                selected
                  ? "border-[#910B0A] bg-[#910B0A] text-white shadow-sm"
                  : "border-black/10 bg-white text-black/70 hover:border-black/25 hover:bg-black/[0.015]"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{option}</span>

                {selected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
                    ✓
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SingleSelectGroup({
  title,
  description,
  field,
  options,
  value,
  onSelect,
}: {
  title: string;
  description?: string;
  field: SingleField;
  options: string[];
  value: string;
  onSelect: (field: SingleField, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-black">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm leading-6 text-black/50">
            {description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(field, option)}
              aria-pressed={selected}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                selected
                  ? "border-[#910B0A] bg-[#910B0A] text-white shadow-sm"
                  : "border-black/10 bg-white text-black/70 hover:border-black/25 hover:bg-black/[0.015]"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{option}</span>

                {selected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
                    ✓
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-black">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm text-black outline-none transition placeholder:text-black/30 focus:border-[#910B0A] focus:ring-2 focus:ring-[#910B0A]/10"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-black">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm leading-6 text-black outline-none transition placeholder:text-black/30 focus:border-[#910B0A] focus:ring-2 focus:ring-[#910B0A]/10"
      />
    </div>
  );
}

export default function FullInteriorBriefPage() {
  const [client, setClient] = useState<ClientAccount | null>(null);

  const [form, setForm] = useState<BriefForm>(initialForm);

  const [currentSection, setCurrentSection] = useState(0);

  const [isRestored, setIsRestored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  const [referenceImages, setReferenceImages] = useState<File[]>(
    []
  );

  const [saveStatus, setSaveStatus] = useState("Saved");

  const restoredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const accounts = getAccounts();

    const currentId = localStorage.getItem(
      CURRENT_CLIENT_KEY
    );

    const legacyRaw = localStorage.getItem(
      LEGACY_CLIENT_KEY
    );

    let activeClient: ClientAccount | null = null;

    if (currentId) {
      activeClient =
        accounts.find(
          (item) => item.id === currentId
        ) || null;
    }

    if (!activeClient && legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw);

        if (
          parsed?.id &&
          parsed?.name &&
          parsed?.email
        ) {
          activeClient = {
            id: parsed.id,
            name: parsed.name,
            email: parsed.email,
            contact: parsed.contact || "",
          };
        }
      } catch {
        // Ignore malformed legacy client data.
      }
    }

    if (!activeClient) {
      restoredRef.current = true;
      setIsRestored(true);
      return;
    }

    setClient(activeClient);

    const draftKey =
      `${FULL_BRIEF_DRAFT_PREFIX}${activeClient.id}`;

    const rawDraft =
      localStorage.getItem(draftKey);

    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft);

        if (parsed?.form) {
          setForm(
            mergeForm(parsed.form)
          );
        }

        if (
          typeof parsed?.currentSection ===
            "number" &&
          parsed.currentSection >= 0 &&
          parsed.currentSection <
            sections.length
        ) {
          setCurrentSection(
            parsed.currentSection
          );
        }
      } catch {
        // Ignore malformed draft.
      }
    }

    restoredRef.current = true;

    setIsRestored(true);
  }, []);

  useEffect(() => {
    if (
      !client ||
      !isRestored ||
      !restoredRef.current ||
      submitted
    ) {
      return;
    }

    setSaveStatus("Saving...");

    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          `${FULL_BRIEF_DRAFT_PREFIX}${client.id}`,
          JSON.stringify({
            form,
            currentSection,
            updatedAt:
              new Date().toISOString(),
          })
        );

        setSaveStatus("Saved");
      } catch {
        setSaveStatus("Unable to save");
      }
    }, 700);

    return () =>
      window.clearTimeout(timer);
  }, [
    client,
    form,
    currentSection,
    isRestored,
    submitted,
  ]);

  function updateField<K extends keyof BriefForm>(
    field: K,
    value: BriefForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleMultiSelect(
    field: MultiField,
    value: string
  ) {
    setForm((previous) => {
      const current = previous[field];

      const next = current.includes(value)
        ? current.filter(
            (item) => item !== value
          )
        : [...current, value];

      return {
        ...previous,
        [field]: next,
      };
    });
  }

  function selectSingle(
    field: SingleField,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function goToSection(index: number) {
    if (
      index < 0 ||
      index >= sections.length
    ) {
      return;
    }

    setCurrentSection(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goNext() {
    if (
      currentSection <
      sections.length - 1
    ) {
      goToSection(
        currentSection + 1
      );
    }
  }

  function goPrevious() {
    if (currentSection > 0) {
      goToSection(
        currentSection - 1
      );
    }
  }

  function handleReferenceImages(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (
        referenceImages.length +
          validFiles.length >=
        MAX_REFERENCE_IMAGES
      ) {
        errors.push(
          `Maximum of ${MAX_REFERENCE_IMAGES} images allowed.`
        );
        break;
      }

      if (
        ![
          "image/jpeg",
          "image/png",
        ].includes(file.type)
      ) {
        errors.push(
          `${file.name}: only JPG and PNG images are allowed.`
        );
        continue;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        errors.push(
          `${file.name}: image must be 5MB or smaller.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length) {
      setReferenceImages(
        (previous) => [
          ...previous,
          ...validFiles,
        ]
      );
    }

    if (errors.length) {
      setError(errors.join(" "));
    } else {
      setError("");
    }

    event.target.value = "";
  }

  function removeReferenceImage(
    index: number
  ) {
    setReferenceImages(
      (previous) =>
        previous.filter(
          (_, fileIndex) =>
            fileIndex !== index
        )
    );
  }

  function validateBeforeSubmit() {
    if (!client) {
      return "Client information could not be found. Please return to your client portal.";
    }

    if (!form.projectName.trim()) {
      return "Please enter a project name.";
    }

    if (!form.projectLocation.trim()) {
      return "Please enter the project location.";
    }

    if (!form.projectType) {
      return "Please select a project type.";
    }

    if (!form.projectStatus) {
      return "Please select the current project status.";
    }

    if (!form.spaces.length) {
      return "Please select at least one space.";
    }

    if (!form.confirmation) {
      return "Please confirm that the information provided is accurate.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const validationError =
      validateBeforeSubmit();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!client) {
      setError(
        "Client information could not be found."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const briefData = {
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

      const formData = new FormData();

      formData.append(
        "briefType",
        "full_interior"
      );

      formData.append(
        "briefData",
        JSON.stringify(briefData)
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

      const response = await fetch(
        "/api/send-brief",
        {
          method: "POST",
          body: formData,
        }
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "We could not submit your brief. Please try again."
        );
      }

      try {
        localStorage.removeItem(
          `${FULL_BRIEF_DRAFT_PREFIX}${client.id}`
        );
      } catch {
        // Ignore cleanup errors.
      }

      if (result?.document) {
        try {
          const existingRaw =
            localStorage.getItem(
              "kbxClientDocuments"
            );

          const existing =
            existingRaw
              ? JSON.parse(existingRaw)
              : {};

          const clientDocuments =
            existing &&
            typeof existing ===
              "object"
              ? existing
              : {};

          if (
            !Array.isArray(
              clientDocuments[
                client.id
              ]
            )
          ) {
            clientDocuments[
              client.id
            ] = [];
          }

          clientDocuments[
            client.id
          ].unshift(
            result.document
          );

          localStorage.setItem(
            "kbxClientDocuments",
            JSON.stringify(
              clientDocuments
            )
          );
        } catch {
          // Optional local document cache.
        }
      }

      setSubmitted(true);
      setSaveStatus("Submitted");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while submitting the brief."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const current =
    sections[currentSection];

  const completionPercentage =
    useMemo(() => {
      return Math.round(
        ((currentSection + 1) /
          sections.length) *
          100
      );
    }, [currentSection]);

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-black">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex h-[100px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
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

            <Link
              href="/client-portal"
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black/20"
            >
              Back to Portal
            </Link>
          </div>
        </header>

        <section className="flex min-h-[calc(100vh-100px)] items-center justify-center px-5 py-16">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-black/[0.04] sm:p-12">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white"
              style={{
                backgroundColor: RED,
              }}
            >
              ✓
            </div>

            <p
              className="mt-8 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: RED }}
            >
              Brief Submitted
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Thank you,{" "}
              {client?.name || "Client"}.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-black/55">
              Your Full Interior Design Brief
              has been successfully submitted.
              Our team will review the
              information and proceed with the
              next stage of your project.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/client-portal"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{
                  backgroundColor: RED,
                }}
              >
                Return to Client Portal
              </Link>

              <Link
                href="/"
                className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black"
              >
                Back to Website
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[100px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
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

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-black/40 sm:block">
              {saveStatus}
            </span>

            <Link
              href="/client-portal"
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black/20"
            >
              Back to Portal
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-8">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: RED }}
              >
                Full Interior Design Brief
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Let&apos;s define your space.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">
                Complete each step so our design team can understand
                your project, preferences and requirements.
              </p>
            </div>

            {client && (
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/35">
                  Client
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {client.name}
                </p>
              </div>
            )}
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: RED,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-black/40">
            <span>
              Step {currentSection + 1} of{" "}
              {sections.length}
            </span>

            <span>
              {completionPercentage}% complete
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5 rounded-[30px] bg-black px-6 py-6 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">
                {current.number}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  Step {currentSection + 1}
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  {current.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  {current.description}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-black/[0.04] sm:p-8 lg:p-10">
            {currentSection === 0 && (
              <div className="space-y-10">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput
                    label="Project Name"
                    value={form.projectName}
                    onChange={(value) =>
                      updateField(
                        "projectName",
                        value
                      )
                    }
                    placeholder="e.g. Otoo Residence"
                  />

                  <TextInput
                    label="Project Location"
                    value={form.projectLocation}
                    onChange={(value) =>
                      updateField(
                        "projectLocation",
                        value
                      )
                    }
                    placeholder="e.g. East Legon, Accra"
                  />
                </div>

                <SingleSelectGroup
                  title="Project Type"
                  description="Select one property type."
                  field="projectType"
                  options={projectTypes}
                  value={form.projectType}
                  onSelect={selectSingle}
                />

                <SingleSelectGroup
                  title="Project Status"
                  description="Select the option that best describes the current state of the property."
                  field="projectStatus"
                  options={projectStatuses}
                  value={form.projectStatus}
                  onSelect={selectSingle}
                />
              </div>
            )}

            {currentSection === 1 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="Which spaces are included?"
                  field="spaces"
                  options={spaces}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <MultiSelectGroup
                  title="Who will use the space?"
                  field="lifestyle"
                  options={lifestyle}
                  form={form}
                  onToggle={toggleMultiSelect}
                />
              </div>
            )}

            {currentSection === 2 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="Preferred Design Styles"
                  field="designStyles"
                  options={designStyles}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <MultiSelectGroup
                  title="Desired Atmosphere"
                  field="atmosphere"
                  options={atmosphere}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <MultiSelectGroup
                  title="Preferred Colour Direction"
                  field="colors"
                  options={colors}
                  form={form}
                  onToggle={toggleMultiSelect}
                />
              </div>
            )}

            {currentSection === 3 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="Preferred Materials & Finishes"
                  field="materials"
                  options={materials}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <TextArea
                  label="Material / Finish Notes"
                  value={form.materialNotes}
                  onChange={(value) =>
                    updateField(
                      "materialNotes",
                      value
                    )
                  }
                  placeholder="Tell us about specific materials, finishes, brands or combinations you would like..."
                />
              </div>
            )}

            {currentSection === 4 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="Furniture Requirements"
                  field="furniture"
                  options={furniture}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <MultiSelectGroup
                  title="Storage & Joinery Requirements"
                  field="storage"
                  options={storage}
                  form={form}
                  onToggle={toggleMultiSelect}
                />
              </div>
            )}

            {currentSection === 5 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="Kitchen Requirements"
                  field="kitchen"
                  options={kitchen}
                  form={form}
                  onToggle={toggleMultiSelect}
                />
              </div>
            )}

            {currentSection === 6 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="Bathroom Requirements"
                  field="bathrooms"
                  options={bathrooms}
                  form={form}
                  onToggle={toggleMultiSelect}
                />
              </div>
            )}

            {currentSection === 7 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="Lighting Requirements"
                  field="lighting"
                  options={lighting}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <MultiSelectGroup
                  title="Technology & Smart Home"
                  field="technology"
                  options={technology}
                  form={form}
                  onToggle={toggleMultiSelect}
                />
              </div>
            )}

            {currentSection === 8 && (
              <div className="space-y-10">
                <MultiSelectGroup
                  title="What matters most?"
                  description="Select all priorities that are important to you."
                  field="priorities"
                  options={priorities}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <MultiSelectGroup
                  title="What would you prefer to avoid?"
                  description="Select any design directions or features you do not want."
                  field="avoid"
                  options={avoid}
                  form={form}
                  onToggle={toggleMultiSelect}
                />

                <TextArea
                  label="Anything else you want us to avoid?"
                  value={form.avoidNotes}
                  onChange={(value) =>
                    updateField(
                      "avoidNotes",
                      value
                    )
                  }
                  placeholder="Tell us about anything you definitely do not want in the design..."
                  rows={4}
                />
              </div>
            )}

            {currentSection === 9 && (
              <div className="space-y-10">
                <SingleSelectGroup
                  title="Project Timeline"
                  description="Select the timeline that best matches your expectations."
                  field="timeline"
                  options={timelines}
                  value={form.timeline}
                  onSelect={selectSingle}
                />

                <TextArea
                  label="Must-Haves"
                  value={form.mustHaves}
                  onChange={(value) =>
                    updateField(
                      "mustHaves",
                      value
                    )
                  }
                  placeholder="What are the features, functions or design elements that absolutely must be included?"
                  rows={6}
                />

                <TextArea
                  label="Additional Requirements"
                  value={
                    form.additionalNotes
                  }
                  onChange={(value) =>
                    updateField(
                      "additionalNotes",
                      value
                    )
                  }
                  placeholder="Anything else our design team should know about your project?"
                  rows={6}
                />
              </div>
            )}

            {currentSection === 10 && (
              <div className="space-y-10">
                <div>
                  <h3 className="text-base font-semibold">
                    Reference Images
                  </h3>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-black/50">
                    Upload images that communicate your preferred
                    style, materials, layouts, colours, furniture or
                    specific design ideas.
                  </p>
                </div>

                <div className="rounded-3xl border border-dashed border-black/15 bg-[#f7f7f5] p-6">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-10 text-center transition hover:border-black/20">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white"
                      style={{
                        backgroundColor: RED,
                      }}
                    >
                      +
                    </span>

                    <span className="mt-4 text-sm font-semibold">
                      Add reference images
                    </span>

                    <span className="mt-1 text-xs text-black/40">
                      JPG or PNG · Maximum 5MB each · Up to{" "}
                      {MAX_REFERENCE_IMAGES} images
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={
                        handleReferenceImages
                      }
                      className="hidden"
                    />
                  </label>

                  {referenceImages.length >
                    0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {referenceImages.map(
                        (file, index) => (
                          <div
                            key={`${file.name}-${file.lastModified}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {file.name}
                              </p>

                              <p className="mt-1 text-xs text-black/40">
                                {(
                                  file.size /
                                  (1024 *
                                    1024)
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
                              className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium transition hover:border-black/25"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-black/10 bg-[#f7f7f5] p-5">
                  <label className="flex cursor-pointer gap-4">
                    <input
                      type="checkbox"
                      checked={
                        form.confirmation
                      }
                      onChange={(event) =>
                        updateField(
                          "confirmation",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-5 w-5 shrink-0 accent-[#910B0A]"
                    />

                    <span>
                      <span className="block text-sm font-semibold">
                        I confirm that the information provided is
                        accurate.
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-black/45">
                        I understand that this brief
                        will be used by KBX Spatial
                        Atelier as a basis for
                        developing my interior design
                        proposal.
                      </span>
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {error &&
              currentSection !== 10 && (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

            {/* NAVIGATION */}
            <div className="mt-10 border-t border-black/10 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={currentSection === 0}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                    currentSection === 0
                      ? "cursor-not-allowed text-black/20"
                      : "border border-black/10 text-black hover:border-black/25"
                  }`}
                >
                  ← Previous
                </button>

                {currentSection <
                sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{
                      backgroundColor: RED,
                    }}
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className="rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: RED,
                    }}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Full Interior Brief"}
                  </button>
                )}
              </div>

              {/* ORIGINAL 1–11 DIRECT STEP NAVIGATION */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {sections.map(
                  (section, index) => {
                    const active =
                      currentSection ===
                      index;

                    const completed =
                      index <
                      currentSection;

                    return (
                      <button
                        key={
                          section.number
                        }
                        type="button"
                        onClick={() =>
                          goToSection(
                            index
                          )
                        }
                        aria-label={`Go to step ${
                          index + 1
                        }: ${
                          section.title
                        }`}
                        aria-current={
                          active
                            ? "step"
                            : undefined
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                          active
                            ? "bg-[#910B0A] text-white shadow-sm"
                            : completed
                            ? "border border-[#910B0A]/30 bg-[#910B0A]/5 text-[#910B0A] hover:bg-[#910B0A]/10"
                            : "border border-black/10 bg-white text-black/45 hover:border-[#910B0A]/40 hover:text-[#910B0A]"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  }
                )}
              </div>

              <p className="mt-3 text-center text-[11px] text-black/35">
                Click any number to move directly to
                that section.
              </p>
            </div>
          </div>
        </form>
      </div>

      <footer className="mt-8 border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="relative h-[48px] w-[100px] shrink-0 sm:h-[52px] sm:w-[105px]">
            <Image
              src="/kbx-logo.svg"
              alt="KBX Spatial Atelier"
              fill
              sizes="105px"
              className="object-contain object-left"
            />
          </div>

          <div className="text-left text-xs leading-5 text-black/40 sm:text-right">
            <p>
              © {new Date().getFullYear()} KBX Spatial Atelier.
            </p>

            <p>
              Interior Design · Spatial Design · Bespoke Joinery
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}