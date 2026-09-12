"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

const RED = "#910B0A";

const CLIENT_ACCOUNTS_KEY = "kbxClientAccounts";
const CURRENT_CLIENT_KEY = "kbxCurrentClientId";
const LEGACY_CLIENT_KEY = "kbxClient";

const WARDROBE_BRIEF_KEY = "kbxWardrobeBrief";

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  createdAt?: string;
};

type WardrobeForm = {
  projectName: string;
  clientName: string;
  projectLocation: string;

  designer: string;
  communicationPerson: string;

  designGoal: string;
  mainRequirements: string;

  designStyles: string[];
  designStyleOther: string;

  referenceImagesAvailable: string;

  wardrobeType: string[];
  wardrobeTypeOther: string;

  wardrobeLocation: string;
  wardrobeWallLength: string;
  wardrobeHeight: string;
  wardrobeDepth: string;

  wardrobeConfiguration: string[];
  wardrobeConfigurationOther: string;

  doorStyle: string[];
  doorStyleOther: string;

  doorOperation: string;
  doorCount: string;

  cabinetFinish: string;
  cabinetColour: string;
  internalFinish: string;

  mirrorDoors: string;
  mirrorLocations: string[];
  mirrorOther: string;

  glassDoors: string;
  glassDoorLocations: string[];
  glassDoorOther: string;

  ledLights: string;
  ledLocations: string[];
  ledOther: string;

  handles: string;
  handleStyle: string;
  handleOther: string;

  handlelessProfile: string;

  hangingRequirements: string[];
  hangingOther: string;

  hangingRailLevels: string[];
  hangingRailOther: string;

  drawerRequirements: string[];
  drawerOther: string;
  drawerCount: string;

  shelvingRequirements: string[];
  shelvingOther: string;

  shoeStorage: string;
  shoeStorageType: string[];
  shoeStorageOther: string;

  handbagStorage: string;
  handbagStorageDetails: string;

  tieBeltStorage: string;
  tieBeltStorageType: string[];

  trouserStorage: string;
  trouserStorageType: string[];

  jewelleryStorage: string;
  jewelleryStorageType: string;

  laundryBasket: string;
  laundryBasketType: string;

  ironingBoard: string;
  ironingBoardType: string;

  safeStorage: string;
  safeDetails: string;

  dressingTable: string;
  dressingTableRequirements: string;

  seating: string;
  seatingType: string;

  tvIntegration: string;
  tvSize: string;

  openSections: string;
  openSectionDetails: string;

  loftStorage: string;
  loftAccess: string[];

  functionalRequirements: string[];
  functionalOther: string;
  specificFunctionalRequests: string;

  doNotWant: string[];
  doNotWantMaterials: string;
  doNotWantPositions: string;
  specificDoNotWantInstructions: string;

  additionalNotes: string;

  informationChecked: boolean;
  readyForDesign: boolean;
  clientRequirementsConfirmed: boolean;

  clientSignature: string;
  confirmationDate: string;
};

type SavedBrief = {
  client?: ClientAccount;
  form: WardrobeForm;
  completed?: boolean;
  submitted?: boolean;
  completedAt?: string;
  savedAt?: string;
};

const initialForm: WardrobeForm = {
  projectName: "",
  clientName: "",
  projectLocation: "",

  designer: "",
  communicationPerson: "",

  designGoal: "",
  mainRequirements: "",

  designStyles: [],
  designStyleOther: "",

  referenceImagesAvailable: "",

  wardrobeType: [],
  wardrobeTypeOther: "",

  wardrobeLocation: "",
  wardrobeWallLength: "",
  wardrobeHeight: "",
  wardrobeDepth: "",

  wardrobeConfiguration: [],
  wardrobeConfigurationOther: "",

  doorStyle: [],
  doorStyleOther: "",

  doorOperation: "",
  doorCount: "",

  cabinetFinish: "",
  cabinetColour: "",
  internalFinish: "",

  mirrorDoors: "",
  mirrorLocations: [],
  mirrorOther: "",

  glassDoors: "",
  glassDoorLocations: [],
  glassDoorOther: "",

  ledLights: "",
  ledLocations: [],
  ledOther: "",

  handles: "",
  handleStyle: "",
  handleOther: "",

  handlelessProfile: "",

  hangingRequirements: [],
  hangingOther: "",

  hangingRailLevels: [],
  hangingRailOther: "",

  drawerRequirements: [],
  drawerOther: "",
  drawerCount: "",

  shelvingRequirements: [],
  shelvingOther: "",

  shoeStorage: "",
  shoeStorageType: [],
  shoeStorageOther: "",

  handbagStorage: "",
  handbagStorageDetails: "",

  tieBeltStorage: "",
  tieBeltStorageType: [],

  trouserStorage: "",
  trouserStorageType: [],

  jewelleryStorage: "",
  jewelleryStorageType: "",

  laundryBasket: "",
  laundryBasketType: "",

  ironingBoard: "",
  ironingBoardType: "",

  safeStorage: "",
  safeDetails: "",

  dressingTable: "",
  dressingTableRequirements: "",

  seating: "",
  seatingType: "",

  tvIntegration: "",
  tvSize: "",

  openSections: "",
  openSectionDetails: "",

  loftStorage: "",
  loftAccess: [],

  functionalRequirements: [],
  functionalOther: "",
  specificFunctionalRequests: "",

  doNotWant: [],
  doNotWantMaterials: "",
  doNotWantPositions: "",
  specificDoNotWantInstructions: "",

  additionalNotes: "",

  informationChecked: false,
  readyForDesign: false,
  clientRequirementsConfirmed: false,

  clientSignature: "",
  confirmationDate: "",
};

function getStoredClient(): ClientAccount | null {
  try {
    const accountsRaw = localStorage.getItem(
      CLIENT_ACCOUNTS_KEY
    );

    const currentId = localStorage.getItem(
      CURRENT_CLIENT_KEY
    );

    if (accountsRaw) {
      const accounts = JSON.parse(accountsRaw);

      if (Array.isArray(accounts) && currentId) {
        const currentClient = accounts.find(
          (account: ClientAccount) =>
            account.id === currentId
        );

        if (currentClient) {
          return currentClient;
        }
      }
    }

    const legacyClient = localStorage.getItem(
      LEGACY_CLIENT_KEY
    );

    if (legacyClient) {
      const parsed = JSON.parse(legacyClient);

      if (parsed?.name || parsed?.email) {
        return {
          id: parsed.id || currentId || "",
          name: parsed.name || "",
          email: parsed.email || "",
          contact: parsed.contact || "",
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getSavedBrief(): SavedBrief | null {
  try {
    const saved = localStorage.getItem(
      WARDROBE_BRIEF_KEY
    );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function CheckboxGroup({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  function toggle(value: string) {
    const next = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];

    onChange(next);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const selected = values.includes(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            aria-pressed={selected}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              selected
                ? "border-[#910B0A] bg-[#910B0A] text-white"
                : "border-black/10 bg-white text-black/70 hover:border-black/25"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{option}</span>

              {selected && (
                <span className="text-sm font-bold">
                  ✓
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={selected}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              selected
                ? "border-[#910B0A] bg-[#910B0A] text-white"
                : "border-black/10 bg-white text-black/70 hover:border-black/25"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{option}</span>

              {selected && (
                <span className="text-sm font-bold">
                  ✓
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
        {label}{" "}
        {required && (
          <span style={{ color: RED }}>
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-black/25 focus:border-[#910B0A]/50"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
          {label}{" "}
          {required && (
            <span style={{ color: RED }}>
              *
            </span>
          )}
        </label>
      )}

      <textarea
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={5}
        className="w-full resize-y rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-black/25 focus:border-[#910B0A]/50"
      />
    </div>
  );
}

function SectionHeader({
  number,
  title,
  description,
  required = false,
}: {
  number: string;
  title: string;
  description?: string;
  required?: boolean;
}) {
  return (
    <div className="border-b border-black/10 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: RED }}
          >
            Section {number}
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h2>
        </div>

        {required && (
          <span
            className="rounded-full bg-[#910B0A]/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: RED }}
          >
            Required
          </span>
        )}
      </div>

      {description && (
        <p className="mt-4 max-w-3xl text-sm leading-6 text-black/45">
          {description}
        </p>
      )}
    </div>
  );
}

function Question({
  number,
  title,
  description,
  children,
  required = false,
}: {
  number?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#fafaf8] p-5 md:p-6">
      <div className="flex items-start gap-4">
        {number && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: RED }}
          >
            {number}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold md:text-base">
            {title}{" "}
            {required && (
              <span style={{ color: RED }}>
                *
              </span>
            )}
          </h3>

          {description && (
            <p className="mt-1.5 text-xs leading-5 text-black/40">
              {description}
            </p>
          )}

          <div className="mt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WardrobeBriefPage() {
  const [client, setClient] =
    useState<ClientAccount | null>(null);

  const [form, setForm] =
    useState<WardrobeForm>(initialForm);

  const [referenceImages, setReferenceImages] =
    useState<File[]>([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [submitMessage, setSubmitMessage] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");

  useEffect(() => {
    const loadedClient = getStoredClient();

    if (loadedClient) {
      setClient(loadedClient);

      setForm((current) => ({
        ...current,
        clientName:
          loadedClient.name ||
          current.clientName,
      }));
    }

    const savedBrief = getSavedBrief();

    if (savedBrief?.form) {
      setForm((current) => ({
        ...current,
        ...savedBrief.form,
      }));
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    setIsSaving(true);

    const timer = window.setTimeout(() => {
      try {
        const savedBrief: SavedBrief = {
          client: client || undefined,
          form,
          completed: false,
          submitted: false,
          savedAt:
            new Date().toISOString(),
        };

        localStorage.setItem(
          WARDROBE_BRIEF_KEY,
          JSON.stringify(savedBrief)
        );

        setSaveMessage(
          "Saved automatically"
        );

        window.setTimeout(() => {
          setSaveMessage("");
        }, 1800);
      } catch {
        setSaveMessage(
          "Unable to save"
        );
      }

      setIsSaving(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, client, isLoaded]);

  function updateField<K extends keyof WardrobeForm>(
    field: K,
    value: WardrobeForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleReferenceImages(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    setReferenceImages(files);
  }

  const selectedReferenceCount =
    referenceImages.length;

  const sectionIds = [
    "wardrobe-section-1",
    "wardrobe-section-2",
    "wardrobe-section-3",
    "wardrobe-section-4",
    "wardrobe-section-5",
    "wardrobe-section-6",
    "wardrobe-section-7",
    "wardrobe-section-8",
    "wardrobe-section-9",
    "wardrobe-section-10",
    "wardrobe-section-11",
  ];

  function scrollToSection(index: number) {
    const element =
      document.getElementById(
        sectionIds[index]
      );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const requiredInformationComplete =
    useMemo(() => {
      return (
        form.projectName.trim() !== "" &&
        form.clientName.trim() !== "" &&
        form.projectLocation.trim() !== "" &&
        form.designGoal.trim() !== "" &&
        form.mainRequirements.trim() !== "" &&
        form.wardrobeType.length > 0 &&
        form.wardrobeLocation.trim() !== "" &&
        form.informationChecked &&
        form.clientRequirementsConfirmed
      );
    }, [form]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitError("");
    setSubmitMessage("");

    if (!requiredInformationComplete) {
      setSubmitError(
        "Please complete all required information and confirmations before submitting the brief."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const briefData = {
        client,
        form,
        completed: true,
        submitted: true,
        completedAt:
          new Date().toISOString(),
        referenceImages:
          referenceImages.map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
      };

      const formData =
        new FormData();

      formData.append(
        "briefType",
        "wardrobe"
      );

      formData.append(
        "briefData",
        JSON.stringify(briefData)
      );

      referenceImages.forEach((file) => {
        formData.append(
          "referenceImages",
          file
        );
      });

      const response = await fetch(
        "/api/send-brief",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Unable to submit the wardrobe brief."
        );
      }

      const completedBrief: SavedBrief = {
        client:
          client || undefined,
        form,
        completed: true,
        submitted: true,
        completedAt:
          new Date().toISOString(),
        savedAt:
          new Date().toISOString(),
      };

      localStorage.setItem(
        WARDROBE_BRIEF_KEY,
        JSON.stringify(
          completedBrief
        )
      );

      setSubmitMessage(
        "Your Wardrobes & Closets Brief has been submitted successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your brief."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-sm text-black/40">
          Loading your brief...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">

      {/* HEADER */}

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
                Wardrobes & Closets Brief
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium">
                {client?.name ||
                  form.clientName ||
                  "Client"}
              </p>

              <p className="mt-1 text-[10px] text-black/40">
                {isSaving
                  ? "Saving..."
                  : saveMessage ||
                    "Auto-save enabled"}
              </p>
            </div>

            <Link
              href="/client-brief-project-type"
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black/30"
            >
              ← Back
            </Link>

          </div>
        </div>
      </header>

      {/* INTRO */}

      <section className="px-5 pb-10 pt-12 md:px-8 md:pb-14 md:pt-20">
        <div className="mx-auto max-w-[1000px]">

          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: RED }}
          >
            Wardrobes & Closets
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            Tell us exactly how
            <br />
            your wardrobe should work.
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-black/45 md:text-base">
            This brief helps KBX understand your storage requirements before
            design begins. The information you provide will guide spatial
            planning, wardrobe configuration, internal organisation, materials,
            doors, accessories and functionality.
          </p>

          <div className="mt-8 rounded-2xl border border-[#910B0A]/15 bg-[#910B0A]/5 p-5">
            <p className="text-sm font-semibold">
              Why this brief is important
            </p>

            <p className="mt-2 text-sm leading-6 text-black/55">
              A wardrobe should be designed around the available space,
              clothing requirements, storage habits and the way the client
              intends to use it. Accurate information at this stage helps
              reduce redesign, unsuitable storage, incorrect dimensions and
              unnecessary changes during fabrication and installation.
            </p>
          </div>

          {submitMessage && (
            <div className="mt-6 rounded-2xl border border-green-600/20 bg-green-50 p-5 text-sm text-green-800">
              {submitMessage}
            </div>
          )}

          {submitError && (
            <div className="mt-6 rounded-2xl border border-red-600/20 bg-red-50 p-5 text-sm text-red-800">
              {submitError}
            </div>
          )}

        </div>
      </section>

      {/* SECTION NAVIGATION */}

      <div className="px-5 pb-10 md:px-8">
        <div className="mx-auto max-w-[1000px]">
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-2">

              {sectionIds.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    scrollToSection(index)
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-semibold transition hover:border-[#910B0A] hover:text-[#910B0A]"
                  aria-label={`Go to section ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}

            </div>
          </div>
        </div>
      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="px-5 pb-20 md:px-8"
      >
        <div className="mx-auto max-w-[1000px] space-y-8">

          {/* SECTION A */}

          <section
            id="wardrobe-section-1"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="A"
              title="Project Information"
              description="Basic project information allows KBX to correctly identify the wardrobe project and the people responsible for it."
              required
            />

            <div className="mt-8 grid gap-5 md:grid-cols-2">

              <TextInput
                label="Project Name"
                value={form.projectName}
                onChange={(value) =>
                  updateField(
                    "projectName",
                    value
                  )
                }
                required
                placeholder="e.g. Otoo Residence Master Wardrobe"
              />

              <TextInput
                label="Client Name"
                value={form.clientName}
                onChange={(value) =>
                  updateField(
                    "clientName",
                    value
                  )
                }
                required
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
                required
                placeholder="City / Area / Address"
              />

              <TextInput
                label="Designer"
                value={form.designer}
                onChange={(value) =>
                  updateField(
                    "designer",
                    value
                  )
                }
                placeholder="KBX designer"
              />

              <TextInput
                label="Person Responsible for Client Communication"
                value={
                  form.communicationPerson
                }
                onChange={(value) =>
                  updateField(
                    "communicationPerson",
                    value
                  )
                }
              />

            </div>
          </section>

          {/* SECTION B */}

          <section
            id="wardrobe-section-2"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="B"
              title="Client Requirements"
              description="This section establishes the client's overall expectations before detailed wardrobe decisions are made."
              required
            />

            <div className="mt-8 space-y-5">

              <Question
                number="01"
                title="What does the client want to achieve?"
                description="Describe the overall outcome the client expects from the wardrobe."
                required
              >
                <TextArea
                  label=""
                  value={form.designGoal}
                  onChange={(value) =>
                    updateField(
                      "designGoal",
                      value
                    )
                  }
                  required
                  placeholder="Example: Create a luxurious, highly organised wardrobe with generous hanging space, drawers and dedicated shoe storage."
                />
              </Question>

              <Question
                number="02"
                title="Describe the client's main requirements"
                required
              >
                <TextArea
                  label=""
                  value={
                    form.mainRequirements
                  }
                  onChange={(value) =>
                    updateField(
                      "mainRequirements",
                      value
                    )
                  }
                  required
                  placeholder="List the client's most important wardrobe requirements."
                />
              </Question>

              <Question
                number="03"
                title="Preferred design style"
              >
                <CheckboxGroup
                  options={[
                    "Modern",
                    "Contemporary",
                    "Minimalist",
                    "Luxury",
                    "Classic",
                    "Industrial",
                    "Traditional",
                    "Hotel-inspired",
                    "Other",
                  ]}
                  values={
                    form.designStyles
                  }
                  onChange={(values) =>
                    updateField(
                      "designStyles",
                      values
                    )
                  }
                />
              </Question>

              {form.designStyles.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Design Style"
                  value={
                    form.designStyleOther
                  }
                  onChange={(value) =>
                    updateField(
                      "designStyleOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="04"
                title="Are client reference images available?"
                description="Reference images help KBX understand the client's preferred wardrobe appearance, materials, colours and details."
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.referenceImagesAvailable
                  }
                  onChange={(value) =>
                    updateField(
                      "referenceImagesAvailable",
                      value
                    )
                  }
                />
              </Question>

              {form.referenceImagesAvailable ===
                "Yes" && (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf8] p-5">

                  <p className="text-sm font-semibold">
                    Attach reference images
                  </p>

                  <p className="mt-1 text-xs leading-5 text-black/40">
                    Upload images that represent the client's preferred
                    wardrobes, colours, finishes, doors, handles, internal
                    layouts or details.
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={
                      handleReferenceImages
                    }
                    className="mt-4 block w-full text-sm"
                  />

                  {selectedReferenceCount >
                    0 && (
                    <p
                      className="mt-3 text-xs font-medium"
                      style={{
                        color: RED,
                      }}
                    >
                      {
                        selectedReferenceCount
                      }{" "}
                      reference image
                      {selectedReferenceCount ===
                      1
                        ? ""
                        : "s"}{" "}
                      selected.
                    </p>
                  )}

                </div>
              )}

            </div>
          </section>

          {/* SECTION C */}

          <section
            id="wardrobe-section-3"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="C"
              title="Wardrobe Type & Space"
              description="The wardrobe type, location and available dimensions establish the physical basis for the design."
              required
            />

            <div className="mt-8 space-y-5">

              <Question
                number="05"
                title="What type of wardrobe does the client require?"
                required
              >
                <CheckboxGroup
                  options={[
                    "Built-in wardrobe",
                    "Walk-in wardrobe",
                    "Freestanding wardrobe",
                    "Full-height wardrobe",
                    "Wall-to-wall wardrobe",
                    "Corner wardrobe",
                    "Other",
                  ]}
                  values={
                    form.wardrobeType
                  }
                  onChange={(values) =>
                    updateField(
                      "wardrobeType",
                      values
                    )
                  }
                />
              </Question>

              {form.wardrobeType.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Wardrobe Type"
                  value={
                    form.wardrobeTypeOther
                  }
                  onChange={(value) =>
                    updateField(
                      "wardrobeTypeOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="06"
                title="Where will the wardrobe be installed?"
                required
              >
                <TextArea
                  label=""
                  value={
                    form.wardrobeLocation
                  }
                  onChange={(value) =>
                    updateField(
                      "wardrobeLocation",
                      value
                    )
                  }
                  required
                  placeholder="Example: Master bedroom, north wall beside the entrance."
                />
              </Question>

              <div className="grid gap-5 md:grid-cols-3">

                <TextInput
                  label="Available Wall Length (cm)"
                  value={
                    form.wardrobeWallLength
                  }
                  onChange={(value) =>
                    updateField(
                      "wardrobeWallLength",
                      value
                    )
                  }
                  type="number"
                  placeholder="If known"
                />

                <TextInput
                  label="Available Height (cm)"
                  value={
                    form.wardrobeHeight
                  }
                  onChange={(value) =>
                    updateField(
                      "wardrobeHeight",
                      value
                    )
                  }
                  type="number"
                  placeholder="If known"
                />

                <TextInput
                  label="Available Depth (cm)"
                  value={
                    form.wardrobeDepth
                  }
                  onChange={(value) =>
                    updateField(
                      "wardrobeDepth",
                      value
                    )
                  }
                  type="number"
                  placeholder="If known"
                />

              </div>

              <Question
                number="07"
                title="Preferred wardrobe configuration"
              >
                <CheckboxGroup
                  options={[
                    "Single wall",
                    "L-shaped",
                    "U-shaped",
                    "Corner",
                    "Wall-to-wall",
                    "Floor-to-ceiling",
                    "Other",
                  ]}
                  values={
                    form.wardrobeConfiguration
                  }
                  onChange={(values) =>
                    updateField(
                      "wardrobeConfiguration",
                      values
                    )
                  }
                />
              </Question>

              {form.wardrobeConfiguration.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Wardrobe Configuration"
                  value={
                    form.wardrobeConfigurationOther
                  }
                  onChange={(value) =>
                    updateField(
                      "wardrobeConfigurationOther",
                      value
                    )
                  }
                />
              )}

            </div>
          </section>

          {/* SECTION D */}

          <section
            id="wardrobe-section-4"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="D"
              title="Wardrobe Exterior"
              description="Exterior decisions determine the visual character of the wardrobe and affect door construction, hardware and finishing."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="08"
                title="Preferred wardrobe door style"
              >
                <CheckboxGroup
                  options={[
                    "Slab doors",
                    "Framed doors",
                    "Shaker style",
                    "Fluted doors",
                    "Glass doors",
                    "Mirror doors",
                    "Combination",
                    "Other",
                  ]}
                  values={
                    form.doorStyle
                  }
                  onChange={(values) =>
                    updateField(
                      "doorStyle",
                      values
                    )
                  }
                />
              </Question>

              {form.doorStyle.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Door Style"
                  value={
                    form.doorStyleOther
                  }
                  onChange={(value) =>
                    updateField(
                      "doorStyleOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="09"
                title="How should the wardrobe doors operate?"
              >
                <RadioGroup
                  options={[
                    "Hinged",
                    "Sliding",
                    "Combination",
                    "Not decided",
                  ]}
                  value={
                    form.doorOperation
                  }
                  onChange={(value) =>
                    updateField(
                      "doorOperation",
                      value
                    )
                  }
                />
              </Question>

              <TextInput
                label="Approximate Number of Door Panels"
                value={
                  form.doorCount
                }
                onChange={(value) =>
                  updateField(
                    "doorCount",
                    value
                  )
                }
                type="number"
                placeholder="If known"
              />

              <div className="grid gap-5 md:grid-cols-3">

                <TextInput
                  label="Cabinet Finish"
                  value={
                    form.cabinetFinish
                  }
                  onChange={(value) =>
                    updateField(
                      "cabinetFinish",
                      value
                    )
                  }
                  placeholder="e.g. Matte, satin, veneer"
                />

                <TextInput
                  label="Preferred Colour"
                  value={
                    form.cabinetColour
                  }
                  onChange={(value) =>
                    updateField(
                      "cabinetColour",
                      value
                    )
                  }
                  placeholder="e.g. Black, walnut"
                />

                <TextInput
                  label="Internal Finish"
                  value={
                    form.internalFinish
                  }
                  onChange={(value) =>
                    updateField(
                      "internalFinish",
                      value
                    )
                  }
                  placeholder="e.g. White, matching exterior"
                />

              </div>

              <Question
                number="10"
                title="Does the client want handles?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                    "Not decided",
                  ]}
                  value={
                    form.handles
                  }
                  onChange={(value) =>
                    updateField(
                      "handles",
                      value
                    )
                  }
                />
              </Question>

              {form.handles ===
                "Yes" && (
                <div className="grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Preferred Handle Style"
                    value={
                      form.handleStyle
                    }
                    onChange={(value) =>
                      updateField(
                        "handleStyle",
                        value
                      )
                    }
                    placeholder="e.g. Slim black profile, brass knob"
                  />

                  <TextInput
                    label="Other Handle Requirement"
                    value={
                      form.handleOther
                    }
                    onChange={(value) =>
                      updateField(
                        "handleOther",
                        value
                      )
                    }
                  />

                </div>
              )}

              {form.handles ===
                "No" && (
                <TextInput
                  label="Preferred Handle-less / Gola Profile"
                  value={
                    form.handlelessProfile
                  }
                  onChange={(value) =>
                    updateField(
                      "handlelessProfile",
                      value
                    )
                  }
                  placeholder="e.g. Black Gola profile, integrated finger pull"
                />
              )}

            </div>
          </section>

          {/* SECTION E */}

          <section
            id="wardrobe-section-5"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="E"
              title="Glass, Mirrors & Lighting"
              description="These features affect door selection, electrical coordination, internal visibility and the overall appearance of the wardrobe."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="11"
                title="Does the client want mirror doors?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.mirrorDoors
                  }
                  onChange={(value) =>
                    updateField(
                      "mirrorDoors",
                      value
                    )
                  }
                />
              </Question>

              {form.mirrorDoors ===
                "Yes" && (
                <Question title="Where should mirrors be used?">
                  <CheckboxGroup
                    options={[
                      "Full wardrobe doors",
                      "Selected door panels",
                      "Inside doors",
                      "Dressing area",
                      "Other",
                    ]}
                    values={
                      form.mirrorLocations
                    }
                    onChange={(values) =>
                      updateField(
                        "mirrorLocations",
                        values
                      )
                    }
                  />
                </Question>
              )}

              {form.mirrorLocations.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Mirror Location"
                  value={
                    form.mirrorOther
                  }
                  onChange={(value) =>
                    updateField(
                      "mirrorOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="12"
                title="Does the client want glass doors?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.glassDoors
                  }
                  onChange={(value) =>
                    updateField(
                      "glassDoors",
                      value
                    )
                  }
                />
              </Question>

              {form.glassDoors ===
                "Yes" && (
                <>
                  <Question title="Where should glass doors be used?">
                    <CheckboxGroup
                      options={[
                        "Display sections",
                        "Accessory sections",
                        "Hanging sections",
                        "Selected door panels",
                        "Other",
                      ]}
                      values={
                        form.glassDoorLocations
                      }
                      onChange={(values) =>
                        updateField(
                          "glassDoorLocations",
                          values
                        )
                      }
                    />
                  </Question>

                  {form.glassDoorLocations.includes(
                    "Other"
                  ) && (
                    <TextInput
                      label="Other Glass Door Location"
                      value={
                        form.glassDoorOther
                      }
                      onChange={(value) =>
                        updateField(
                          "glassDoorOther",
                          value
                        )
                      }
                    />
                  )}
                </>
              )}

              <Question
                number="13"
                title="Does the client want LED lighting?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.ledLights
                  }
                  onChange={(value) =>
                    updateField(
                      "ledLights",
                      value
                    )
                  }
                />
              </Question>

              {form.ledLights ===
                "Yes" && (
                <>
                  <Question title="Where should LED lighting be installed?">
                    <CheckboxGroup
                      options={[
                        "Inside wardrobe",
                        "Inside hanging sections",
                        "Inside glass sections",
                        "Under shelves",
                        "Inside drawers",
                        "Above wardrobe",
                        "Around mirrors",
                        "Other",
                      ]}
                      values={
                        form.ledLocations
                      }
                      onChange={(values) =>
                        updateField(
                          "ledLocations",
                          values
                        )
                      }
                    />
                  </Question>

                  {form.ledLocations.includes(
                    "Other"
                  ) && (
                    <TextInput
                      label="Other LED Location"
                      value={
                        form.ledOther
                      }
                      onChange={(value) =>
                        updateField(
                          "ledOther",
                          value
                        )
                      }
                    />
                  )}
                </>
              )}

            </div>
          </section>

          {/* SECTION F */}

          <section
            id="wardrobe-section-6"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="F"
              title="Clothing & Hanging Storage"
              description="The internal wardrobe layout should reflect the client's actual clothing types and storage habits."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="14"
                title="What hanging storage is required?"
              >
                <CheckboxGroup
                  options={[
                    "Long hanging",
                    "Short hanging",
                    "Double hanging",
                    "Shirts",
                    "Trousers",
                    "Dresses",
                    "Suits",
                    "Jackets",
                    "Traditional clothing",
                    "Other",
                  ]}
                  values={
                    form.hangingRequirements
                  }
                  onChange={(values) =>
                    updateField(
                      "hangingRequirements",
                      values
                    )
                  }
                />
              </Question>

              {form.hangingRequirements.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Hanging Requirement"
                  value={
                    form.hangingOther
                  }
                  onChange={(value) =>
                    updateField(
                      "hangingOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="15"
                title="Preferred hanging rail arrangement"
              >
                <CheckboxGroup
                  options={[
                    "Single rail",
                    "Double rail",
                    "Multiple levels",
                    "Pull-down rail",
                    "LED-lit rail",
                    "Other",
                  ]}
                  values={
                    form.hangingRailLevels
                  }
                  onChange={(values) =>
                    updateField(
                      "hangingRailLevels",
                      values
                    )
                  }
                />
              </Question>

              {form.hangingRailLevels.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Hanging Rail Requirement"
                  value={
                    form.hangingRailOther
                  }
                  onChange={(value) =>
                    updateField(
                      "hangingRailOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="16"
                title="What drawer storage is required?"
              >
                <CheckboxGroup
                  options={[
                    "General clothing drawers",
                    "Underwear drawers",
                    "Small accessories",
                    "Jewellery",
                    "Watch storage",
                    "Soft-close drawers",
                    "Lockable drawers",
                    "Other",
                  ]}
                  values={
                    form.drawerRequirements
                  }
                  onChange={(values) =>
                    updateField(
                      "drawerRequirements",
                      values
                    )
                  }
                />
              </Question>

              {form.drawerRequirements.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Drawer Requirement"
                  value={
                    form.drawerOther
                  }
                  onChange={(value) =>
                    updateField(
                      "drawerOther",
                      value
                    )
                  }
                />
              )}

              <TextInput
                label="Approximate Number of Drawers"
                value={
                  form.drawerCount
                }
                onChange={(value) =>
                  updateField(
                    "drawerCount",
                    value
                  )
                }
                type="number"
                placeholder="If known"
              />

              <Question
                number="17"
                title="What shelving is required?"
              >
                <CheckboxGroup
                  options={[
                    "Adjustable shelves",
                    "Fixed shelves",
                    "Folded clothing shelves",
                    "Bag shelves",
                    "Display shelves",
                    "Open shelves",
                    "Other",
                  ]}
                  values={
                    form.shelvingRequirements
                  }
                  onChange={(values) =>
                    updateField(
                      "shelvingRequirements",
                      values
                    )
                  }
                />
              </Question>

              {form.shelvingRequirements.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Shelving Requirement"
                  value={
                    form.shelvingOther
                  }
                  onChange={(value) =>
                    updateField(
                      "shelvingOther",
                      value
                    )
                  }
                />
              )}

            </div>
          </section>

          {/* SECTION G */}

          <section
            id="wardrobe-section-7"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="G"
              title="Accessories & Special Storage"
              description="Dedicated storage accessories can significantly improve wardrobe organisation and usability."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="18"
                title="Does the client require dedicated shoe storage?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.shoeStorage
                  }
                  onChange={(value) =>
                    updateField(
                      "shoeStorage",
                      value
                    )
                  }
                />
              </Question>

              {form.shoeStorage ===
                "Yes" && (
                <Question title="Preferred shoe storage type">
                  <CheckboxGroup
                    options={[
                      "Adjustable shelves",
                      "Pull-out shoe racks",
                      "Tilt-out shoe storage",
                      "Open shoe display",
                      "Closed shoe storage",
                      "Other",
                    ]}
                    values={
                      form.shoeStorageType
                    }
                    onChange={(values) =>
                      updateField(
                        "shoeStorageType",
                        values
                      )
                    }
                  />
                </Question>
              )}

              {form.shoeStorageType.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Shoe Storage"
                  value={
                    form.shoeStorageOther
                  }
                  onChange={(value) =>
                    updateField(
                      "shoeStorageOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="19"
                title="Does the client require handbag storage?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.handbagStorage
                  }
                  onChange={(value) =>
                    updateField(
                      "handbagStorage",
                      value
                    )
                  }
                />
              </Question>

              {form.handbagStorage ===
                "Yes" && (
                <TextArea
                  label="Handbag Storage Requirements"
                  value={
                    form.handbagStorageDetails
                  }
                  onChange={(value) =>
                    updateField(
                      "handbagStorageDetails",
                      value
                    )
                  }
                  placeholder="Describe preferred handbag storage, display or compartments."
                />
              )}

              <Question
                number="20"
                title="Does the client require tie / belt storage?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.tieBeltStorage
                  }
                  onChange={(value) =>
                    updateField(
                      "tieBeltStorage",
                      value
                    )
                  }
                />
              </Question>

              {form.tieBeltStorage ===
                "Yes" && (
                <Question title="Preferred tie / belt storage">
                  <CheckboxGroup
                    options={[
                      "Pull-out rack",
                      "Drawer organiser",
                      "Dedicated compartment",
                      "Other",
                    ]}
                    values={
                      form.tieBeltStorageType
                    }
                    onChange={(values) =>
                      updateField(
                        "tieBeltStorageType",
                        values
                      )
                    }
                  />
                </Question>
              )}

              <Question
                number="21"
                title="Does the client require trouser storage?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.trouserStorage
                  }
                  onChange={(value) =>
                    updateField(
                      "trouserStorage",
                      value
                    )
                  }
                />
              </Question>

              {form.trouserStorage ===
                "Yes" && (
                <Question title="Preferred trouser storage">
                  <CheckboxGroup
                    options={[
                      "Pull-out trouser rack",
                      "Hanging rail",
                      "Drawer",
                      "Dedicated compartment",
                    ]}
                    values={
                      form.trouserStorageType
                    }
                    onChange={(values) =>
                      updateField(
                        "trouserStorageType",
                        values
                      )
                    }
                  />
                </Question>
              )}

              <Question
                number="22"
                title="Does the client require jewellery / watch storage?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.jewelleryStorage
                  }
                  onChange={(value) =>
                    updateField(
                      "jewelleryStorage",
                      value
                    )
                  }
                />
              </Question>

              {form.jewelleryStorage ===
                "Yes" && (
                <TextInput
                  label="Jewellery / Watch Storage Type"
                  value={
                    form.jewelleryStorageType
                  }
                  onChange={(value) =>
                    updateField(
                      "jewelleryStorageType",
                      value
                    )
                  }
                  placeholder="e.g. Velvet-lined drawers, watch winder"
                />
              )}

            </div>
          </section>

          {/* SECTION H */}

          <section
            id="wardrobe-section-8"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="H"
              title="Special Features"
              description="Additional features may affect internal planning, cabinet dimensions, electrical requirements and fabrication."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="23"
                title="Does the client require a built-in laundry basket?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.laundryBasket
                  }
                  onChange={(value) =>
                    updateField(
                      "laundryBasket",
                      value
                    )
                  }
                />
              </Question>

              {form.laundryBasket ===
                "Yes" && (
                <TextInput
                  label="Laundry Basket Type"
                  value={
                    form.laundryBasketType
                  }
                  onChange={(value) =>
                    updateField(
                      "laundryBasketType",
                      value
                    )
                  }
                  placeholder="e.g. Pull-out double basket"
                />
              )}

              <Question
                number="24"
                title="Does the client require an ironing board?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.ironingBoard
                  }
                  onChange={(value) =>
                    updateField(
                      "ironingBoard",
                      value
                    )
                  }
                />
              </Question>

              {form.ironingBoard ===
                "Yes" && (
                <TextInput
                  label="Ironing Board Type"
                  value={
                    form.ironingBoardType
                  }
                  onChange={(value) =>
                    updateField(
                      "ironingBoardType",
                      value
                    )
                  }
                  placeholder="e.g. Fold-down, pull-out"
                />
              )}

              <Question
                number="25"
                title="Does the client require a safe / secure storage compartment?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.safeStorage
                  }
                  onChange={(value) =>
                    updateField(
                      "safeStorage",
                      value
                    )
                  }
                />
              </Question>

              {form.safeStorage ===
                "Yes" && (
                <TextArea
                  label="Safe / Secure Storage Requirements"
                  value={
                    form.safeDetails
                  }
                  onChange={(value) =>
                    updateField(
                      "safeDetails",
                      value
                    )
                  }
                  placeholder="Describe the required secure storage."
                />
              )}

              <Question
                number="26"
                title="Does the client want a dressing table?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.dressingTable
                  }
                  onChange={(value) =>
                    updateField(
                      "dressingTable",
                      value
                    )
                  }
                />
              </Question>

              {form.dressingTable ===
                "Yes" && (
                <TextArea
                  label="Dressing Table Requirements"
                  value={
                    form.dressingTableRequirements
                  }
                  onChange={(value) =>
                    updateField(
                      "dressingTableRequirements",
                      value
                    )
                  }
                  placeholder="Describe drawers, mirror, lighting, seating, power requirements or other needs."
                />
              )}

              <Question
                number="27"
                title="Does the client require seating?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.seating
                  }
                  onChange={(value) =>
                    updateField(
                      "seating",
                      value
                    )
                  }
                />
              </Question>

              {form.seating ===
                "Yes" && (
                <TextInput
                  label="Preferred Seating Type"
                  value={
                    form.seatingType
                  }
                  onChange={(value) =>
                    updateField(
                      "seatingType",
                      value
                    )
                  }
                  placeholder="e.g. Ottoman, bench, dressing stool"
                />
              )}

              <Question
                number="28"
                title="Does the client want TV integration?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.tvIntegration
                  }
                  onChange={(value) =>
                    updateField(
                      "tvIntegration",
                      value
                    )
                  }
                />
              </Question>

              {form.tvIntegration ===
                "Yes" && (
                <TextInput
                  label="TV Size"
                  value={
                    form.tvSize
                  }
                  onChange={(value) =>
                    updateField(
                      "tvSize",
                      value
                    )
                  }
                  placeholder="e.g. 55 inch"
                />
              )}

              <Question
                number="29"
                title="Does the client want open sections?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.openSections
                  }
                  onChange={(value) =>
                    updateField(
                      "openSections",
                      value
                    )
                  }
                />
              </Question>

              {form.openSections ===
                "Yes" && (
                <TextArea
                  label="Open Section Requirements"
                  value={
                    form.openSectionDetails
                  }
                  onChange={(value) =>
                    updateField(
                      "openSectionDetails",
                      value
                    )
                  }
                  placeholder="Describe what should be displayed or stored in the open sections."
                />
              )}

              <Question
                number="30"
                title="Does the client require loft / top storage?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.loftStorage
                  }
                  onChange={(value) =>
                    updateField(
                      "loftStorage",
                      value
                    )
                  }
                />
              </Question>

              {form.loftStorage ===
                "Yes" && (
                <Question title="How will the loft storage be accessed?">
                  <CheckboxGroup
                    options={[
                      "Step ladder available",
                      "Movable stool / ladder required",
                      "Pull-down mechanism",
                      "Other",
                    ]}
                    values={
                      form.loftAccess
                    }
                    onChange={(values) =>
                      updateField(
                        "loftAccess",
                        values
                      )
                    }
                  />
                </Question>
              )}

            </div>
          </section>

          {/* SECTION I */}

          <section
            id="wardrobe-section-9"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="I"
              title="Wardrobe Functional Requirements"
              description="This section captures the client's everyday storage habits so the internal layout can be designed around actual use."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="31"
                title="What must the wardrobe contain?"
              >
                <CheckboxGroup
                  options={[
                    "Long hanging",
                    "Short hanging",
                    "Double hanging",
                    "Folded clothing shelves",
                    "Drawers",
                    "Shoe storage",
                    "Bag storage",
                    "Jewellery storage",
                    "Watch storage",
                    "Tie storage",
                    "Belt storage",
                    "Trouser storage",
                    "Open display",
                    "Glass display",
                    "Laundry basket",
                    "Ironing board",
                    "Safe / secure storage",
                    "Dressing area",
                    "Other",
                  ]}
                  values={
                    form.functionalRequirements
                  }
                  onChange={(values) =>
                    updateField(
                      "functionalRequirements",
                      values
                    )
                  }
                />
              </Question>

              {form.functionalRequirements.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Functional Requirement"
                  value={
                    form.functionalOther
                  }
                  onChange={(value) =>
                    updateField(
                      "functionalOther",
                      value
                    )
                  }
                />
              )}

              <Question
                number="32"
                title="Any specific functional requests?"
              >
                <TextArea
                  label=""
                  value={
                    form.specificFunctionalRequests
                  }
                  onChange={(value) =>
                    updateField(
                      "specificFunctionalRequests",
                      value
                    )
                  }
                  placeholder="Describe anything the client specifically wants the wardrobe to do."
                />
              </Question>

            </div>
          </section>

          {/* SECTION J */}

          <section
            id="wardrobe-section-10"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="J"
              title='Client "Do Not Want" List'
              description="Knowing what the client dislikes is just as important as knowing what they want. This helps KBX avoid unsuitable design directions."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="33"
                title="What does the client NOT want?"
              >
                <CheckboxGroup
                  options={[
                    "Handles",
                    "Mirror doors",
                    "Glass doors",
                    "Open shelves",
                    "Open sections",
                    "Visible storage",
                    "Dark colours",
                    "Light colours",
                    "Gloss finishes",
                    "Matte finishes",
                    "Wood finishes",
                    "Specific door styles",
                    "Specific materials",
                    "Certain cabinet positions",
                  ]}
                  values={
                    form.doNotWant
                  }
                  onChange={(values) =>
                    updateField(
                      "doNotWant",
                      values
                    )
                  }
                />
              </Question>

              <TextArea
                label="Materials / finishes the client does not want"
                value={
                  form.doNotWantMaterials
                }
                onChange={(value) =>
                  updateField(
                    "doNotWantMaterials",
                    value
                  )
                }
                placeholder="List any materials, colours or finishes the client does not want."
              />

              <TextArea
                label="Wardrobe positions / layouts the client does not want"
                value={
                  form.doNotWantPositions
                }
                onChange={(value) =>
                  updateField(
                    "doNotWantPositions",
                    value
                  )
                }
                placeholder="Describe any layout or positioning the client does not want."
              />

              <TextArea
                label="Specific instructions"
                value={
                  form.specificDoNotWantInstructions
                }
                onChange={(value) =>
                  updateField(
                    "specificDoNotWantInstructions",
                    value
                  )
                }
                placeholder="Any other restrictions or instructions?"
              />

            </div>
          </section>

          {/* SECTION K */}

          <section
            id="wardrobe-section-11"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="K"
              title="Additional Information & Confirmation"
              description="Use this section for anything important that has not been captured elsewhere and confirm that the brief is ready for design."
              required
            />

            <div className="mt-8 space-y-6">

              <TextArea
                label="Additional Notes"
                value={
                  form.additionalNotes
                }
                onChange={(value) =>
                  updateField(
                    "additionalNotes",
                    value
                  )
                }
                placeholder="Anything else KBX should know about the wardrobe project?"
              />

              <div className="space-y-4 border-t border-black/10 pt-6">

                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-black/10 bg-[#fafaf8] p-5">
                  <input
                    type="checkbox"
                    checked={
                      form.informationChecked
                    }
                    onChange={(event) =>
                      updateField(
                        "informationChecked",
                        event.target.checked
                      )
                    }
                    className="mt-1 h-5 w-5 shrink-0 accent-[#910B0A]"
                  />

                  <span className="text-sm leading-6">
                    I confirm that the information provided above has been
                    checked and represents the client's current wardrobe
                    requirements.

                    <span
                      style={{ color: RED }}
                    >
                      {" "}
                      *
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-black/10 bg-[#fafaf8] p-5">
                  <input
                    type="checkbox"
                    checked={
                      form.clientRequirementsConfirmed
                    }
                    onChange={(event) =>
                      updateField(
                        "clientRequirementsConfirmed",
                        event.target.checked
                      )
                    }
                    className="mt-1 h-5 w-5 shrink-0 accent-[#910B0A]"
                  />

                  <span className="text-sm leading-6">
                    Client requirements have been confirmed.

                    <span
                      style={{ color: RED }}
                    >
                      {" "}
                      *
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-black/10 bg-[#fafaf8] p-5">
                  <input
                    type="checkbox"
                    checked={
                      form.readyForDesign
                    }
                    onChange={(event) =>
                      updateField(
                        "readyForDesign",
                        event.target.checked
                      )
                    }
                    className="mt-1 h-5 w-5 shrink-0 accent-[#910B0A]"
                  />

                  <span className="text-sm leading-6">
                    The project is ready to proceed to design.
                  </span>
                </label>

              </div>

              <div className="grid gap-5 border-t border-black/10 pt-6 md:grid-cols-2">

                <TextInput
                  label="Prepared / Confirmed By"
                  value={
                    form.clientSignature
                  }
                  onChange={(value) =>
                    updateField(
                      "clientSignature",
                      value
                    )
                  }
                  placeholder="Client name"
                />

                <TextInput
                  label="Date"
                  value={
                    form.confirmationDate
                  }
                  onChange={(value) =>
                    updateField(
                      "confirmationDate",
                      value
                    )
                  }
                  type="date"
                />

              </div>

            </div>
          </section>

          {/* SUBMIT */}

          <section className="rounded-3xl bg-black p-7 text-white md:p-9">

            <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

              <div>

                <p
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: RED }}
                >
                  Ready to submit
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Submit your Wardrobes & Closets Brief
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                  Your responses will be securely prepared for KBX's design
                  process. A project document will be generated from the
                  information submitted.
                </p>

              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex shrink-0 items-center justify-center rounded-xl px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: RED,
                }}
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Submit Brief →"}
              </button>

            </div>
          </section>

        </div>
      </form>

      {/* FOOTER */}

      <footer className="border-t border-black/10 bg-white px-5 py-8 md:px-8">

        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 text-xs text-black/40 md:flex-row md:items-center md:justify-between">

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

            <div className="ml-2">
              <p className="text-sm font-semibold text-black">
                KBX Spatial Atelier
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-[0.16em]">
                Wardrobes & Closets
              </p>
            </div>

          </div>

          <p>
            © 2026 KBX Spatial Atelier
          </p>

        </div>

      </footer>

    </main>
  );
}