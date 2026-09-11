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

const WARDROBES_BRIEF_KEY = "kbxWardrobesBrief";

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  createdAt?: string;
};

type WardrobesForm = {
  projectName: string;
  clientName: string;
  projectLocation: string;
  date: string;
  personHandlingClient: string;

  projectType: string[];
  projectTypeOther: string;

  designGoal: string;
  designStyles: string[];
  designStyleOther: string;

  referenceImagesAvailable: string;

  wardrobeDoors: string;
  doorFinish: string;
  glassType: string;
  handles: string;
  preferredColourFinish: string;

  storageNeeds: string[];
  storageOther: string;

  hangingRequirements: string[];
  hangingOther: string;

  drawersRequired: string;
  openShelvesRequired: string;

  reachCeiling: string;
  loftCabinets: string;
  loftAccess: string[];
  loftAccessOther: string;

  internalLedLighting: string;
  sensorLighting: string;
  glassDisplaySections: string;
  shoeDisplay: string;

  specialRequirements: string[];
  specialRequirementOther: string;

  centralIsland: string;
  seating: string;
  vanityDressingArea: string;

  doNotWant: string[];
  doNotWantOther: string;

  informationChecked: boolean;
  readyForDesign: boolean;

  clientSignature: string;
};

type SavedBrief = {
  client?: ClientAccount;
  form: WardrobesForm;
  completed?: boolean;
  submitted?: boolean;
  completedAt?: string;
  savedAt?: string;
};

const initialForm: WardrobesForm = {
  projectName: "",
  clientName: "",
  projectLocation: "",
  date: "",
  personHandlingClient: "",

  projectType: [],
  projectTypeOther: "",

  designGoal: "",
  designStyles: [],
  designStyleOther: "",

  referenceImagesAvailable: "",

  wardrobeDoors: "",
  doorFinish: "",
  glassType: "",
  handles: "",
  preferredColourFinish: "",

  storageNeeds: [],
  storageOther: "",

  hangingRequirements: [],
  hangingOther: "",

  drawersRequired: "",
  openShelvesRequired: "",

  reachCeiling: "",
  loftCabinets: "",
  loftAccess: [],
  loftAccessOther: "",

  internalLedLighting: "",
  sensorLighting: "",
  glassDisplaySections: "",
  shoeDisplay: "",

  specialRequirements: [],
  specialRequirementOther: "",

  centralIsland: "",
  seating: "",
  vanityDressingArea: "",

  doNotWant: [],
  doNotWantOther: "",

  informationChecked: false,
  readyForDesign: false,

  clientSignature: "",
};

function getBriefStorageKey(clientId: string) {
  return `${WARDROBES_BRIEF_KEY}_${clientId}`;
}

function getLegacyBriefStorageKey(clientId: string) {
  return `${WARDROBES_BRIEF_KEY}_${clientId}`;
}

function readStoredData(key: string): SavedBrief | null {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as SavedBrief;
  } catch {
    return null;
  }
}

function CheckboxGroup({
  label,
  options,
  values,
  onChange,
}: {
  label?: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const toggleOption = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((value) => value !== option));
    } else {
      onChange([...values, option]);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-neutral-900">{label}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option);

          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                checked
                  ? "border-[#910B0A] bg-[#910B0A]/5"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleOption(option)}
                className="h-4 w-4 accent-[#910B0A]"
              />

              <span className="text-neutral-800">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-neutral-900">{label}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value === option;

          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                checked
                  ? "border-[#910B0A] bg-[#910B0A]/5"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <input
                type="radio"
                name={`radio-${options.join("-")}`}
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="h-4 w-4 accent-[#910B0A]"
              />

              <span className="text-neutral-800">{option}</span>
            </label>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-900">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#910B0A] focus:ring-2 focus:ring-[#910B0A]/10"
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-900">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#910B0A] focus:ring-2 focus:ring-[#910B0A]/10"
      />
    </div>
  );
}

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 border-b border-neutral-200 pb-5">
      <div className="mb-2 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: RED }}
        >
          {number}
        </span>

        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h2>
      </div>

      {description && (
        <p className="max-w-3xl text-sm leading-6 text-neutral-500">
          {description}
        </p>
      )}
    </div>
  );
}

function Question({
  number,
  children,
}: {
  number?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {number && (
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: RED }}
          >
            {number}
          </span>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )}

      {!number && children}
    </div>
  );
}

export default function WardrobesBriefPage() {
  const [client, setClient] = useState<ClientAccount | null>(null);
  const [form, setForm] = useState<WardrobesForm>(initialForm);

  const [referenceImages, setReferenceImages] = useState<File[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [briefStatus, setBriefStatus] = useState<
    "not-started" | "in-progress" | "completed"
  >("not-started");

  const isWalkInCloset = form.projectType.includes("Walk-in closet");

  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem(CLIENT_ACCOUNTS_KEY);
      const currentClientId = localStorage.getItem(CURRENT_CLIENT_KEY);

      let currentClient: ClientAccount | null = null;

      if (storedAccounts) {
        const accounts = JSON.parse(storedAccounts) as ClientAccount[];

        if (currentClientId) {
          currentClient =
            accounts.find(
              (account) => account.id === currentClientId
            ) || null;
        }
      }

      if (!currentClient) {
        const legacyClient = localStorage.getItem(LEGACY_CLIENT_KEY);

        if (legacyClient) {
          currentClient = JSON.parse(
            legacyClient
          ) as ClientAccount;
        }
      }

      if (currentClient) {
        setClient(currentClient);

        const storedBrief =
          readStoredData(
            getBriefStorageKey(currentClient.id)
          ) ||
          readStoredData(
            getLegacyBriefStorageKey(currentClient.id)
          );

        if (storedBrief?.form) {
          setForm({
            ...initialForm,
            ...storedBrief.form,
          });

          if (
            storedBrief.completed ||
            storedBrief.submitted
          ) {
            setBriefStatus("completed");
          } else {
            setBriefStatus("in-progress");
          }
        }
      }
    } catch (error) {
      console.error(
        "Failed to load client wardrobe brief:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !client?.id) {
      return;
    }

    setIsSaving(true);

    const timer = window.setTimeout(() => {
      try {
        const savedBrief: SavedBrief = {
          client,
          form,
          completed: briefStatus === "completed",
          submitted: briefStatus === "completed",
          completedAt:
            briefStatus === "completed"
              ? new Date().toISOString()
              : undefined,
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem(
          getBriefStorageKey(client.id),
          JSON.stringify(savedBrief)
        );
      } catch (error) {
        console.error(
          "Failed to auto-save wardrobe brief:",
          error
        );
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, client, isLoaded, briefStatus]);

  const updateForm = <K extends keyof WardrobesForm>(
    field: K,
    value: WardrobesForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (briefStatus !== "completed") {
      setBriefStatus("in-progress");
    }
  };

  const handleReferenceImages = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    setReferenceImages(files);
  };

  const requiredInformationComplete = useMemo(() => {
    return (
      form.projectName.trim() !== "" &&
      form.clientName.trim() !== "" &&
      form.projectLocation.trim() !== "" &&
      form.date.trim() !== "" &&
      form.designGoal.trim() !== "" &&
      form.projectType.length > 0 &&
      form.informationChecked &&
      form.readyForDesign &&
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
        "Client information could not be loaded. Please return to the client portal and try again."
      );
      return;
    }

    if (!requiredInformationComplete) {
      setSubmitError(
        "Please complete all required information and confirm the brief before submitting."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const briefData = {
        client,
        form,
        completed: true,
        submitted: true,
        completedAt: new Date().toISOString(),
        referenceImages: referenceImages.map(
          (file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })
        ),
      };

      const formData = new FormData();

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
        "/api/send-wardrobes-brief",
        {
          method: "POST",
          body: formData,
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();

        throw new Error(
          text ||
            "The server returned an unexpected response."
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "The wardrobe brief could not be submitted."
        );
      }

      const completedBrief: SavedBrief = {
        client,
        form,
        completed: true,
        submitted: true,
        completedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        getBriefStorageKey(client.id),
        JSON.stringify(completedBrief)
      );

      setBriefStatus("completed");

      setSubmitMessage(
        "Your Wardrobes & Walk-in Closets brief has been submitted successfully."
      );
    } catch (error) {
      console.error(
        "Wardrobe brief submission error:",
        error
      );

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
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-[#910B0A]"
          />

          <p className="text-sm text-neutral-500">
            Loading your brief...
          </p>
        </div>
      </main>
    );
  }

  if (!client) {
    return (
      <main className="min-h-screen bg-[#fafafa]">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <div className="w-full rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <h1 className="mb-3 text-2xl font-semibold text-neutral-950">
              Client profile not found
            </h1>

            <p className="mb-6 text-sm leading-6 text-neutral-500">
              Please return to your client portal and open the
              brief again.
            </p>

            <Link
              href="/client-portal"
              className="inline-flex rounded-full px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              style={{
                backgroundColor: RED,
              }}
            >
              Return to Client Portal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/client-portal"
            className="flex items-center"
          >
            <Image
              src="/kbx-logo.png"
              alt="KBX Spatial Atelier"
              width={170}
              height={50}
              className="h-auto w-[145px] sm:w-[170px]"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Client
              </p>

              <p className="text-sm font-medium text-neutral-900">
                {client.name}
              </p>
            </div>

            <Link
              href="/client-portal"
              className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Portal
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="max-w-4xl">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: RED }}
            >
              Project Brief 03
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
              Wardrobes & Walk-in Closets
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-500 sm:text-base">
              Please provide the information below so KBX Spatial
              Atelier can understand your wardrobe or walk-in
              closet requirements before design development begins.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-neutral-100 px-4 py-2 text-xs text-neutral-600">
                Auto-save enabled
              </div>

              {isSaving && (
                <div className="rounded-full bg-neutral-100 px-4 py-2 text-xs text-neutral-500">
                  Saving...
                </div>
              )}

              {briefStatus === "completed" && (
                <div className="rounded-full bg-green-50 px-4 py-2 text-xs font-medium text-green-700">
                  Brief Completed
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14"
      >
        <div className="space-y-8">
          {/* 01 PROJECT INFORMATION */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number="01"
              title="Project Information"
              description="Basic information about the project and the person coordinating the client communication."
            />

            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                label="Project Name"
                value={form.projectName}
                onChange={(value) =>
                  updateForm("projectName", value)
                }
                placeholder="e.g. Master Bedroom Wardrobe"
              />

              <TextInput
                label="Client Name"
                value={form.clientName}
                onChange={(value) =>
                  updateForm("clientName", value)
                }
                placeholder="Client full name"
              />

              <TextInput
                label="Project Location"
                value={form.projectLocation}
                onChange={(value) =>
                  updateForm(
                    "projectLocation",
                    value
                  )
                }
                placeholder="Project location"
              />

              <TextInput
                label="Date"
                type="date"
                value={form.date}
                onChange={(value) =>
                  updateForm("date", value)
                }
              />

              <div className="md:col-span-2">
                <TextInput
                  label="Person Handling Client"
                  value={form.personHandlingClient}
                  onChange={(value) =>
                    updateForm(
                      "personHandlingClient",
                      value
                    )
                  }
                  placeholder="Name of person responsible for client communication"
                />
              </div>
            </div>

            <div className="mt-8">
              <Question>
                <CheckboxGroup
                  label="Project Type"
                  options={[
                    "Built-in wardrobe",
                    "Walk-in closet",
                    "Existing wardrobe modification",
                    "New wardrobe",
                    "Other",
                  ]}
                  values={form.projectType}
                  onChange={(values) =>
                    updateForm(
                      "projectType",
                      values
                    )
                  }
                />
              </Question>
            </div>

            {form.projectType.includes("Other") && (
              <div className="mt-5">
                <TextInput
                  label="Other Project Type"
                  value={form.projectTypeOther}
                  onChange={(value) =>
                    updateForm(
                      "projectTypeOther",
                      value
                    )
                  }
                  placeholder="Please specify"
                />
              </div>
            )}
          </section>

          {/* 02 GENERAL DESIGN REQUIREMENTS */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number="02"
              title="General Design Requirements"
              description="Tell us what the client wants the wardrobe or closet to achieve."
            />

            <div className="space-y-7">
              <TextArea
                label="What does the client want to achieve?"
                value={form.designGoal}
                onChange={(value) =>
                  updateForm(
                    "designGoal",
                    value
                  )
                }
                placeholder="Describe the client's main objective for the space."
                rows={5}
              />

              <CheckboxGroup
                label="Preferred Design Style"
                options={[
                  "Modern",
                  "Contemporary",
                  "Minimalist",
                  "Luxury",
                  "Classic",
                  "Other",
                ]}
                values={form.designStyles}
                onChange={(values) =>
                  updateForm(
                    "designStyles",
                    values
                  )
                }
              />

              {form.designStyles.includes("Other") && (
                <TextInput
                  label="Other Design Style"
                  value={form.designStyleOther}
                  onChange={(value) =>
                    updateForm(
                      "designStyleOther",
                      value
                    )
                  }
                  placeholder="Please specify"
                />
              )}

              <RadioGroup
                label="Are client reference images available?"
                options={["Yes", "No"]}
                value={
                  form.referenceImagesAvailable
                }
                onChange={(value) =>
                  updateForm(
                    "referenceImagesAvailable",
                    value
                  )
                }
              />

              {form.referenceImagesAvailable ===
                "Yes" && (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
                  <label className="mb-2 block text-sm font-medium text-neutral-900">
                    Attach Reference Images
                  </label>

                  <p className="mb-4 text-xs leading-5 text-neutral-500">
                    Upload any wardrobe, walk-in closet,
                    material, colour, layout or styling
                    references provided by the client.
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceImages}
                    className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#910B0A] file:px-5 file:py-2.5 file:text-xs file:font-medium file:text-white hover:file:opacity-90"
                  />

                  {referenceImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {referenceImages.map(
                        (file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="rounded-lg bg-white px-3 py-2 text-xs text-neutral-600"
                          >
                            {file.name}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 03 CLIENT PREFERENCES */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number="03"
              title="Client Preferences"
              description="Define the preferred door configuration, finishes, hardware and overall appearance."
            />

            <div className="space-y-7">
              <RadioGroup
                label="Wardrobe Doors"
                options={[
                  "Hinged",
                  "Sliding",
                  "Open wardrobe",
                  "Undecided",
                ]}
                value={form.wardrobeDoors}
                onChange={(value) =>
                  updateForm(
                    "wardrobeDoors",
                    value
                  )
                }
              />

              <RadioGroup
                label="Door Finish"
                options={[
                  "Solid",
                  "Glass",
                  "Mirror",
                  "Combination",
                ]}
                value={form.doorFinish}
                onChange={(value) =>
                  updateForm(
                    "doorFinish",
                    value
                  )
                }
              />

              {(form.doorFinish === "Glass" ||
                form.doorFinish ===
                  "Combination") && (
                <RadioGroup
                  label="Glass Type"
                  options={[
                    "Clear",
                    "Smoked",
                    "Fluted",
                    "Frosted",
                    "Undecided",
                  ]}
                  value={form.glassType}
                  onChange={(value) =>
                    updateForm(
                      "glassType",
                      value
                    )
                  }
                />
              )}

              <RadioGroup
                label="Handles"
                options={[
                  "Handles",
                  "Handleless",
                  "Profile handle",
                  "Undecided",
                  "Push to Open",
                ]}
                value={form.handles}
                onChange={(value) =>
                  updateForm(
                    "handles",
                    value
                  )
                }
              />

              <TextInput
                label="Preferred Colour / Finish"
                value={
                  form.preferredColourFinish
                }
                onChange={(value) =>
                  updateForm(
                    "preferredColourFinish",
                    value
                  )
                }
                placeholder="e.g. Warm oak, matte white, dark walnut, beige..."
              />
            </div>
          </section>

          {/* 04 INTERNAL STORAGE */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number="04"
              title="Internal Storage Requirements"
              description="Identify what needs to be stored and how the internal wardrobe should be organized."
            />

            <div className="space-y-7">
              <CheckboxGroup
                label="What does the client need to store?"
                options={[
                  "Hanging clothes",
                  "Folded clothes",
                  "Shoes",
                  "Bags",
                  "Hats",
                  "Belts/Ties",
                  "Watches/Jewellery",
                  "Accessories",
                  "Suitcases",
                  "Other",
                ]}
                values={form.storageNeeds}
                onChange={(values) =>
                  updateForm(
                    "storageNeeds",
                    values
                  )
                }
              />

              {form.storageNeeds.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Storage Requirement"
                  value={form.storageOther}
                  onChange={(value) =>
                    updateForm(
                      "storageOther",
                      value
                    )
                  }
                  placeholder="Please specify"
                />
              )}

              <CheckboxGroup
                label="Hanging Requirements"
                options={[
                  "Short hanging",
                  "Long hanging",
                  "Double hanging",
                  "Pull-down hanging rail",
                  "Combination",
                  "Other",
                ]}
                values={
                  form.hangingRequirements
                }
                onChange={(values) =>
                  updateForm(
                    "hangingRequirements",
                    values
                  )
                }
              />

              {form.hangingRequirements.includes(
                "Other"
              ) && (
                <TextInput
                  label="Other Hanging Requirement"
                  value={form.hangingOther}
                  onChange={(value) =>
                    updateForm(
                      "hangingOther",
                      value
                    )
                  }
                  placeholder="Please specify"
                />
              )}

              <div className="grid gap-7 md:grid-cols-2">
                <RadioGroup
                  label="Drawers Required"
                  options={["Yes", "No"]}
                  value={
                    form.drawersRequired
                  }
                  onChange={(value) =>
                    updateForm(
                      "drawersRequired",
                      value
                    )
                  }
                />

                <RadioGroup
                  label="Open Shelves Required"
                  options={["Yes", "No"]}
                  value={
                    form.openShelvesRequired
                  }
                  onChange={(value) =>
                    updateForm(
                      "openShelvesRequired",
                      value
                    )
                  }
                />
              </div>
            </div>
          </section>

          {/* 05 FULL HEIGHT / LOFT */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number="05"
              title="Full-height / Loft Storage"
              description="This section considers full-height wardrobe construction and upper storage. Standard height is 280cm."
            />

            <div className="space-y-7">
              <RadioGroup
                label="Should the wardrobe reach the ceiling?"
                options={["Yes", "No"]}
                value={form.reachCeiling}
                onChange={(value) =>
                  updateForm(
                    "reachCeiling",
                    value
                  )
                }
              />

              {form.reachCeiling === "Yes" && (
                <>
                  <RadioGroup
                    label="If yes, should there be loft / top cabinets?"
                    options={["Yes", "No"]}
                    value={form.loftCabinets}
                    onChange={(value) =>
                      updateForm(
                        "loftCabinets",
                        value
                      )
                    }
                  />

                  {form.loftCabinets ===
                    "Yes" && (
                    <>
                      <CheckboxGroup
                        label="Upper Storage Access"
                        options={[
                          "Step ladder",
                          "Pull-down mechanism",
                          "Other",
                        ]}
                        values={
                          form.loftAccess
                        }
                        onChange={(values) =>
                          updateForm(
                            "loftAccess",
                            values
                          )
                        }
                      />

                      {form.loftAccess.includes(
                        "Other"
                      ) && (
                        <TextInput
                          label="Other Access Method"
                          value={
                            form.loftAccessOther
                          }
                          onChange={(value) =>
                            updateForm(
                              "loftAccessOther",
                              value
                            )
                          }
                          placeholder="Please specify"
                        />
                      )}
                    </>
                  )}
                </>
              )}

              <div className="grid gap-7 md:grid-cols-2">
                <RadioGroup
                  label="Internal LED Lighting"
                  options={["Yes", "No"]}
                  value={
                    form.internalLedLighting
                  }
                  onChange={(value) =>
                    updateForm(
                      "internalLedLighting",
                      value
                    )
                  }
                />

                <RadioGroup
                  label="Sensor Lighting"
                  options={["Yes", "No"]}
                  value={
                    form.sensorLighting
                  }
                  onChange={(value) =>
                    updateForm(
                      "sensorLighting",
                      value
                    )
                  }
                />

                <RadioGroup
                  label="Glass Display Sections"
                  options={["Yes", "No"]}
                  value={
                    form.glassDisplaySections
                  }
                  onChange={(value) =>
                    updateForm(
                      "glassDisplaySections",
                      value
                    )
                  }
                />

                <RadioGroup
                  label="Shoe Display"
                  options={["Yes", "No"]}
                  value={form.shoeDisplay}
                  onChange={(value) =>
                    updateForm(
                      "shoeDisplay",
                      value
                    )
                  }
                />
              </div>
            </div>
          </section>

          {/* 06 SPECIAL REQUIREMENTS */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number="06"
              title="Special Requirements"
              description="Select any additional features the client would like incorporated."
            />

            <CheckboxGroup
              options={[
                "Jewellery/watch storage",
                "Bag storage",
                "Full-length mirror",
                "Vanity",
                "Seating",
                "Laundry basket",
                "Other",
              ]}
              values={
                form.specialRequirements
              }
              onChange={(values) =>
                updateForm(
                  "specialRequirements",
                  values
                )
              }
            />

            {form.specialRequirements.includes(
              "Other"
            ) && (
              <div className="mt-5">
                <TextInput
                  label="Other Special Requirement"
                  value={
                    form.specialRequirementOther
                  }
                  onChange={(value) =>
                    updateForm(
                      "specialRequirementOther",
                      value
                    )
                  }
                  placeholder="Please specify"
                />
              </div>
            )}
          </section>

          {/* 07 WALK IN CLOSET */}
          {isWalkInCloset && (
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
              <SectionHeader
                number="07"
                title="Walk-in Closet"
                description="These questions apply specifically when the project includes a walk-in closet."
              />

              <div className="space-y-7">
                <RadioGroup
                  label="Central Island Required"
                  options={["Yes", "No"]}
                  value={form.centralIsland}
                  onChange={(value) =>
                    updateForm(
                      "centralIsland",
                      value
                    )
                  }
                />

                <RadioGroup
                  label="Seating Required"
                  options={["Yes", "No"]}
                  value={form.seating}
                  onChange={(value) =>
                    updateForm(
                      "seating",
                      value
                    )
                  }
                />

                <RadioGroup
                  label="Vanity / Dressing Area"
                  options={["Yes", "No"]}
                  value={
                    form.vanityDressingArea
                  }
                  onChange={(value) =>
                    updateForm(
                      "vanityDressingArea",
                      value
                    )
                  }
                />
              </div>
            </section>
          )}

          {/* DO NOT WANT */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number={isWalkInCloset ? "08" : "07"}
              title='Client "Do Not Want" List'
              description="Select anything the client specifically does not want included in the design."
            />

            <CheckboxGroup
              options={[
                "Sliding doors",
                "Hinged doors",
                "Glass",
                "Mirrors",
                "Open shelves",
                "Handles",
                "Dark colours",
                "Light colours",
                "Full-height cabinets",
                "Other",
              ]}
              values={form.doNotWant}
              onChange={(values) =>
                updateForm(
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
                  label="Other Item / Feature Not Wanted"
                  value={form.doNotWantOther}
                  onChange={(value) =>
                    updateForm(
                      "doNotWantOther",
                      value
                    )
                  }
                  placeholder="Please specify"
                />
              </div>
            )}
          </section>

          {/* FINAL CONFIRMATION */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            <SectionHeader
              number={isWalkInCloset ? "09" : "08"}
              title="Client Confirmation"
              description="Please review the information provided before confirming that the brief is ready for design."
            />

            <div className="space-y-6">
              <label
                className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${
                  form.informationChecked
                    ? "border-[#910B0A] bg-[#910B0A]/5"
                    : "border-neutral-200 bg-neutral-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    form.informationChecked
                  }
                  onChange={(event) =>
                    updateForm(
                      "informationChecked",
                      event.target.checked
                    )
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-[#910B0A]"
                />

                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Information provided has been
                    checked.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    I confirm that the information
                    provided above has been checked
                    before design begins.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${
                  form.readyForDesign
                    ? "border-[#910B0A] bg-[#910B0A]/5"
                    : "border-neutral-200 bg-neutral-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    form.readyForDesign
                  }
                  onChange={(event) =>
                    updateForm(
                      "readyForDesign",
                      event.target.checked
                    )
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-[#910B0A]"
                />

                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Ready for Design
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    I confirm that the current
                    requirements are ready to be used
                    as the basis for design development.
                  </p>
                </div>
              </label>

              <TextInput
                label="Prepared / Confirmed By"
                value={form.clientSignature}
                onChange={(value) =>
                  updateForm(
                    "clientSignature",
                    value
                  )
                }
                placeholder="Enter client name"
              />

              <div className="rounded-2xl bg-neutral-50 p-5">
                <p className="text-xs leading-6 text-neutral-500">
                  By submitting this brief, the client
                  confirms that the information provided
                  represents their current requirements
                  for the wardrobe or walk-in closet
                  project.
                </p>
              </div>
            </div>
          </section>

          {/* STATUS / SUBMIT */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
            {submitMessage && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm font-medium text-green-800">
                  {submitMessage}
                </p>
              </div>
            )}

            {submitError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-800">
                  {submitError}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Brief Status
                </p>

                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {briefStatus === "completed"
                    ? "Completed"
                    : requiredInformationComplete
                    ? "Ready for submission"
                    : "In progress"}
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !requiredInformationComplete
                }
                className="inline-flex min-h-[52px] items-center justify-center rounded-full px-7 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor: RED,
                }}
              >
                {isSubmitting
                  ? "Submitting..."
                  : briefStatus === "completed"
                  ? "Submit Again"
                  : "Submit Brief"}
              </button>
            </div>

            {!requiredInformationComplete && (
              <p className="mt-4 text-xs leading-5 text-neutral-400">
                Please complete the required project
                information, select the project type,
                confirm that the information has been
                checked, confirm that the brief is ready
                for design, and enter the client name
                before submitting.
              </p>
            )}
          </section>
        </div>
      </form>
    </main>
  );
}