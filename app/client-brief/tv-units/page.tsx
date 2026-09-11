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

    const currentClientId = window.localStorage.getItem(
      CURRENT_CLIENT_KEY
    );

    if (accounts && currentClientId) {
      const currentClient = accounts.find(
        (account) => account.id === currentClientId
      );

      if (currentClient) {
        return currentClient;
      }
    }

    const legacyClient =
      readStoredData<ClientAccount>(LEGACY_CLIENT_KEY);

    return legacyClient;
  } catch {
    return null;
  }
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(
        selected.filter((item) => item !== option)
      );
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-800">
        {label}
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const checked = selected.includes(option);

          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                checked
                  ? "border-[#910B0A] bg-[#910B0A]/5"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleOption(option)}
                className="h-4 w-4 rounded"
                style={{ accentColor: RED }}
              />

              <span className="text-gray-700">
                {option}
              </span>
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
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-800">
        {label}
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const checked = value === option;

          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                checked
                  ? "border-[#910B0A] bg-[#910B0A]/5"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={`radio-${label}`}
                value={option}
                checked={checked}
                onChange={(event) =>
                  onChange(event.target.value)
                }
                className="h-4 w-4"
                style={{ accentColor: RED }}
              />

              <span className="text-gray-700">
                {option}
              </span>
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
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="ml-1 text-[#910B0A]">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#910B0A] focus:ring-2 focus:ring-[#910B0A]/10"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="ml-1 text-[#910B0A]">
            *
          </span>
        )}
      </label>

      <textarea
        value={value}
        placeholder={placeholder}
        required={required}
        rows={5}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#910B0A] focus:ring-2 focus:ring-[#910B0A]/10"
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
    <div className="mb-8 border-b border-gray-100 pb-5">
      <div className="mb-2 flex items-center gap-3">
        <span
          className="text-xs font-bold tracking-[0.25em]"
          style={{ color: RED }}
        >
          {number}
        </span>

        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          {title}
        </h2>
      </div>

      {description && (
        <p className="max-w-3xl text-sm leading-6 text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}

function Question({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="space-y-3">{children}</div>;
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

  const requiredInformationComplete =
    useMemo(() => {
      return (
        form.projectName.trim() !== "" &&
        form.clientName.trim() !== "" &&
        form.projectLocation.trim() !== "" &&
        form.date.trim() !== "" &&
        form.projectType.length > 0 &&
        form.designGoal.trim() !== "" &&
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

      const completedData: SavedBrief = {
        client,
        form,
        completed: true,
        submitted: true,
        completedAt,
        savedAt: completedAt,
      };

      const formData = new FormData();

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

      /*
       * Identify this submission as a TV Unit brief.
       * The unified /api/send-brief route uses this
       * value to generate the correct PDF and document.
       */

      formData.append(
        "briefType",
        "tv_unit"
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

      setForm((previous) => ({
        ...previous,
      }));

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
        <div className="text-sm text-gray-500">
          Loading client brief...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-900">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">

          <Link
            href="/client-portal"
            className="flex items-center"
          >
            <Image
              src="/kbx-logo.svg"
              alt="KBX Spatial Atelier"
              width={150}
              height={45}
              priority
            />
          </Link>

          <div className="flex items-center gap-5">

            <span className="hidden text-sm text-gray-500 sm:block">
              Client Brief
            </span>

            <Link
              href="/client-portal"
              className="text-sm font-medium transition hover:text-[#910B0A]"
              style={{ color: RED }}
            >
              Back to Portal
            </Link>

          </div>

        </div>
      </header>

      {/* INTRO */}

      <section className="px-5 pb-10 pt-14 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">

          <p
            className="mb-4 text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: RED }}
          >
            Project Brief 04
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
            TV Unit
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-500">
            Tell us about your television, storage needs,
            electronics, preferred finishes and design
            direction so we can develop the right TV unit
            for your space.
          </p>

          {client && (
            <div className="mt-6 inline-flex items-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 shadow-sm">
              Prepared for{" "}
              <span className="ml-1 font-semibold text-gray-900">
                {client.name}
              </span>
            </div>
          )}

        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl space-y-7 px-5 pb-20 sm:px-8"
      >

        {/* 01 PROJECT INFORMATION */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="01"
            title="PROJECT INFORMATION"
          />

          <div className="grid gap-6 md:grid-cols-2">

            <TextInput
              label="Project Name"
              value={form.projectName}
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
              value={form.clientName}
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

          <div className="mt-7">
            <CheckboxGroup
              label="Project Type"
              options={[
                "New TV Unit",
                "Replacement of existing TV Unit",
                "Modification of existing unit",
                "Other",
              ]}
              selected={
                form.projectType
              }
              onChange={(values) =>
                updateField(
                  "projectType",
                  values
                )
              }
            />
          </div>

          {form.projectType.includes(
            "Other"
          ) && (
            <div className="mt-6">
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

        </section>

        {/* 02 GENERAL DESIGN REQUIREMENTS */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="02"
            title="GENERAL DESIGN REQUIREMENTS"
          />

          <div className="space-y-7">

            <TextArea
              label="What does the client want to achieve?"
              value={form.designGoal}
              required
              placeholder="Describe the overall purpose, look or experience the client wants from the TV unit."
              onChange={(value) =>
                updateField(
                  "designGoal",
                  value
                )
              }
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
              selected={
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

            <RadioGroup
              label="Are client reference images available?"
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
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">

                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Attach Reference Images
                </label>

                <p className="mb-4 text-sm leading-6 text-gray-500">
                  Upload images that communicate the
                  client&apos;s preferred style, layout,
                  finishes or details.
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={
                    handleReferenceImages
                  }
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#910B0A] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
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
                          className="rounded-lg bg-white px-4 py-2 text-sm text-gray-600"
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

        {/* 03 TV REQUIREMENTS */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="03"
            title="TV REQUIREMENTS"
          />

          <div className="space-y-7">

            <RadioGroup
              label="Does the client already have the TV?"
              options={[
                "Yes",
                "No",
              ]}
              value={form.hasTV}
              onChange={(value) =>
                updateField(
                  "hasTV",
                  value
                )
              }
            />

            {form.hasTV ===
              "Yes" && (
              <div className="rounded-2xl bg-gray-50 p-5 sm:p-6">

                <h3 className="mb-5 text-sm font-semibold text-gray-900">
                  Existing TV Information
                </h3>

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
                    value={form.tvWidth}
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
                    value={form.tvHeight}
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
                    value={form.tvDepth}
                    type="number"
                    onChange={(value) =>
                      updateField(
                        "tvDepth",
                        value
                      )
                    }
                  />

                </div>

              </div>
            )}

            {form.hasTV ===
              "No" && (
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
            )}

            <RadioGroup
              label="TV Installation"
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

          </div>

        </section>

        {/* 04 STORAGE REQUIREMENTS */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="04"
            title="STORAGE REQUIREMENTS"
          />

          <div className="space-y-7">

            <RadioGroup
              label="Does the client want storage?"
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

            {form.storageRequired ===
              "Yes" && (
              <>
                <CheckboxGroup
                  label="Required Storage"
                  options={[
                    "Drawers",
                    "Closed cabinets",
                    "Open shelves",
                    "Display shelves",
                    "Glass cabinets",
                    "Floating cabinets",
                    "Other",
                  ]}
                  selected={
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
                )}

                <CheckboxGroup
                  label="What will be stored?"
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
                  selected={
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
                )}

              </>
            )}

          </div>

        </section>

        {/* 05 ELECTRONICS & CABLE MANAGEMENT */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="05"
            title="ELECTRONICS & CABLE MANAGEMENT"
          />

          <div className="space-y-7">

            <CheckboxGroup
              label="Equipment to be accommodated"
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
              selected={
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
            )}

            <RadioGroup
              label="Cable management required?"
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

            <RadioGroup
              label="Equipment should be"
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

          </div>

        </section>

        {/* 06 DESIGN FEATURES */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="06"
            title="DESIGN FEATURES"
          />

          <div className="space-y-7">

            <CheckboxGroup
              label="Does the client want"
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
              selected={
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
            )}

            <RadioGroup
              label="Does the client want wall cladding / paneling behind the TV?"
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
            )}

            <CheckboxGroup
              label="Main Finish"
              options={[
                "Matte",
                "Gloss",
                "Wood grain",
                "Veneer",
                "Laminate",
                "Other",
              ]}
              selected={
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
            )}

          </div>

        </section>

        {/* 07 DO NOT WANT */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="07"
            title={'CLIENT\'S "DO NOT WANT" LIST'}
            description="Select anything the client specifically does not want included in the TV unit design."
          />

          <div className="space-y-6">

            <CheckboxGroup
              label="Client does NOT want"
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
              selected={
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
            )}

          </div>

        </section>

        {/* 08 FINAL CONFIRMATION */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <SectionHeader
            number="08"
            title="FINAL CONFIRMATION"
            description="Please review the complete brief before submitting."
          />

          <div className="space-y-6">

            {/* COMPULSORY CONFIRMATION 1 */}

            <label
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                form.informationChecked
                  ? "border-[#910B0A] bg-[#910B0A]/5"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
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

              <span className="text-sm leading-6 text-gray-700">
                I confirm that the information provided
                above has been checked and represents the
                client&apos;s current requirements and the
                measured site conditions.

                <span className="ml-1 font-semibold text-[#910B0A]">
                  *
                </span>
              </span>

            </label>

            {/* COMPULSORY CONFIRMATION 2 */}

            <label
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                form.clientRequirementsConfirmed
                  ? "border-[#910B0A] bg-[#910B0A]/5"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
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

              <span className="text-sm leading-6 text-gray-700">
                I confirm that the client&apos;s
                requirements have been accurately recorded
                in this brief.

                <span className="ml-1 font-semibold text-[#910B0A]">
                  *
                </span>
              </span>

            </label>

            <div className="grid gap-6 md:grid-cols-2">

              <TextInput
                label="Prepared By"
                value={
                  form.clientSignature
                }
                required
                placeholder="Name of person preparing the brief"
                onChange={(value) =>
                  updateField(
                    "clientSignature",
                    value
                  )
                }
              />

              <RadioGroup
                label="Ready for Design"
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

            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

              <p className="text-xs leading-6 text-gray-500">
                <span className="font-semibold text-gray-700">
                  Important:
                </span>{" "}
                Both confirmation checkboxes must be
                selected before the brief can be submitted.
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

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
                Your completed brief will be securely
                processed and prepared for the KBX Spatial
                Atelier design process.
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

      <footer className="border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <p>
            © {new Date().getFullYear()} KBX Spatial
            Atelier
          </p>

          <p>
            Interior Design • Spatial Planning •
            Visualization
          </p>

        </div>

      </footer>

    </main>
  );
}