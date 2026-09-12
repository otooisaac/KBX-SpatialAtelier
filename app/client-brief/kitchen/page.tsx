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

const KITCHEN_BRIEF_KEY = "kbxKitchenBrief";

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  createdAt?: string;
};

type KitchenForm = {
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

  builtInCabinetry: string;
  cabinetStyle: string[];
  cabinetStyleOther: string;
  cabinetColourFinish: string;
  countertop: string;

  backsplash: string;
  backsplashType: string;
  backsplashMaterial: string;

  wallCabinets: string;
  wallCabinetCeiling: string;

  loftCabinets: string;
  loftAccess: string[];
  loftAccessOther: string;

  glassDoors: string;
  glassDoorLocations: string[];
  glassDoorOther: string;

  ledLights: string;
  ledLocations: string[];
  ledOther: string;

  openShelves: string;

  tallUnits: string;
  tallUnitTypes: string[];
  tallUnitOther: string;
  tallUnitCount: string;
  tallUnitsCeiling: string;
  tallUnitLoft: string;

  island: string;
  islandPurpose: string[];
  islandSeating: string;
  islandServices: string[];

  ownsAppliances: string;

  refrigeratorBrand: string;
  refrigeratorModel: string;
  refrigeratorWidth: string;
  refrigeratorHeight: string;
  refrigeratorDepth: string;
  refrigeratorType: string;

  ovenBrand: string;
  ovenModel: string;
  ovenWidth: string;
  ovenHeight: string;
  ovenDepth: string;
  ovenType: string;

  microwaveBrand: string;
  microwaveModel: string;
  microwaveWidth: string;
  microwaveHeight: string;
  microwaveDepth: string;
  microwaveType: string;

  dishwasherBrand: string;
  dishwasherModel: string;
  dishwasherWidth: string;
  dishwasherHeight: string;
  dishwasherDepth: string;

  hobBrand: string;
  hobModel: string;
  hobWidth: string;
  hobDepth: string;
  hobType: string;

  extractorBrand: string;
  extractorModel: string;
  extractorWidth: string;
  extractorDepth: string;
  extractorHeight: string;

  washingMachineBrand: string;
  washingMachineModel: string;
  washingMachineWidth: string;
  washingMachineDepth: string;
  washingMachineHeight: string;

  appliancesProvidedBy: string;

  sinkProvidedBy: string;
  sinkType: string[];
  sinkOther: string;
  sinkWidth: string;
  sinkDepth: string;

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
  form: KitchenForm;
  completed?: boolean;
  submitted?: boolean;
  completedAt?: string;
  savedAt?: string;
};

const initialForm: KitchenForm = {
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

  builtInCabinetry: "",
  cabinetStyle: [],
  cabinetStyleOther: "",
  cabinetColourFinish: "",
  countertop: "",

  backsplash: "",
  backsplashType: "",
  backsplashMaterial: "",

  wallCabinets: "",
  wallCabinetCeiling: "",

  loftCabinets: "",
  loftAccess: [],
  loftAccessOther: "",

  glassDoors: "",
  glassDoorLocations: [],
  glassDoorOther: "",

  ledLights: "",
  ledLocations: [],
  ledOther: "",

  openShelves: "",

  tallUnits: "",
  tallUnitTypes: [],
  tallUnitOther: "",
  tallUnitCount: "",
  tallUnitsCeiling: "",
  tallUnitLoft: "",

  island: "",
  islandPurpose: [],
  islandSeating: "",
  islandServices: [],

  ownsAppliances: "",

  refrigeratorBrand: "",
  refrigeratorModel: "",
  refrigeratorWidth: "",
  refrigeratorHeight: "",
  refrigeratorDepth: "",
  refrigeratorType: "",

  ovenBrand: "",
  ovenModel: "",
  ovenWidth: "",
  ovenHeight: "",
  ovenDepth: "",
  ovenType: "",

  microwaveBrand: "",
  microwaveModel: "",
  microwaveWidth: "",
  microwaveHeight: "",
  microwaveDepth: "",
  microwaveType: "",

  dishwasherBrand: "",
  dishwasherModel: "",
  dishwasherWidth: "",
  dishwasherHeight: "",
  dishwasherDepth: "",

  hobBrand: "",
  hobModel: "",
  hobWidth: "",
  hobDepth: "",
  hobType: "",

  extractorBrand: "",
  extractorModel: "",
  extractorWidth: "",
  extractorDepth: "",
  extractorHeight: "",

  washingMachineBrand: "",
  washingMachineModel: "",
  washingMachineWidth: "",
  washingMachineDepth: "",
  washingMachineHeight: "",

  appliancesProvidedBy: "",

  sinkProvidedBy: "",
  sinkType: [],
  sinkOther: "",
  sinkWidth: "",
  sinkDepth: "",

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
      KITCHEN_BRIEF_KEY
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

export default function KitchenBriefPage() {
  const [client, setClient] =
    useState<ClientAccount | null>(null);

  const [form, setForm] =
    useState<KitchenForm>(initialForm);

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
          KITCHEN_BRIEF_KEY,
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

  function updateField<K extends keyof KitchenForm>(
    field: K,
    value: KitchenForm[K]
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
    "kitchen-section-1",
    "kitchen-section-2",
    "kitchen-section-3",
    "kitchen-section-4",
    "kitchen-section-5",
    "kitchen-section-6",
    "kitchen-section-7",
    "kitchen-section-8",
    "kitchen-section-9",
    "kitchen-section-10",
    "kitchen-section-11",
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
        form.builtInCabinetry !== "" &&
        form.ownsAppliances !== "" &&
        form.sinkProvidedBy !== "" &&
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
        "kitchen"
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
            "Unable to submit the kitchen brief."
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
        KITCHEN_BRIEF_KEY,
        JSON.stringify(
          completedBrief
        )
      );

      setSubmitMessage(
        "Your Kitchen & Storerooms Brief has been submitted successfully."
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
                Kitchen & Storerooms Brief
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
            Kitchen & Storerooms
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            Tell us exactly how
            <br />
            your kitchen should work.
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-black/45 md:text-base">
            This brief helps KBX understand your requirements before design
            begins. The information you provide will guide spatial planning,
            cabinetry, appliance integration, storage, materials and
            functionality.
          </p>

          <div className="mt-8 rounded-2xl border border-[#910B0A]/15 bg-[#910B0A]/5 p-5">
            <p className="text-sm font-semibold">
              Why this brief is important
            </p>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Kitchen cabinetry is designed around the actual space,
              appliances, services and way you intend to use the room.
              Accurate information at this stage helps reduce redesign,
              incorrect dimensions, unsuitable storage and appliance
              conflicts later in the project.
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
            id="kitchen-section-1"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="A"
              title="Project Information"
              description="Basic project information allows KBX to correctly identify the kitchen project and the people responsible for it."
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
                placeholder="e.g. Otoo Residence Kitchen"
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
            id="kitchen-section-2"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="B"
              title="Client Requirements"
              description="This section establishes the client's overall expectations before detailed kitchen decisions are made."
              required
            />

            <div className="mt-8 space-y-5">

              <Question
                number="01"
                title="What does the client want to achieve?"
                description="Describe the overall outcome the client expects from the kitchen."
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
                  placeholder="Example: Create a modern, highly functional family kitchen with generous storage and a clean appearance."
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
                  placeholder="List the client's most important requirements."
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
                description="Reference images help KBX understand the client's visual expectations."
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
                    Upload images that represent the client&apos;s preferred
                    kitchens, colours, cabinetry, materials or details.
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
            id="kitchen-section-3"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="C"
              title="Kitchen Requirements"
              description="These decisions directly affect cabinet construction, elevations, dimensions, materials and the final appearance of the kitchen."
              required
            />

            <div className="mt-8 space-y-5">

              <Question
                number="05"
                title="Does the client want built-in cabinetry?"
                required
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                    "Not decided",
                  ]}
                  value={
                    form.builtInCabinetry
                  }
                  onChange={(value) =>
                    updateField(
                      "builtInCabinetry",
                      value
                    )
                  }
                />
              </Question>

              <Question
                number="06"
                title="Cabinet style / profile"
              >
                <CheckboxGroup
                  options={[
                    "L-profile",
                    "C-profile",
                    "Handle-less",
                    "Handles",
                    "Other",
                  ]}
                  values={
                    form.cabinetStyle
                  }
                  onChange={(values) =>
                    updateField(
                      "cabinetStyle",
                      values
                    )
                  }
                />
              </Question>

              {form.cabinetStyle.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Cabinet Style"
                  value={
                    form.cabinetStyleOther
                  }
                  onChange={(value) =>
                    updateField(
                      "cabinetStyleOther",
                      value
                    )
                  }
                />
              )}

              <div className="grid gap-5 md:grid-cols-2">

                <TextInput
                  label="Preferred Cabinet Colour / Finish"
                  value={
                    form.cabinetColourFinish
                  }
                  onChange={(value) =>
                    updateField(
                      "cabinetColourFinish",
                      value
                    )
                  }
                  placeholder="e.g. Matte white, walnut veneer"
                />

                <TextInput
                  label="Preferred Countertop"
                  value={
                    form.countertop
                  }
                  onChange={(value) =>
                    updateField(
                      "countertop",
                      value
                    )
                  }
                  placeholder="e.g. Quartz, granite, porcelain"
                />

              </div>

              <Question
                number="07"
                title="Does the client want a backsplash?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                    "Not decided",
                  ]}
                  value={
                    form.backsplash
                  }
                  onChange={(value) =>
                    updateField(
                      "backsplash",
                      value
                    )
                  }
                />
              </Question>

              {form.backsplash ===
                "Yes" && (
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                      Backsplash Type
                    </label>

                    <RadioGroup
                      options={[
                        "Full-height backsplash",
                        "Standard backsplash",
                        "Client hasn't decided",
                      ]}
                      value={
                        form.backsplashType
                      }
                      onChange={(value) =>
                        updateField(
                          "backsplashType",
                          value
                        )
                      }
                    />
                  </div>

                  <TextInput
                    label="Backsplash Material / Finish"
                    value={
                      form.backsplashMaterial
                    }
                    onChange={(value) =>
                      updateField(
                        "backsplashMaterial",
                        value
                      )
                    }
                    placeholder="e.g. Porcelain slab, marble, tiles"
                  />

                </div>
              )}

              <Question
                number="08"
                title="Does the client want wall cabinets?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                    "Some areas only",
                  ]}
                  value={
                    form.wallCabinets
                  }
                  onChange={(value) =>
                    updateField(
                      "wallCabinets",
                      value
                    )
                  }
                />
              </Question>

              {form.wallCabinets !==
                "No" &&
                form.wallCabinets !==
                  "" && (
                  <div className="space-y-5 rounded-2xl border border-black/10 p-5">

                    <Question
                      title="Should wall cabinets reach the ceiling?"
                      description="Standard ceiling reference entered by KBX: 280 cm. Actual dimensions should be confirmed before final design."
                    >
                      <RadioGroup
                        options={[
                          "Yes",
                          "No",
                        ]}
                        value={
                          form.wallCabinetCeiling
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "wallCabinetCeiling",
                            value
                          )
                        }
                      />
                    </Question>

                    {form.wallCabinetCeiling ===
                      "Yes" && (
                      <Question
                        title="Does the client want loft / top cabinets?"
                      >
                        <RadioGroup
                          options={[
                            "Yes",
                            "No",
                          ]}
                          value={
                            form.loftCabinets
                          }
                          onChange={(
                            value
                          ) =>
                            updateField(
                              "loftCabinets",
                              value
                            )
                          }
                        />
                      </Question>
                    )}

                    {form.loftCabinets ===
                      "Yes" && (
                      <Question
                        title="How will the client access the upper cabinets?"
                      >
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
                          onChange={(
                            values
                          ) =>
                            updateField(
                              "loftAccess",
                              values
                            )
                          }
                        />
                      </Question>
                    )}

                    {form.loftAccess.includes(
                      "Other"
                    ) && (
                      <TextInput
                        label="Other Access Method"
                        value={
                          form.loftAccessOther
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "loftAccessOther",
                            value
                          )
                        }
                      />
                    )}

                  </div>
                )}

              <Question
                number="09"
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
                        "Wall Cabinets",
                        "Tall Units",
                        "Fridge Cabinet",
                        "Loft",
                        "Other",
                      ]}
                      values={
                        form.glassDoorLocations
                      }
                      onChange={(
                        values
                      ) =>
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
                      onChange={(
                        value
                      ) =>
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
                number="10"
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
                        "Inside glass wall cabinets",
                        "Inside tall units with glass",
                        "Inside loft with glass",
                        "Inside fridge cabinet with glass",
                        "Under wall cabinets",
                        "Under island",
                        "Other",
                      ]}
                      values={
                        form.ledLocations
                      }
                      onChange={(
                        values
                      ) =>
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
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "ledOther",
                          value
                        )
                      }
                    />
                  )}
                </>
              )}

              <Question
                number="11"
                title="Does the client want open shelves?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.openShelves
                  }
                  onChange={(value) =>
                    updateField(
                      "openShelves",
                      value
                    )
                  }
                />
              </Question>

            </div>
          </section>

          {/* SECTION D */}

          <section
            id="kitchen-section-4"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="D"
              title="Tall Units & Storage"
              description="Tall-unit requirements determine how appliances, pantry storage, refrigeration and vertical storage are organised."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="12"
                title="Does the client require tall units?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.tallUnits
                  }
                  onChange={(value) =>
                    updateField(
                      "tallUnits",
                      value
                    )
                  }
                />
              </Question>

              {form.tallUnits ===
                "Yes" && (
                <>
                  <Question title="Required tall units">
                    <CheckboxGroup
                      options={[
                        "Oven tower",
                        "Microwave tower",
                        "Pantry",
                        "Storage",
                        "Fridge housing",
                        "Other",
                      ]}
                      values={
                        form.tallUnitTypes
                      }
                      onChange={(
                        values
                      ) =>
                        updateField(
                          "tallUnitTypes",
                          values
                        )
                      }
                    />
                  </Question>

                  {form.tallUnitTypes.includes(
                    "Other"
                  ) && (
                    <TextInput
                      label="Other Tall Unit"
                      value={
                        form.tallUnitOther
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "tallUnitOther",
                          value
                        )
                      }
                    />
                  )}

                  <div className="grid gap-5 md:grid-cols-3">

                    <TextInput
                      label="Number of Tall Units"
                      value={
                        form.tallUnitCount
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "tallUnitCount",
                          value
                        )
                      }
                      type="number"
                    />

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                        Should Tall Units Reach Ceiling?
                      </label>

                      <RadioGroup
                        options={[
                          "Yes",
                          "No",
                        ]}
                        value={
                          form.tallUnitsCeiling
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "tallUnitsCeiling",
                            value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                        Loft Above Tall Units?
                      </label>

                      <RadioGroup
                        options={[
                          "Yes",
                          "No",
                        ]}
                        value={
                          form.tallUnitLoft
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "tallUnitLoft",
                            value
                          )
                        }
                      />
                    </div>

                  </div>
                </>
              )}

            </div>
          </section>

          {/* SECTION E */}

          <section
            id="kitchen-section-5"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="E"
              title="Kitchen Island"
              description="An island affects circulation, working clearances, seating, services and sometimes electrical/plumbing coordination."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="13"
                title="Does the client want an island?"
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                  ]}
                  value={
                    form.island
                  }
                  onChange={(value) =>
                    updateField(
                      "island",
                      value
                    )
                  }
                />
              </Question>

              {form.island ===
                "Yes" && (
                <>
                  <Question title="Purpose of the island">
                    <CheckboxGroup
                      options={[
                        "Food preparation",
                        "Storage",
                        "Seating",
                        "Cooking",
                        "Sink",
                        "Socialising",
                        "Combination",
                      ]}
                      values={
                        form.islandPurpose
                      }
                      onChange={(
                        values
                      ) =>
                        updateField(
                          "islandPurpose",
                          values
                        )
                      }
                    />
                  </Question>

                  <Question title="Is seating required?">
                    <RadioGroup
                      options={[
                        "Yes",
                        "No",
                      ]}
                      value={
                        form.islandSeating
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "islandSeating",
                          value
                        )
                      }
                    />
                  </Question>

                  <Question title="Appliances / services on island">
                    <CheckboxGroup
                      options={[
                        "Hob",
                        "Sink",
                        "Dishwasher",
                        "Power sockets",
                        "None",
                      ]}
                      values={
                        form.islandServices
                      }
                      onChange={(
                        values
                      ) =>
                        updateField(
                          "islandServices",
                          values
                        )
                      }
                    />
                  </Question>
                </>
              )}

            </div>
          </section>

          {/* SECTION F */}

          <section
            id="kitchen-section-6"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="F"
              title="Appliances"
              description="Appliance information is mandatory because cabinetry and service locations must be coordinated with the actual appliance dimensions and installation requirements."
              required
            />

            <div className="mt-8 space-y-5">

              <Question
                number="14"
                title="Does the client already own the appliances?"
                description="If appliances are already owned, accurate model numbers and dimensions should be provided wherever possible."
                required
              >
                <RadioGroup
                  options={[
                    "Yes",
                    "No",
                    "Some",
                  ]}
                  value={
                    form.ownsAppliances
                  }
                  onChange={(value) =>
                    updateField(
                      "ownsAppliances",
                      value
                    )
                  }
                />
              </Question>

              <div className="rounded-2xl border border-[#910B0A]/10 bg-[#910B0A]/5 p-5">

                <p className="text-sm font-semibold">
                  Appliance information
                </p>

                <p className="mt-2 text-xs leading-5 text-black/45">
                  For appliances already owned, enter the brand, model and
                  actual dimensions. If an appliance is built-in, its
                  installation requirements should also be confirmed before
                  final cabinet production.
                </p>

              </div>

              {/* REFRIGERATOR */}

              <div className="rounded-2xl border border-black/10 p-5">

                <h3 className="text-base font-semibold">
                  Refrigerator / Fridge
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Brand"
                    value={
                      form.refrigeratorBrand
                    }
                    onChange={(value) =>
                      updateField(
                        "refrigeratorBrand",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Model"
                    value={
                      form.refrigeratorModel
                    }
                    onChange={(value) =>
                      updateField(
                        "refrigeratorModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Width (cm)"
                    value={
                      form.refrigeratorWidth
                    }
                    onChange={(value) =>
                      updateField(
                        "refrigeratorWidth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Height (cm)"
                    value={
                      form.refrigeratorHeight
                    }
                    onChange={(value) =>
                      updateField(
                        "refrigeratorHeight",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Depth (cm)"
                    value={
                      form.refrigeratorDepth
                    }
                    onChange={(value) =>
                      updateField(
                        "refrigeratorDepth",
                        value
                      )
                    }
                    type="number"
                  />

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                      Installation Type
                    </label>

                    <RadioGroup
                      options={[
                        "Freestanding",
                        "Built-in",
                      ]}
                      value={
                        form.refrigeratorType
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "refrigeratorType",
                          value
                        )
                      }
                    />
                  </div>

                </div>
              </div>

              {/* OVEN */}

              <div className="rounded-2xl border border-black/10 p-5">

                <h3 className="text-base font-semibold">
                  Oven
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Brand"
                    value={
                      form.ovenBrand
                    }
                    onChange={(value) =>
                      updateField(
                        "ovenBrand",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Model"
                    value={
                      form.ovenModel
                    }
                    onChange={(value) =>
                      updateField(
                        "ovenModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Width (cm)"
                    value={
                      form.ovenWidth
                    }
                    onChange={(value) =>
                      updateField(
                        "ovenWidth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Height (cm)"
                    value={
                      form.ovenHeight
                    }
                    onChange={(value) =>
                      updateField(
                        "ovenHeight",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Depth (cm)"
                    value={
                      form.ovenDepth
                    }
                    onChange={(value) =>
                      updateField(
                        "ovenDepth",
                        value
                      )
                    }
                    type="number"
                  />

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                      Installation Type
                    </label>

                    <RadioGroup
                      options={[
                        "Freestanding",
                        "Built-in",
                      ]}
                      value={
                        form.ovenType
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "ovenType",
                          value
                        )
                      }
                    />
                  </div>

                </div>
              </div>

              {/* MICROWAVE */}

              <div className="rounded-2xl border border-black/10 p-5">

                <h3 className="text-base font-semibold">
                  Microwave
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Brand"
                    value={
                      form.microwaveBrand
                    }
                    onChange={(value) =>
                      updateField(
                        "microwaveBrand",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Model"
                    value={
                      form.microwaveModel
                    }
                    onChange={(value) =>
                      updateField(
                        "microwaveModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Width (cm)"
                    value={
                      form.microwaveWidth
                    }
                    onChange={(value) =>
                      updateField(
                        "microwaveWidth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Height (cm)"
                    value={
                      form.microwaveHeight
                    }
                    onChange={(value) =>
                      updateField(
                        "microwaveHeight",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Depth (cm)"
                    value={
                      form.microwaveDepth
                    }
                    onChange={(value) =>
                      updateField(
                        "microwaveDepth",
                        value
                      )
                    }
                    type="number"
                  />

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                      Installation Type
                    </label>

                    <RadioGroup
                      options={[
                        "Countertop",
                        "Built-in",
                      ]}
                      value={
                        form.microwaveType
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "microwaveType",
                          value
                        )
                      }
                    />
                  </div>

                </div>
              </div>

              {/* DISHWASHER */}

              <div className="rounded-2xl border border-black/10 p-5">

                <h3 className="text-base font-semibold">
                  Dishwasher
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Brand"
                    value={
                      form.dishwasherBrand
                    }
                    onChange={(value) =>
                      updateField(
                        "dishwasherBrand",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Model"
                    value={
                      form.dishwasherModel
                    }
                    onChange={(value) =>
                      updateField(
                        "dishwasherModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Width (cm)"
                    value={
                      form.dishwasherWidth
                    }
                    onChange={(value) =>
                      updateField(
                        "dishwasherWidth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Height (cm)"
                    value={
                      form.dishwasherHeight
                    }
                    onChange={(value) =>
                      updateField(
                        "dishwasherHeight",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Depth (cm)"
                    value={
                      form.dishwasherDepth
                    }
                    onChange={(value) =>
                      updateField(
                        "dishwasherDepth",
                        value
                      )
                    }
                    type="number"
                  />

                </div>
              </div>

              {/* HOB */}

              <div className="rounded-2xl border border-black/10 p-5">

                <h3 className="text-base font-semibold">
                  Hob / Cooktop
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Brand"
                    value={
                      form.hobBrand
                    }
                    onChange={(value) =>
                      updateField(
                        "hobBrand",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Model"
                    value={
                      form.hobModel
                    }
                    onChange={(value) =>
                      updateField(
                        "hobModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Width (cm)"
                    value={
                      form.hobWidth
                    }
                    onChange={(value) =>
                      updateField(
                        "hobWidth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Depth (cm)"
                    value={
                      form.hobDepth
                    }
                    onChange={(value) =>
                      updateField(
                        "hobDepth",
                        value
                      )
                    }
                    type="number"
                  />

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                      Hob Type
                    </label>

                    <RadioGroup
                      options={[
                        "Gas",
                        "Electric",
                        "Induction",
                      ]}
                      value={
                        form.hobType
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "hobType",
                          value
                        )
                      }
                    />
                  </div>

                </div>
              </div>

              {/* EXTRACTOR */}

              <div className="rounded-2xl border border-black/10 p-5">

                <h3 className="text-base font-semibold">
                  Cooker Hood / Extractor
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Brand"
                    value={
                      form.extractorBrand
                    }
                    onChange={(value) =>
                      updateField(
                        "extractorBrand",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Model"
                    value={
                      form.extractorModel
                    }
                    onChange={(value) =>
                      updateField(
                        "extractorModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Width (mm)"
                    value={
                      form.extractorWidth
                    }
                    onChange={(value) =>
                      updateField(
                        "extractorWidth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Depth (mm)"
                    value={
                      form.extractorDepth
                    }
                    onChange={(value) =>
                      updateField(
                        "extractorDepth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Height (mm)"
                    value={
                      form.extractorHeight
                    }
                    onChange={(value) =>
                      updateField(
                        "extractorHeight",
                        value
                      )
                    }
                    type="number"
                  />

                </div>
              </div>

              {/* WASHING MACHINE */}

              <div className="rounded-2xl border border-black/10 p-5">

                <h3 className="text-base font-semibold">
                  Washing Machine
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <TextInput
                    label="Brand"
                    value={
                      form.washingMachineBrand
                    }
                    onChange={(value) =>
                      updateField(
                        "washingMachineBrand",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Model"
                    value={
                      form.washingMachineModel
                    }
                    onChange={(value) =>
                      updateField(
                        "washingMachineModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Width (mm)"
                    value={
                      form.washingMachineWidth
                    }
                    onChange={(value) =>
                      updateField(
                        "washingMachineWidth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Depth (mm)"
                    value={
                      form.washingMachineDepth
                    }
                    onChange={(value) =>
                      updateField(
                        "washingMachineDepth",
                        value
                      )
                    }
                    type="number"
                  />

                  <TextInput
                    label="Height (mm)"
                    value={
                      form.washingMachineHeight
                    }
                    onChange={(value) =>
                      updateField(
                        "washingMachineHeight",
                        value
                      )
                    }
                    type="number"
                  />

                </div>
              </div>

              <Question title="If the client does not own the appliances, who will select/provide them?">
                <RadioGroup
                  options={[
                    "Client",
                    "Company",
                  ]}
                  value={
                    form.appliancesProvidedBy
                  }
                  onChange={(value) =>
                    updateField(
                      "appliancesProvidedBy",
                      value
                    )
                  }
                />
              </Question>

            </div>
          </section>

          {/* SECTION G */}

          <section
            id="kitchen-section-7"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="G"
              title="Sink & Water Point"
              description="Sink dimensions and mounting type affect countertop cut-outs, cabinet configuration and plumbing coordination."
              required
            />

            <div className="mt-8 space-y-5">

              <Question
                number="15"
                title="Sink provided by"
                required
              >
                <RadioGroup
                  options={[
                    "Client",
                    "Company",
                  ]}
                  value={
                    form.sinkProvidedBy
                  }
                  onChange={(value) =>
                    updateField(
                      "sinkProvidedBy",
                      value
                    )
                  }
                />
              </Question>

              <Question title="Sink type">
                <CheckboxGroup
                  options={[
                    "Single bowl",
                    "Double bowl",
                    "Undermount",
                    "Top mount",
                    "Other",
                  ]}
                  values={
                    form.sinkType
                  }
                  onChange={(values) =>
                    updateField(
                      "sinkType",
                      values
                    )
                  }
                />
              </Question>

              {form.sinkType.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Sink Type"
                  value={
                    form.sinkOther
                  }
                  onChange={(value) =>
                    updateField(
                      "sinkOther",
                      value
                    )
                  }
                />
              )}

              <div className="grid gap-5 md:grid-cols-2">

                <TextInput
                  label="Actual Sink Width (mm)"
                  value={
                    form.sinkWidth
                  }
                  onChange={(value) =>
                    updateField(
                      "sinkWidth",
                      value
                    )
                  }
                  type="number"
                />

                <TextInput
                  label="Actual Sink Depth (mm)"
                  value={
                    form.sinkDepth
                  }
                  onChange={(value) =>
                    updateField(
                      "sinkDepth",
                      value
                    )
                  }
                  type="number"
                />

              </div>

            </div>
          </section>

          {/* SECTION H */}

          <section
            id="kitchen-section-8"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="H"
              title="Kitchen Functional Requirements"
              description="Storage should be designed around the way the client actually cooks, stores food and uses appliances."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="16"
                title="What must the kitchen contain?"
              >
                <CheckboxGroup
                  options={[
                    "Cutlery drawers",
                    "Pots / pan storage",
                    "Pantry",
                    "Spice storage",
                    "Bin system",
                    "Bottle storage",
                    "Appliance garage",
                    "Open shelves",
                    "Glass cabinets",
                    "Display cabinets",
                    "Wine storage",
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

              <Question title="Any specific functional requests?">
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
                  placeholder="Describe anything the client specifically wants the kitchen to do."
                />
              </Question>

            </div>
          </section>

          {/* SECTION I */}

          <section
            id="kitchen-section-9"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="I"
              title='Client "Do Not Want" List'
              description="Knowing what the client dislikes is just as important as knowing what they want. This helps KBX avoid unsuitable design directions."
            />

            <div className="mt-8 space-y-5">

              <Question
                number="17"
                title="What does the client NOT want?"
              >
                <CheckboxGroup
                  options={[
                    "Wall cabinets",
                    "Tall units",
                    "Open shelves",
                    "Glass doors",
                    "Handles",
                    "Visible appliances",
                    "Island",
                    "Peninsula",
                    "Dark colours",
                    "Light colours",
                    "Certain materials",
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
                label="Materials the client does not want"
                value={
                  form.doNotWantMaterials
                }
                onChange={(value) =>
                  updateField(
                    "doNotWantMaterials",
                    value
                  )
                }
                placeholder="List any materials, finishes or surfaces the client does not want."
              />

              <TextArea
                label="Cabinet positions / layouts the client does not want"
                value={
                  form.doNotWantPositions
                }
                onChange={(value) =>
                  updateField(
                    "doNotWantPositions",
                    value
                  )
                }
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
              />

            </div>
          </section>

          {/* SECTION J */}

          <section
            id="kitchen-section-10"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="J"
              title="Additional Information"
              description="Use this space for anything important that has not been captured elsewhere."
            />

            <div className="mt-8">

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
                placeholder="Anything else KBX should know about the project?"
              />

            </div>
          </section>

          {/* SECTION K */}

          <section
            id="kitchen-section-11"
            className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
          >
            <SectionHeader
              number="K"
              title="Client Confirmation"
              description="The information below should be confirmed before the project moves into design. This protects both the client and KBX from designing from outdated or unverified information."
              required
            />

            <div className="mt-8 space-y-4">

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
                  checked and represents the client&apos;s current
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
                  Submit your Kitchen & Storerooms Brief
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                  Your responses will be securely prepared for KBX&apos;s
                  design process. A project document will be generated from
                  the information submitted.
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
                Kitchen & Storerooms
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