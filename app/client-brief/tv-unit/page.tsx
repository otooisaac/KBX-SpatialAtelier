"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

const RED = "#910B0A";

const CLIENT_ACCOUNTS_KEY = "kbxClientAccounts";
const CURRENT_CLIENT_KEY = "kbxCurrentClientId";
const LEGACY_CLIENT_KEY = "kbxClient";
const TV_UNIT_BRIEF_KEY = "kbxTVUnitBrief";

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  createdAt?: string;
};

type TVUnitForm = {
  projectName: string;
  clientName: string;
  projectLocation: string;
  date: string;

  projectType: string[];
  projectTypeOther: string;

  designGoal: string;
  mainRequirements: string;
  designStyles: string[];
  designStyleOther: string;

  referenceImagesAvailable: string;

  hasTV: string;
  tvBrandModel: string;
  tvWidth: string;
  tvHeight: string;
  tvDepth: string;
  preferredTVSize: string;
  tvInstallation: string;

  storageRequired: string;
  storageTypes: string[];
  storageOther: string;
  storageItems: string[];
  storageItemsOther: string;

  equipment: string[];
  equipmentOther: string;
  cableManagement: string;
  equipmentVisibility: string;
  electronicsSpecialRequirements: string;

  designFeatures: string[];
  designFeatureOther: string;
  wallCladdingRequired: string;
  wallCladdingMaterial: string;
  mainFinish: string[];
  mainFinishOther: string;

  doNotWant: string[];
  doNotWantOther: string;

  informationChecked: boolean;
  clientRequirementsConfirmed: boolean;
  readyForDesign: string;
  clientSignature: string;
};

type SavedBrief = {
  client?: ClientAccount;
  form: TVUnitForm;
  completed?: boolean;
  submitted?: boolean;
  completedAt?: string;
  savedAt?: string;
};

const initialForm: TVUnitForm = {
  projectName: "",
  clientName: "",
  projectLocation: "",
  date: "",

  projectType: [],
  projectTypeOther: "",

  designGoal: "",
  mainRequirements: "",
  designStyles: [],
  designStyleOther: "",

  referenceImagesAvailable: "",

  hasTV: "",
  tvBrandModel: "",
  tvWidth: "",
  tvHeight: "",
  tvDepth: "",
  preferredTVSize: "",
  tvInstallation: "",

  storageRequired: "",
  storageTypes: [],
  storageOther: "",
  storageItems: [],
  storageItemsOther: "",

  equipment: [],
  equipmentOther: "",
  cableManagement: "",
  equipmentVisibility: "",
  electronicsSpecialRequirements: "",

  designFeatures: [],
  designFeatureOther: "",
  wallCladdingRequired: "",
  wallCladdingMaterial: "",
  mainFinish: [],
  mainFinishOther: "",

  doNotWant: [],
  doNotWantOther: "",

  informationChecked: false,
  clientRequirementsConfirmed: false,
  readyForDesign: "",
  clientSignature: "",
};

const sectionIds = [
  "tv-unit-section-1",
  "tv-unit-section-2",
  "tv-unit-section-3",
  "tv-unit-section-4",
  "tv-unit-section-5",
  "tv-unit-section-6",
  "tv-unit-section-7",
  "tv-unit-section-8",
];

function readStoredData<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getClientFromStorage(): ClientAccount | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const accounts = readStoredData<ClientAccount[]>(
      CLIENT_ACCOUNTS_KEY
    );

    const currentClientId =
      window.localStorage.getItem(CURRENT_CLIENT_KEY);

    if (accounts && currentClientId) {
      const currentClient = accounts.find(
        (account) => account.id === currentClientId
      );

      if (currentClient) {
        return currentClient;
      }
    }

    return readStoredData<ClientAccount>(LEGACY_CLIENT_KEY);
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
          <span style={{ color: RED }}>*</span>
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
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
        {label}{" "}
        {required && (
          <span style={{ color: RED }}>*</span>
        )}
      </label>

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
  children: ReactNode;
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

export default function TVUnitBriefPage() {
  const [client, setClient] =
    useState<ClientAccount | null>(null);

  const [form, setForm] =
    useState<TVUnitForm>(initialForm);

  const [referenceImages, setReferenceImages] =
    useState<File[]>([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitMessage, setSubmitMessage] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedClient =
      getClientFromStorage();

    if (storedClient) {
      setClient(storedClient);
    }

    const savedBrief =
      readStoredData<SavedBrief>(
        TV_UNIT_BRIEF_KEY
      );

    if (savedBrief?.form) {
      setForm({
        ...initialForm,
        ...savedBrief.form,
      });
    } else if (storedClient) {
      setForm((previous) => ({
        ...previous,
        clientName: storedClient.name,
      }));
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (
      !isLoaded ||
      typeof window === "undefined"
    ) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        const data: SavedBrief = {
          client: client || undefined,
          form,
          savedAt:
            new Date().toISOString(),
        };

        window.localStorage.setItem(
          TV_UNIT_BRIEF_KEY,
          JSON.stringify(data)
        );
      }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [form, client, isLoaded]);

  const updateField = <
    K extends keyof TVUnitForm
  >(
    field: K,
    value: TVUnitForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleReferenceImages = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    setReferenceImages(files);
  };

  const scrollToSection = (
    index: number
  ) => {
    const element =
      document.getElementById(
        sectionIds[index]
      );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const requiredInformationComplete =
    useMemo(() => {
      return (
        form.projectName.trim() !== "" &&
        form.clientName.trim() !== "" &&
        form.projectLocation.trim() !== "" &&
        form.date.trim() !== "" &&
        form.projectType.length > 0 &&
        form.designGoal.trim() !== "" &&
        form.mainRequirements.trim() !== "" &&
        form.hasTV !== "" &&
        form.tvInstallation !== "" &&
        form.informationChecked &&
        form.clientRequirementsConfirmed &&
        form.readyForDesign === "Yes" &&
        form.clientSignature.trim() !== ""
      );
    }, [form]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSubmitMessage("");
    setSubmitError("");

    if (!client) {
      setSubmitError(
        "Your client account could not be found. Please return to the client portal and try again."
      );

      return;
    }

    if (!requiredInformationComplete) {
      setSubmitError(
        "Please complete all required project information and both compulsory confirmations before submitting."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const completedAt =
        new Date().toISOString();

      const briefData = {
        client,
        form,
        completed: true,
        submitted: true,
        completedAt,
        referenceImages:
          referenceImages.map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
      };

      const completedData: SavedBrief = {
        client,
        form,
        completed: true,
        submitted: true,
        completedAt,
        savedAt: completedAt,
      };

      const formData =
        new FormData();

      formData.append(
        "briefType",
        "tv_unit"
      );

      formData.append(
        "briefData",
        JSON.stringify(briefData)
      );

      referenceImages.forEach(
        (file) => {
          formData.append(
            "referenceImages",
            file
          );
        }
      );

      const response =
        await fetch(
          "/api/send-brief",
          {
            method: "POST",
            body: formData,
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "The server returned an unexpected response."
        );
      }

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "The TV Unit brief could not be submitted."
        );
      }

      window.localStorage.setItem(
        TV_UNIT_BRIEF_KEY,
        JSON.stringify(
          completedData
        )
      );

      setSubmitMessage(
        "Your TV Unit brief has been submitted successfully."
      );

      setReferenceImages([]);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the brief."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-sm text-black/45">
          Loading client brief...
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
                TV Unit Brief
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
                Auto-save enabled
              </p>
            </div>

            <Link
              href="/client-portal"
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
            TV Unit
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            Tell us exactly how your TV unit should work.
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-black/45 md:text-base">
            This brief captures the TV, storage,
            electronics, cable management, finishes
            and design direction required for the
            KBX Spatial Atelier design process.
          </p>

          {client && (
            <div className="mt-7 inline-flex rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs text-black/60">
              Prepared for
              <span className="ml-1 font-semibold text-black">
                {client.name}
              </span>
            </div>
          )}

        </div>
      </section>

      {/* WHY THIS BRIEF IS IMPORTANT */}

      <section className="px-5 pb-10 md:px-8">
        <div className="mx-auto max-w-[1000px]">

          <div className="rounded-3xl border border-[#910B0A]/10 bg-[#910B0A]/[0.035] p-6 md:p-7">

            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: RED }}
            >
              Why this brief is important
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-black/55">
              A TV unit is more than a visual feature.
              Its dimensions, storage, equipment,
              cable routes, ventilation, mounting method
              and finishes all affect the final design.
              Accurate information at this stage helps
              us develop a practical design before
              fabrication begins.
            </p>

          </div>

        </div>
      </section>

      {/* SECTION NAVIGATION */}

      <div className="px-5 pb-10 md:px-8">
        <div className="mx-auto max-w-[1000px]">

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-2">

              {sectionIds.map(
                (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      scrollToSection(
                        index
                      )
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-semibold transition hover:border-[#910B0A] hover:text-[#910B0A]"
                    aria-label={`Go to section ${
                      index + 1
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              )}

            </div>
          </div>

        </div>
      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-[1000px] space-y-7 px-5 pb-20 md:px-8"
      >

        {/* SECTION 01 */}

        <section
          id="tv-unit-section-1"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="01"
            title="PROJECT INFORMATION"
            description="Provide the basic information needed to identify and prepare this TV unit project."
            required
          />

          <div className="mt-7 space-y-5">

            <Question
              number="1"
              title="Project Details"
            >
              <div className="grid gap-6 md:grid-cols-2">

                <TextInput
                  label="Project Name"
                  value={
                    form.projectName
                  }
                  required
                  onChange={(value) =>
                    updateField(
                      "projectName",
                      value
                    )
                  }
                />

                <TextInput
                  label="Client Name"
                  value={
                    form.clientName
                  }
                  required
                  onChange={(value) =>
                    updateField(
                      "clientName",
                      value
                    )
                  }
                />

                <TextInput
                  label="Project Location"
                  value={
                    form.projectLocation
                  }
                  required
                  onChange={(value) =>
                    updateField(
                      "projectLocation",
                      value
                    )
                  }
                />

                <TextInput
                  label="Date"
                  type="date"
                  value={form.date}
                  required
                  onChange={(value) =>
                    updateField(
                      "date",
                      value
                    )
                  }
                />

              </div>
            </Question>

            <Question
              number="2"
              title="Project Type"
              required
            >
              <CheckboxGroup
                options={[
                  "New TV Unit",
                  "Replacement of existing TV Unit",
                  "Modification of existing unit",
                  "Other",
                ]}
                values={
                  form.projectType
                }
                onChange={(values) =>
                  updateField(
                    "projectType",
                    values
                  )
                }
              />

              {form.projectType.includes(
                "Other"
              ) && (
                <div className="mt-5">
                  <TextInput
                    label="Other Project Type"
                    value={
                      form.projectTypeOther
                    }
                    onChange={(value) =>
                      updateField(
                        "projectTypeOther",
                        value
                      )
                    }
                  />
                </div>
              )}
            </Question>

          </div>
        </section>

        {/* SECTION 02 */}

        <section
          id="tv-unit-section-2"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="02"
            title="GENERAL DESIGN REQUIREMENTS"
            description="Tell us what the client wants the TV unit to achieve and the overall visual direction."
            required
          />

          <div className="mt-7 space-y-5">

            <Question
              number="1"
              title="Design Goal"
              description="Describe the overall purpose, look or experience the client wants from the TV unit."
              required
            >
              <TextArea
                label="What does the client want to achieve?"
                value={
                  form.designGoal
                }
                required
                placeholder="e.g. A clean luxury TV wall with concealed storage and minimal visible electronics."
                onChange={(value) =>
                  updateField(
                    "designGoal",
                    value
                  )
                }
              />
            </Question>

            <Question
              number="2"
              title="Main Requirements"
              description="Mention any important requirements that should guide the design."
              required
            >
              <TextArea
                label="Main Requirements"
                value={
                  form.mainRequirements
                }
                required
                placeholder="Describe the client's main expectations for the TV unit."
                onChange={(value) =>
                  updateField(
                    "mainRequirements",
                    value
                  )
                }
              />
            </Question>

            <Question
              number="3"
              title="Preferred Design Style"
            >
              <CheckboxGroup
                options={[
                  "Modern",
                  "Contemporary",
                  "Minimalist",
                  "Luxury",
                  "Classic",
                  "Industrial",
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

              {form.designStyles.includes(
                "Other"
              ) && (
                <div className="mt-5">
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
                </div>
              )}
            </Question>

            <Question
              number="4"
              title="Reference Images"
              description="Reference images help communicate preferred layouts, materials, proportions and details."
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

              {form.referenceImagesAvailable ===
                "Yes" && (
                <div className="mt-5 rounded-2xl border border-dashed border-black/15 bg-white p-5">

                  <label className="mb-2 block text-sm font-semibold">
                    Attach Reference Images
                  </label>

                  <p className="mb-4 text-xs leading-5 text-black/40">
                    Upload images that communicate
                    the client&apos;s preferred
                    style, layout, finishes or
                    details.
                  </p>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={
                      handleReferenceImages
                    }
                    className="block w-full text-sm text-black/60 file:mr-4 file:rounded-lg file:border-0 file:bg-[#910B0A] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
                  />

                  {referenceImages.length >
                    0 && (
                    <div className="mt-4 space-y-2">

                      {referenceImages.map(
                        (
                          file,
                          index
                        ) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="rounded-xl border border-black/10 bg-[#fafaf8] px-4 py-3 text-xs text-black/60"
                          >
                            {file.name}
                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>
              )}
            </Question>

          </div>
        </section>

        {/* SECTION 03 */}

        <section
          id="tv-unit-section-3"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="03"
            title="TV REQUIREMENTS"
            description="Capture the TV dimensions, mounting method and any information required to size the unit correctly."
            required
          />

          <div className="mt-7 space-y-5">

            <Question
              number="1"
              title="Existing TV"
              required
            >
              <RadioGroup
                options={[
                  "Yes",
                  "No",
                ]}
                value={
                  form.hasTV
                }
                onChange={(value) =>
                  updateField(
                    "hasTV",
                    value
                  )
                }
              />
            </Question>

            {form.hasTV ===
              "Yes" && (
              <Question
                number="2"
                title="Existing TV Information"
                description="Use actual manufacturer dimensions where possible."
              >
                <div className="grid gap-6 md:grid-cols-2">

                  <TextInput
                    label="Brand / Model"
                    value={
                      form.tvBrandModel
                    }
                    onChange={(value) =>
                      updateField(
                        "tvBrandModel",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="TV Width (cm)"
                    value={
                      form.tvWidth
                    }
                    type="number"
                    onChange={(value) =>
                      updateField(
                        "tvWidth",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="TV Height (cm)"
                    value={
                      form.tvHeight
                    }
                    type="number"
                    onChange={(value) =>
                      updateField(
                        "tvHeight",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="TV Depth (cm)"
                    value={
                      form.tvDepth
                    }
                    type="number"
                    onChange={(value) =>
                      updateField(
                        "tvDepth",
                        value
                      )
                    }
                  />

                </div>
              </Question>
            )}

            {form.hasTV ===
              "No" && (
              <Question
                number="2"
                title="Preferred TV Size"
              >
                <TextInput
                  label="Preferred TV Size (inches)"
                  value={
                    form.preferredTVSize
                  }
                  placeholder="e.g. 55, 65, 75"
                  onChange={(value) =>
                    updateField(
                      "preferredTVSize",
                      value
                    )
                  }
                />
              </Question>
            )}

            <Question
              number="3"
              title="TV Installation"
              required
            >
              <RadioGroup
                options={[
                  "Wall mounted",
                  "Sitting on cabinet",
                  "Undecided",
                ]}
                value={
                  form.tvInstallation
                }
                onChange={(value) =>
                  updateField(
                    "tvInstallation",
                    value
                  )
                }
              />
            </Question>

          </div>
        </section>

        {/* SECTION 04 */}

        <section
          id="tv-unit-section-4"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="04"
            title="STORAGE REQUIREMENTS"
            description="Define what storage the TV unit needs to provide and what will be stored inside it."
          />

          <div className="mt-7 space-y-5">

            <Question
              number="1"
              title="Storage Required"
            >
              <RadioGroup
                options={[
                  "Yes",
                  "No",
                ]}
                value={
                  form.storageRequired
                }
                onChange={(value) =>
                  updateField(
                    "storageRequired",
                    value
                  )
                }
              />
            </Question>

            {form.storageRequired ===
              "Yes" && (
              <>
                <Question
                  number="2"
                  title="Required Storage"
                >
                  <CheckboxGroup
                    options={[
                      "Drawers",
                      "Closed cabinets",
                      "Open shelves",
                      "Display shelves",
                      "Glass cabinets",
                      "Floating cabinets",
                      "Other",
                    ]}
                    values={
                      form.storageTypes
                    }
                    onChange={(values) =>
                      updateField(
                        "storageTypes",
                        values
                      )
                    }
                  />

                  {form.storageTypes.includes(
                    "Other"
                  ) && (
                    <div className="mt-5">
                      <TextInput
                        label="Other Storage Requirement"
                        value={
                          form.storageOther
                        }
                        onChange={(value) =>
                          updateField(
                            "storageOther",
                            value
                          )
                        }
                      />
                    </div>
                  )}
                </Question>

                <Question
                  number="3"
                  title="Items to be Stored"
                >
                  <CheckboxGroup
                    options={[
                      "Decoder",
                      "Game console",
                      "Speakers",
                      "Books",
                      "Decorations",
                      "DVDs/media",
                      "Remote controls",
                      "Other",
                    ]}
                    values={
                      form.storageItems
                    }
                    onChange={(values) =>
                      updateField(
                        "storageItems",
                        values
                      )
                    }
                  />

                  {form.storageItems.includes(
                    "Other"
                  ) && (
                    <div className="mt-5">
                      <TextInput
                        label="Other Items to be Stored"
                        value={
                          form.storageItemsOther
                        }
                        onChange={(value) =>
                          updateField(
                            "storageItemsOther",
                            value
                          )
                        }
                      />
                    </div>
                  )}
                </Question>
              </>
            )}

          </div>
        </section>

        {/* SECTION 05 */}

        <section
          id="tv-unit-section-5"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="05"
            title="ELECTRONICS & CABLE MANAGEMENT"
            description="Identify the equipment that needs to be accommodated and how it should function within the unit."
          />

          <div className="mt-7 space-y-5">

            <Question
              number="1"
              title="Equipment to be Accommodated"
            >
              <CheckboxGroup
                options={[
                  "Decoder",
                  "PlayStation/Xbox",
                  "Soundbar",
                  "AV receiver",
                  "Speakers",
                  "Subwoofer",
                  "Wi-Fi router",
                  "Other",
                ]}
                values={
                  form.equipment
                }
                onChange={(values) =>
                  updateField(
                    "equipment",
                    values
                  )
                }
              />

              {form.equipment.includes(
                "Other"
              ) && (
                <div className="mt-5">
                  <TextInput
                    label="Other Equipment"
                    value={
                      form.equipmentOther
                    }
                    onChange={(value) =>
                      updateField(
                        "equipmentOther",
                        value
                      )
                    }
                  />
                </div>
              )}
            </Question>

            <Question
              number="2"
              title="Cable Management"
            >
              <RadioGroup
                options={[
                  "Yes",
                  "No",
                ]}
                value={
                  form.cableManagement
                }
                onChange={(value) =>
                  updateField(
                    "cableManagement",
                    value
                  )
                }
              />
            </Question>

            <Question
              number="3"
              title="Equipment Visibility"
            >
              <RadioGroup
                options={[
                  "Visible",
                  "Concealed",
                  "Combination",
                ]}
                value={
                  form.equipmentVisibility
                }
                onChange={(value) =>
                  updateField(
                    "equipmentVisibility",
                    value
                  )
                }
              />
            </Question>

            <Question
              number="4"
              title="Electronics Special Requirements"
            >
              <TextArea
                label="Special Requirements"
                value={
                  form.electronicsSpecialRequirements
                }
                placeholder="Mention ventilation, access, sockets, cable routes or any other electronics-related requirements."
                onChange={(value) =>
                  updateField(
                    "electronicsSpecialRequirements",
                    value
                  )
                }
              />
            </Question>

          </div>
        </section>

        {/* SECTION 06 */}

        <section
          id="tv-unit-section-6"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="06"
            title="DESIGN FEATURES & FINISHES"
            description="Select the architectural, decorative and material features that should influence the final TV unit."
          />

          <div className="mt-7 space-y-5">

            <Question
              number="1"
              title="Design Features"
            >
              <CheckboxGroup
                options={[
                  "Back panel behind TV",
                  "Wall cladding",
                  "Fluted panel",
                  "Wood finish",
                  "Marble/stone effect",
                  "Mirror",
                  "Glass",
                  "Open shelving",
                  "Floating cabinet",
                  "LED strip lighting",
                  "Display lighting",
                  "Other",
                ]}
                values={
                  form.designFeatures
                }
                onChange={(values) =>
                  updateField(
                    "designFeatures",
                    values
                  )
                }
              />

              {form.designFeatures.includes(
                "Other"
              ) && (
                <div className="mt-5">
                  <TextInput
                    label="Other Design Feature"
                    value={
                      form.designFeatureOther
                    }
                    onChange={(value) =>
                      updateField(
                        "designFeatureOther",
                        value
                      )
                    }
                  />
                </div>
              )}
            </Question>

            <Question
              number="2"
              title="Wall Cladding / Paneling"
            >
              <RadioGroup
                options={[
                  "Yes",
                  "No",
                ]}
                value={
                  form.wallCladdingRequired
                }
                onChange={(value) =>
                  updateField(
                    "wallCladdingRequired",
                    value
                  )
                }
              />

              {form.wallCladdingRequired ===
                "Yes" && (
                <div className="mt-5">
                  <TextArea
                    label="Preferred Material"
                    value={
                      form.wallCladdingMaterial
                    }
                    placeholder="e.g. wood slats, veneer, stone, marble effect, fluted panels, laminate, etc."
                    onChange={(value) =>
                      updateField(
                        "wallCladdingMaterial",
                        value
                      )
                    }
                  />
                </div>
              )}
            </Question>

            <Question
              number="3"
              title="Main Finish"
            >
              <CheckboxGroup
                options={[
                  "Matte",
                  "Gloss",
                  "Wood grain",
                  "Veneer",
                  "Laminate",
                  "Other",
                ]}
                values={
                  form.mainFinish
                }
                onChange={(values) =>
                  updateField(
                    "mainFinish",
                    values
                  )
                }
              />

              {form.mainFinish.includes(
                "Other"
              ) && (
                <div className="mt-5">
                  <TextInput
                    label="Other Main Finish"
                    value={
                      form.mainFinishOther
                    }
                    onChange={(value) =>
                      updateField(
                        "mainFinishOther",
                        value
                      )
                    }
                  />
                </div>
              )}
            </Question>

          </div>
        </section>

        {/* SECTION 07 */}

        <section
          id="tv-unit-section-7"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="07"
            title={'CLIENT\'S "DO NOT WANT" LIST'}
            description="Select anything the client specifically does not want included in the TV unit design."
          />

          <div className="mt-7">

            <Question
              number="1"
              title="Client Does Not Want"
            >
              <CheckboxGroup
                options={[
                  "Wall cladding",
                  "Open shelves",
                  "Glass",
                  "Floating cabinets",
                  "LED lighting",
                  "Handles",
                  "Dark colours",
                  "Light colours",
                  "Visible equipment",
                  "Other",
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

              {form.doNotWant.includes(
                "Other"
              ) && (
                <div className="mt-5">
                  <TextInput
                    label="Other"
                    value={
                      form.doNotWantOther
                    }
                    onChange={(value) =>
                      updateField(
                        "doNotWantOther",
                        value
                      )
                    }
                  />
                </div>
              )}
            </Question>

          </div>
        </section>

        {/* SECTION 08 */}

        <section
          id="tv-unit-section-8"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-6 md:p-9"
        >

          <SectionHeader
            number="08"
            title="FINAL CONFIRMATION"
            description="Review the complete brief before submitting it to KBX Spatial Atelier."
            required
          />

          <div className="mt-7 space-y-5">

            <Question
              number="1"
              title="Information Checked"
              required
            >
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                  form.informationChecked
                    ? "border-[#910B0A] bg-[#910B0A]/5"
                    : "border-black/10 bg-white hover:border-black/25"
                }`}
              >
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
                  className="mt-1 h-5 w-5 shrink-0 rounded"
                  style={{
                    accentColor: RED,
                  }}
                />

                <span className="text-sm leading-6 text-black/70">
                  I confirm that the information
                  provided above has been checked
                  and represents the client&apos;s
                  current requirements and the
                  available site information.

                  <span className="ml-1 font-semibold text-[#910B0A]">
                    *
                  </span>
                </span>
              </label>
            </Question>

            <Question
              number="2"
              title="Client Requirements Confirmed"
              required
            >
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                  form.clientRequirementsConfirmed
                    ? "border-[#910B0A] bg-[#910B0A]/5"
                    : "border-black/10 bg-white hover:border-black/25"
                }`}
              >
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
                  className="mt-1 h-5 w-5 shrink-0 rounded"
                  style={{
                    accentColor: RED,
                  }}
                />

                <span className="text-sm leading-6 text-black/70">
                  I confirm that the client&apos;s
                  requirements have been accurately
                  recorded in this brief.

                  <span className="ml-1 font-semibold text-[#910B0A]">
                    *
                  </span>
                </span>
              </label>
            </Question>

            <Question
              number="3"
              title="Design Readiness"
              required
            >
              <RadioGroup
                options={[
                  "Yes",
                  "No",
                ]}
                value={
                  form.readyForDesign
                }
                onChange={(value) =>
                  updateField(
                    "readyForDesign",
                    value
                  )
                }
              />
            </Question>

            <Question
              number="4"
              title="Prepared By"
              required
            >
              <TextInput
                label="Name of Person Preparing the Brief"
                value={
                  form.clientSignature
                }
                required
                placeholder="Enter full name"
                onChange={(value) =>
                  updateField(
                    "clientSignature",
                    value
                  )
                }
              />
            </Question>

            <div className="rounded-2xl border border-[#910B0A]/10 bg-[#910B0A]/[0.035] p-5">

              <p className="text-xs leading-6 text-black/50">
                <span className="font-semibold text-black/70">
                  Important:
                </span>{" "}
                Both confirmation checkboxes,
                the required project information
                and &ldquo;Ready for Design&rdquo;
                must be completed before the
                brief can be submitted.
              </p>

            </div>

          </div>
        </section>

        {/* SUBMIT */}

        <section className="rounded-3xl bg-gray-950 p-6 text-white shadow-sm sm:p-9">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-lg font-semibold">
                Submit TV Unit Brief
              </p>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                Your completed brief will be
                securely processed and prepared
                for the KBX Spatial Atelier
                design process.
              </p>

            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-w-[190px] items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: RED,
              }}
            >
              {isSubmitting
                ? "Submitting..."
                : "Submit Brief"}
            </button>

          </div>

          {submitMessage && (
            <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-300">
              {submitMessage}
            </div>
          )}

          {submitError && (
            <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm leading-6 text-red-200">
              {submitError}
            </div>
          )}

        </section>

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
                TV Unit Brief
              </p>
            </div>

          </div>

          <p>
            © {new Date().getFullYear()} KBX Spatial Atelier
          </p>

        </div>

      </footer>

    </main>
  );
}