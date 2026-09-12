"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

const RED = "#910B0A";

type ConsultationMethod =
  | "whatsapp"
  | "face-to-face"
  | "";

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export default function ConsultationPage() {
  const [method, setMethod] = useState<ConsultationMethod>("");
  const [faceToFaceAccepted, setFaceToFaceAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    areaCity: "",
    specificLocation: "",
    preferredDate: "",
    preferredTime: "",
    alternativeDate: "",
    alternativeTime: "",
    message: "",
  });

  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleMethodChange(
    selectedMethod: ConsultationMethod
  ) {
    setMethod(selectedMethod);

    if (selectedMethod !== "face-to-face") {
      setFaceToFaceAccepted(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!method) {
      setError("Please select your preferred consultation method.");
      return;
    }

    if (method === "face-to-face" && !faceToFaceAccepted) {
      setError(
        "Please confirm that you have read and understood the Face-to-Face Consultation terms."
      );
      return;
    }

    if (!confirmed) {
      setError(
        "Please confirm that the information provided is accurate."
      );
      return;
    }

    /*
      The consultation submission will be connected to the
      KBX email + PDF workflow after the page UI is confirmed.
    */

    setSubmitted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[100px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <Image
              src="/kbx-logo.svg"
              alt="KBX Spatial Atelier"
              width={54}
              height={54}
              priority
              className="h-[52px] w-[52px]"
            />

            <div className="hidden sm:block">
              <p className="text-[15px] font-semibold tracking-tight">
                KBX Spatial Atelier
              </p>
              <p className="text-[9px] font-medium tracking-[0.28em] text-black/45">
                DESIGN STUDIO
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium transition hover:border-black/25 sm:block"
            >
              Back to Studio
            </Link>

            <Link
              href="/client-profile"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: RED }}
            >
              Client Profile
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE INTRO */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-[1100px] px-5 pb-14 pt-16 sm:px-8 lg:px-12 lg:pb-20 lg:pt-20">
          <div className="max-w-[780px]">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-black/55 transition hover:text-black"
            >
              <span>←</span>
              Back to KBX Spatial Atelier
            </Link>

            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: RED }}
            >
              Consultation
            </p>

            <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Let&apos;s discuss your space.
            </h1>

            <p className="mt-6 max-w-[700px] text-base leading-7 text-black/60 sm:text-lg">
              Book a free consultation with KBX Spatial Atelier to discuss
              your ideas, requirements and the direction of your project.
              We&apos;ll use the consultation to understand what you need and
              guide you toward the right next step.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-black/60">
                Free Consultation
              </div>

              <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-black/60">
                Personal Consultation
              </div>

              <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-black/60">
                No Project Brief Required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS MESSAGE */}
      {submitted && (
        <section className="mx-auto max-w-[1100px] px-5 pt-10 sm:px-8 lg:px-12">
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-8">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white">
                ✓
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Consultation request prepared
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/65">
                  Your consultation details have been captured successfully.
                  The next step is for a KBX Project Manager to review the
                  request and contact you to confirm the appointment.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FORM */}
      <section className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* SECTION 01 */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: RED }}
              >
                01
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Client Details
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/55">
                Tell us how we can reach you.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Full Name"
                required
                value={form.fullName}
                onChange={(value) =>
                  updateField("fullName", value)
                }
                placeholder="Your full name"
              />

              <Field
                label="Email Address"
                required
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField("email", value)
                }
                placeholder="you@example.com"
              />

              <Field
                label="Phone / WhatsApp Number"
                required
                type="tel"
                value={form.phone}
                onChange={(value) =>
                  updateField("phone", value)
                }
                placeholder="+233..."
              />

              <Field
                label="Area / City"
                required
                value={form.areaCity}
                onChange={(value) =>
                  updateField("areaCity", value)
                }
                placeholder="e.g. Spintex, Accra"
              />

              <div className="sm:col-span-2">
                <Field
                  label="Specific Location / Address"
                  required
                  value={form.specificLocation}
                  onChange={(value) =>
                    updateField("specificLocation", value)
                  }
                  placeholder="Street, landmark, estate, building or other useful location details"
                />

                <p className="mt-2 text-xs leading-5 text-black/45">
                  For remote consultations, a general location is sufficient.
                  For face-to-face consultations, please provide enough detail
                  for us to identify the meeting location.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 02 */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: RED }}
              >
                02
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Consultation Method
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/55">
                Choose how you would like to meet with us.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* WHATSAPP */}
              <button
                type="button"
                onClick={() =>
                  handleMethodChange("whatsapp")
                }
                className={`text-left rounded-2xl border p-6 transition ${
                  method === "whatsapp"
                    ? "border-[#910B0A] bg-[#910B0A]/[0.035] shadow-sm"
                    : "border-black/10 bg-[#fafaf8] hover:border-black/25"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">
                      WhatsApp Video Call / Phone Call
                    </p>

                    <p
                      className="mt-1 text-xs font-medium uppercase tracking-[0.12em]"
                      style={{
                        color:
                          method === "whatsapp"
                            ? RED
                            : "rgba(0,0,0,0.45)",
                      }}
                    >
                      Remote Consultation
                    </p>
                  </div>

                  <SelectionIndicator
                    selected={method === "whatsapp"}
                  />
                </div>

                <p className="mt-5 text-sm leading-6 text-black/60">
                  A KBX Project Manager will contact you directly via WhatsApp
                  video call or phone call using the contact details you
                  provide, based on your selected date and time.
                </p>
              </button>

              {/* FACE TO FACE */}
              <button
                type="button"
                onClick={() =>
                  handleMethodChange("face-to-face")
                }
                className={`text-left rounded-2xl border p-6 transition ${
                  method === "face-to-face"
                    ? "border-[#910B0A] bg-[#910B0A]/[0.035] shadow-sm"
                    : "border-black/10 bg-[#fafaf8] hover:border-black/25"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">
                      Face-to-Face Consultation
                    </p>

                    <p
                      className="mt-1 text-xs font-medium uppercase tracking-[0.12em]"
                      style={{
                        color:
                          method === "face-to-face"
                            ? RED
                            : "rgba(0,0,0,0.45)",
                      }}
                    >
                      In-Person Consultation
                    </p>
                  </div>

                  <SelectionIndicator
                    selected={method === "face-to-face"}
                  />
                </div>

                <p className="mt-5 text-sm leading-6 text-black/60">
                  A KBX Project Manager will meet you at the location provided,
                  based on your selected date and time. Transportation costs
                  for the visit are the responsibility of the client and will
                  be settled after the consultation.
                </p>

                <p className="mt-4 text-sm leading-6 text-black/60">
                  KBX will contact you before the scheduled appointment to
                  confirm the meeting, location and arrangements.
                </p>
              </button>
            </div>

            {/* FACE TO FACE TERMS */}
            {method === "face-to-face" && (
              <div className="mt-6 rounded-2xl border border-[#910B0A]/20 bg-[#910B0A]/[0.035] p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={faceToFaceAccepted}
                    onChange={(event) =>
                      setFaceToFaceAccepted(
                        event.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-[#910B0A]"
                  />

                  <span className="text-sm leading-6 text-black/70">
                    I have read and understood the Face-to-Face Consultation
                    terms, including that transportation costs for the visit
                    are the responsibility of the client and will be settled
                    after the consultation.
                  </span>
                </label>
              </div>
            )}
          </section>

          {/* SECTION 03 */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: RED }}
              >
                03
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Schedule
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/55">
                Select your preferred date and time. We&apos;ll contact you to
                confirm the appointment.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Preferred Consultation Date"
                required
                type="date"
                value={form.preferredDate}
                onChange={(value) =>
                  updateField("preferredDate", value)
                }
              />

              <SelectField
                label="Preferred Consultation Time"
                required
                value={form.preferredTime}
                onChange={(value) =>
                  updateField("preferredTime", value)
                }
                options={TIME_SLOTS}
                placeholder="Select a time"
              />

              <Field
                label="Alternative Date"
                type="date"
                value={form.alternativeDate}
                onChange={(value) =>
                  updateField("alternativeDate", value)
                }
              />

              <SelectField
                label="Alternative Time"
                value={form.alternativeTime}
                onChange={(value) =>
                  updateField("alternativeTime", value)
                }
                options={TIME_SLOTS}
                placeholder="Select an alternative time"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-[#fafaf8] p-5">
              <div className="flex gap-3">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: RED }}
                >
                  i
                </div>

                <p className="text-sm leading-6 text-black/60">
                  Your selected date and time are a consultation request and
                  are not confirmed until a KBX Project Manager contacts you.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 04 */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: RED }}
              >
                04
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                What would you like to discuss?
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/55">
                This is optional. You do not need to provide a detailed
                project brief at this stage.
              </p>
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-semibold"
              >
                Brief Message
                <span className="ml-1 font-normal text-black/40">
                  (Optional)
                </span>
              </label>

              <textarea
                id="message"
                value={form.message}
                onChange={(event) =>
                  updateField("message", event.target.value)
                }
                rows={6}
                placeholder="I would like to discuss furnishing my new apartment."
                className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafaf8] px-4 py-4 text-sm outline-none transition placeholder:text-black/30 focus:border-[#910B0A] focus:bg-white"
              />
            </div>
          </section>

          {/* SECTION 05 */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: RED }}
              >
                05
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Confirmation
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/55">
                Please review your information before requesting your
                consultation.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-[#fafaf8] p-5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
                className="mt-1 h-4 w-4 shrink-0 accent-[#910B0A]"
              />

              <span className="text-sm leading-6 text-black/70">
                I confirm that the information provided is accurate.
              </span>
            </label>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-5 text-black/45">
                By submitting this form, you are requesting a consultation.
                The appointment becomes confirmed only after contact from a
                KBX Project Manager.
              </p>

              <button
                type="submit"
                className="rounded-full px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: RED }}
              >
                REQUEST FREE CONSULTATION
              </button>
            </div>
          </section>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/"
                className="flex items-center gap-3"
              >
                <Image
                  src="/kbx-logo.svg"
                  alt="KBX Spatial Atelier"
                  width={48}
                  height={48}
                  className="h-12 w-12"
                />

                <div>
                  <p className="text-sm font-semibold">
                    KBX Spatial Atelier
                  </p>

                  <p className="text-[9px] font-medium tracking-[0.25em] text-black/40">
                    DESIGN STUDIO
                  </p>
                </div>
              </Link>

              <p className="mt-4 max-w-md text-sm leading-6 text-black/50">
                Interior design, architecture, spatial planning, bespoke
                joinery and 3D visualization.
              </p>
            </div>

            <div className="text-sm text-black/55">
              <p className="font-semibold text-black">
                Contact Studio
              </p>

              <a
                href="tel:+233558167009"
                className="mt-2 block hover:text-black"
              >
                +233 558 167 009
              </a>

              <a
                href="tel:+233209468411"
                className="mt-1 block hover:text-black"
              >
                +233 209 468 411
              </a>
            </div>
          </div>

          <div className="mt-10 border-t border-black/10 pt-6 text-xs text-black/40">
            © {new Date().getFullYear()} KBX Spatial Atelier. All rights
            reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* -------------------------------------------------------
   FIELD COMPONENT
------------------------------------------------------- */

function Field({
  label,
  required = false,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
        {required && (
          <span
            className="ml-1"
            style={{ color: RED }}
          >
            *
          </span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-[#fafaf8] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-[#910B0A] focus:bg-white"
      />
    </div>
  );
}

/* -------------------------------------------------------
   SELECT FIELD
------------------------------------------------------- */

function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
        {required && (
          <span
            className="ml-1"
            style={{ color: RED }}
          >
            *
          </span>
        )}
      </label>

      <select
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`w-full appearance-none rounded-2xl border border-black/10 bg-[#fafaf8] px-4 py-3.5 text-sm outline-none transition focus:border-[#910B0A] focus:bg-white ${
          value
            ? "text-black"
            : "text-black/35"
        }`}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* -------------------------------------------------------
   SELECTION INDICATOR
------------------------------------------------------- */

function SelectionIndicator({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
        selected
          ? "border-[#910B0A]"
          : "border-black/20"
      }`}
      style={{
        backgroundColor: selected
          ? RED
          : "transparent",
      }}
    >
      {selected && (
        <span className="h-2 w-2 rounded-full bg-white" />
      )}
    </span>
  );
}