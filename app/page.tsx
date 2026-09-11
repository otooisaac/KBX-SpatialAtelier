"use client";

import Image from "next/image";
import Link from "next/link";

const RED = "#910B0A";

const process = [
  "Consultation",
  "Client Brief",
  "Site Survey",
  "Concept",
  "Spatial Planning",
  "3D Development",
  "Technical Documentation",
  "Fabrication",
  "Installation",
];

const services = [
  {
    number: "01",
    title: "Full Interior Design",
    image: "/service-full-interior.jpg",
  },
  {
    number: "02",
    title: "Custom Kitchen Design & Installation",
    image: "/service-kitchen.jpg",
  },
  {
    number: "03",
    title: "Wardrobe & Walk-in Closet Design & Installation",
    image: "/service-wardrobe.jpg",
  },
  {
    number: "04",
    title: "TV Unit Design & Installation",
    image: "/service-tv-unit.jpg",
  },
  {
    number: "05",
    title: "Bespoke Joinery & Furniture",
    image: "/service-joinery.jpg",
  },
  {
    number: "06",
    title: "Interior Architecture & Spatial Planning",
    image: "/service-spatial-planning.jpg",
  },
  {
    number: "07",
    title: "3D Visualization & Rendering",
    image: "/service-3d-visualization.jpg",
  },
  {
    number: "08",
    title: "Commercial & Residential Interiors",
    image: "/service-commercial.jpg",
  },
];

const projects = [
  {
    title: "Residential Interior",
    type: "Interior Design",
    image: "/project-residential-interior.jpg",
  },
  {
    title: "Contemporary Residence",
    type: "Architecture",
    image: "/project-contemporary-residence.jpg",
  },
  {
    title: "Bespoke Living Space",
    type: "Bespoke Space",
    image: "/project-bespoke-living-space.jpg",
  },
];

const faqs = [
  {
    q: "What type of projects do you take on?",
    a: "We work across residential, commercial and bespoke spatial projects, depending on the requirements of the client.",
  },
  {
    q: "Can I start a project online?",
    a: "Yes. Create your client profile and complete the digital project brief to begin the process.",
  },
  {
    q: "Do you provide 3D visualizations?",
    a: "Yes. 3D design development and high-quality visualizations can form part of the project workflow.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">

      {/* ========================================================= */}
      {/* HEADER */}
      {/* ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[100px] max-w-[1400px] items-center justify-between px-5 md:px-8">

          {/* LOGO + BRAND */}
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

            <div className="ml-2 hidden sm:block leading-none">
              <p className="text-sm font-semibold tracking-tight">
                KBX Spatial Atelier
              </p>

              <p className="mt-[6px] text-[10px] uppercase tracking-[0.2em] text-black/45">
                Design Studio
              </p>
            </div>
          </Link>

          {/* NAVIGATION */}
          <nav className="hidden items-center gap-7 lg:flex">

            <a
              href="#services"
              className="text-sm text-black/65 transition hover:text-black"
            >
              Services
            </a>

            <a
              href="#process"
              className="text-sm text-black/65 transition hover:text-black"
            >
              Process
            </a>

            <a
              href="#faqs"
              className="text-sm text-black/65 transition hover:text-black"
            >
              FAQs
            </a>

            <a
              href="#about"
              className="text-sm text-black/65 transition hover:text-black"
            >
              About Us
            </a>

            <a
              href="#contact"
              className="text-sm text-black/65 transition hover:text-black"
            >
              Contact
            </a>

          </nav>

          {/* CLIENT PROFILE */}
          <Link
            href="/client-profile"
            className="flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#910B0A]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">
              ◉
            </span>

            <span className="hidden sm:inline">
              Client&apos;s Profile
            </span>

            <span className="sm:hidden">
              Profile
            </span>
          </Link>

        </div>
      </header>

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="relative min-h-[calc(100vh-100px)] overflow-hidden border-b border-black/10">

        {/* HERO BACKGROUND IMAGE */}
        <Image
          src="/hero.interior.jpg"
          alt="KBX Spatial Atelier interior design"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* VERY SUBTLE OVERLAY */}
        <div className="absolute inset-0 bg-white/10" />

        {/* HERO CONTENT */}
        <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-5 py-20 md:px-8">

          <div className="mx-auto max-w-[1100px] text-center text-black">

            {/* LABEL */}
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-medium backdrop-blur-md">

              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: RED }}
              />

              Spatial Design Studio

            </div>

            {/* MAIN HEADING */}
            <h1 className="mx-auto max-w-5xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-6xl lg:text-7xl">

              Sophisticated environments.
              <br />

              <span style={{ color: RED }}>
                Timeless design.
              </span>

            </h1>

            {/* DESCRIPTION */}
            <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-white md:text-base">

              Interior Design
              <span className="mx-2 text-white/60">•</span>
              Architecture
              <span className="mx-2 text-white/60">•</span>
              Bespoke Space

            </p>

            {/* BUTTONS */}
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                href="/client-profile"
                className="rounded-full px-7 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: RED }}
              >
                Start a Project
              </Link>

              <Link
                href="/consultation"
                className="rounded-full border border-black/20 bg-white/75 px-7 py-3.5 text-sm font-semibold text-black backdrop-blur-md transition hover:bg-white"
              >
                Book a Free Consultation
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* APP QUICK ACCESS */}
      {/* ========================================================= */}

      <section className="px-5 py-8 md:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-3 md:grid-cols-4">

          {/* START A PROJECT */}
          <Link
            href="/client-profile"
            className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/25"
          >

            <div className="mb-8 flex items-center justify-between">

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg text-white">
                ✦
              </span>

              <span className="text-xs text-black/35">
                01
              </span>

            </div>

            <p className="text-sm font-semibold">
              Start a Project
            </p>

            <p className="mt-1 text-xs leading-5 text-black/45">
              Tell us what you want to create.
            </p>

          </Link>

          {/* CONSULTATION */}
          <Link
            href="/consultation"
            className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/25"
          >

            <div className="mb-8 flex items-center justify-between">

              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-white"
                style={{ backgroundColor: RED }}
              >
                ◷
              </span>

              <span className="text-xs text-black/35">
                02
              </span>

            </div>

            <p className="text-sm font-semibold">
              Consultation
            </p>

            <p className="mt-1 text-xs leading-5 text-black/45">
              Discuss your project with KBX.
            </p>

          </Link>

          {/* PROCESS */}
          <a
            href="#process"
            className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/25"
          >

            <div className="mb-8 flex items-center justify-between">

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg text-white">
                →
              </span>

              <span className="text-xs text-black/35">
                03
              </span>

            </div>

            <p className="text-sm font-semibold">
              Our Process
            </p>

            <p className="mt-1 text-xs leading-5 text-black/45">
              See how your project moves forward.
            </p>

          </a>

          {/* CONTACT */}
          <a
            href="#contact"
            className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/25"
          >

            <div className="mb-8 flex items-center justify-between">

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg text-white">
                ↗
              </span>

              <span className="text-xs text-black/35">
                04
              </span>

            </div>

            <p className="text-sm font-semibold">
              Contact Studio
            </p>

            <p className="mt-1 text-xs leading-5 text-black/45">
              Have a question? Get in touch.
            </p>

          </a>

        </div>
      </section>

      {/* ========================================================= */}
      {/* WHAT WE DO */}
      {/* ========================================================= */}

      <section
        id="services"
        className="px-5 py-12 md:px-8 md:py-16"
      >

        <div className="mx-auto max-w-[1400px]">

          {/* SECTION HEADER */}
          <div className="mb-8 flex items-end justify-between">

            <div>

              <p
                className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: RED }}
              >
                What We Do
              </p>

              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Spaces designed around you.
              </h2>

            </div>

            <span className="hidden text-xs text-black/35 sm:block">
              08 services
            </span>

          </div>

          {/* SERVICES GRID */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {services.map((service) => (
              <div
                key={service.number}
                className="group relative overflow-hidden rounded-2xl border border-black/10 bg-[#ecece9]"
              >

                {/* SERVICE IMAGE */}
                <div className="relative aspect-[4/5] overflow-hidden">

                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  {/* DARK GRADIENT */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* NUMBER */}
                  <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[10px] font-semibold text-black backdrop-blur-sm">
                    {service.number}
                  </div>

                  {/* SERVICE TEXT */}
                  <div className="absolute inset-x-0 bottom-0 p-5">

                    <h3 className="max-w-[280px] text-lg font-semibold leading-tight text-white">
                      {service.title}
                    </h3>

                    <div
                      className="mt-4 h-px w-8 transition-all duration-500 group-hover:w-16"
                      style={{ backgroundColor: RED }}
                    />

                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* PROJECTS */}
      {/* ========================================================= */}

      <section className="border-y border-black/10 bg-white px-5 py-12 md:px-8 md:py-16">

        <div className="mx-auto max-w-[1400px]">

          <div className="mb-8 flex items-end justify-between">

            <div>

              <p
                className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: RED }}
              >
                Selected Projects
              </p>

              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Spaces in progress
              </h2>

            </div>

            <button className="hidden rounded-full border border-black/10 px-4 py-2 text-xs font-medium sm:block">
              View all projects →
            </button>

          </div>

          <div className="grid gap-3 md:grid-cols-3">

            {projects.map((project) => (
              <div
                key={project.title}
                className="group"
              >

                {/* PROJECT IMAGE */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/10 bg-[#ecece9]">

                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  {/* PROJECT TYPE */}
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                    {project.type}
                  </div>

                </div>

                {/* PROJECT TITLE */}
                <div className="flex items-center justify-between px-1 pt-4">

                  <p className="text-sm font-semibold">
                    {project.title}
                  </p>

                  <span className="text-black/30 transition group-hover:text-black">
                    ↗
                  </span>

                </div>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* WHY KBX */}
      {/* ========================================================= */}

      <section
        id="about"
        className="px-5 py-12 md:px-8 md:py-16"
      >

        <div className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-[0.8fr_1.2fr]">

          <div>

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: RED }}
            >
              Why KBX
            </p>

            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Design with intention, not decoration.
            </h2>

          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            {[
              [
                "01",
                "Purposeful Design",
                "Every decision begins with how the space needs to work.",
              ],
              [
                "02",
                "Attention to Detail",
                "Materials, proportions and details are developed carefully.",
              ],
              [
                "03",
                "End-to-End Thinking",
                "Design is connected to documentation, fabrication and installation.",
              ],
              [
                "04",
                "Client-Centred",
                "Your requirements remain central throughout the project.",
              ],
            ].map(([num, title, description]) => (
              <div
                key={num}
                className="rounded-2xl border border-black/10 bg-white p-5"
              >

                <span
                  className="text-xs font-semibold"
                  style={{ color: RED }}
                >
                  {num}
                </span>

                <h3 className="mt-8 text-sm font-semibold">
                  {title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-black/45">
                  {description}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* PROCESS */}
      {/* ========================================================= */}

      <section
        id="process"
        className="bg-black px-5 py-12 text-white md:px-8 md:py-16"
      >

        <div className="mx-auto max-w-[1400px]">

          <div className="mb-10">

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Project Workflow
            </p>

            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              From brief to finished space.
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3 lg:grid-cols-5">

            {process.map((item, index) => (
              <div
                key={item}
                className="bg-black p-5 transition hover:bg-[#910B0A]"
              >

                <span className="text-[10px] text-white/35">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <p className="mt-8 text-sm font-medium">
                  {item}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* FAQ */}
      {/* ========================================================= */}

      <section
        id="faqs"
        className="px-5 py-12 md:px-8 md:py-16"
      >

        <div className="mx-auto max-w-[1000px]">

          <div className="mb-8 text-center">

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: RED }}
            >
              FAQs
            </p>

            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Frequently asked questions
            </h2>

          </div>

          <div className="space-y-2">

            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-black/10 bg-white"
              >

                <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium">

                  {faq.q}

                  <span className="ml-4 text-lg text-black/40 transition group-open:rotate-45">
                    +
                  </span>

                </summary>

                <p className="px-5 pb-5 text-sm leading-6 text-black/50">
                  {faq.a}
                </p>

              </details>
            ))}

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* CONTACT */}
      {/* ========================================================= */}

      <section
        id="contact"
        className="px-5 pb-12 md:px-8 md:pb-16"
      >

        <div className="mx-auto max-w-[1400px] overflow-hidden rounded-3xl bg-[#910B0A] text-white">

          <div className="grid md:grid-cols-[1fr_0.9fr]">

            {/* CONTACT INFORMATION */}
            <div className="p-7 md:p-10">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Get In Touch
              </p>

              <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                Have a space in mind?
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
                Tell us a little about your project and we&apos;ll get back to you.
              </p>

              <div className="mt-8 space-y-3">

                <p className="text-xs uppercase tracking-[0.15em] text-white/45">
                  Contact
                </p>

                <a
                  href="tel:+233558167009"
                  className="block text-sm font-medium transition hover:text-white/70"
                >
                  +233 558 167 009
                </a>

                <a
                  href="tel:+233209468411"
                  className="block text-sm font-medium transition hover:text-white/70"
                >
                  +233 209 468 411
                </a>

              </div>

            </div>

            {/* CONTACT FORM */}
            <form className="space-y-3 bg-black/10 p-7 md:p-10">

              <input
                type="text"
                placeholder="Your name"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/45 focus:border-white/40"
              />

              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/45 focus:border-white/40"
              />

              <input
                type="tel"
                placeholder="Contact number"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/45 focus:border-white/40"
              />

              <textarea
                placeholder="Tell us about your project..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/45 focus:border-white/40"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Send Enquiry →
              </button>

            </form>

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <footer className="border-t border-black/10 bg-white px-5 py-8 md:px-8">

        <div className="mx-auto max-w-[1400px]">

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

            {/* FOOTER BRAND */}
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
                Creating thoughtful, sophisticated environments through design,
                architecture and bespoke spatial solutions.
              </p>

            </div>

            {/* FOOTER CONTACT */}
            <div className="flex flex-col gap-4 text-xs text-black/50">

              <div className="flex flex-wrap gap-5">

                <a
                  href="tel:+233558167009"
                  className="transition hover:text-black"
                >
                  ☎ +233 558 167 009
                </a>

                <a
                  href="tel:+233209468411"
                  className="transition hover:text-black"
                >
                  ☎ +233 209 468 411
                </a>

              </div>

              <div className="flex flex-wrap gap-5">

                <a
                  href="https://www.tiktok.com/@kbx_spatial_atelier?_r=1&_t=ZS-99XAWb0oTBY"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-black"
                >
                  TikTok ↗
                </a>

                <a
                  href="https://www.instagram.com/kbx_spatial_atelier/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-black"
                >
                  Instagram ↗
                </a>

                <a
                  href="https://www.facebook.com/share/1cKce7UyzT/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-black"
                >
                  Facebook ↗
                </a>

              </div>

            </div>

          </div>

          {/* COPYRIGHT */}
          <div className="mt-8 border-t border-black/10 pt-5">

            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.15em] text-black/30 sm:flex-row sm:justify-between">

              <span>
                © 2026 KBX Spatial Atelier
              </span>

              <span>
                Designed with intention.
              </span>

            </div>

            <p className="mt-4 text-center text-[9px] text-black/25">
              Website developed by Isaac Otoo, CEO of KBX Spatial Atelier.
            </p>

          </div>

        </div>

      </footer>

    </main>
  );
}