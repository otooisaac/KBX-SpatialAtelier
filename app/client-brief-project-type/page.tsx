"use client";

import Image from "next/image";
import Link from "next/link";

const RED = "#910B0A";

const projectTypes = [
  {
    number: "01",
    title: "Full Interior Project",
    description:
      "Complete interior design for your home, apartment, office, hospitality or commercial space.",
    href: "/client-brief/full-interior",
    tag: "Complete Interior",
  },
  {
    number: "02",
    title: "Kitchen & Storerooms",
    description:
      "Kitchen design, cabinetry, pantry, storerooms, appliance integration and storage solutions.",
    href: "/client-brief/kitchen",
    tag: "Kitchen & Storage",
  },
  {
    number: "03",
    title: "Wardrobes & Walk-in Closets",
    description:
      "Custom wardrobes, dressing rooms, walk-in closets and organized clothing storage.",
    href: "/client-brief/wardrobes",
    tag: "Wardrobes",
  },
  {
    number: "04",
    title: "TV Units",
    description:
      "Custom TV walls, entertainment units, media storage and feature wall solutions.",
    href: "/client-brief/tv-unit",
    tag: "Entertainment",
  },
];

export default function ClientBriefProjectType() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">

      {/* HEADER */}

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
                Client Brief
              </p>
            </div>
          </Link>

          {/* BACK */}

          <Link
            href="/client-portal"
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black/30"
          >
            ← Client Portal
          </Link>

        </div>
      </header>

      {/* MAIN */}

      <section className="px-5 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1100px]">

          {/* INTRO */}

          <div className="mx-auto max-w-3xl text-center">

            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{
                color: RED,
              }}
            >
              KBX Client Brief
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              What are we
              <br />
              designing for you?
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-black/45 md:text-base">
              Select the type of project you would like KBX Spatial Atelier
              to work on. You will then be taken to a brief specifically
              designed for your project.
            </p>

          </div>

          {/* PROJECT TYPES */}

          <div className="mt-12 grid gap-5 md:grid-cols-2">

            {projectTypes.map((project) => (

              <Link
                key={project.number}
                href={project.href}
                className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#910B0A]/30 hover:shadow-xl md:p-9"
              >

                {/* TOP ROW */}

                <div className="flex items-start justify-between">

                  {/* NUMBER */}

                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{
                      backgroundColor: RED,
                    }}
                  >
                    {project.number}
                  </div>

                  {/* TAG */}

                  <span className="rounded-full bg-[#f7f7f5] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-black/40">
                    {project.tag}
                  </span>

                </div>

                {/* CONTENT */}

                <div className="mt-8">

                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {project.title}
                  </h2>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-black/45">
                    {project.description}
                  </p>

                </div>

                {/* BOTTOM */}

                <div className="mt-10 flex items-center justify-between border-t border-black/10 pt-5">

                  <span className="text-xs text-black/35">
                    Start project brief
                  </span>

                  <span
                    className="text-sm font-semibold transition duration-300 group-hover:translate-x-1"
                    style={{
                      color: RED,
                    }}
                  >
                    Select →
                  </span>

                </div>

                {/* HOVER DETAIL */}

                <div
                  className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
                  style={{
                    backgroundColor: RED,
                  }}
                />

              </Link>

            ))}

          </div>

          {/* HELP SECTION */}

          <div className="mt-8 rounded-3xl bg-black p-7 text-white md:p-9">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div>

                <p
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: RED,
                  }}
                >
                  Not sure?
                </p>

                <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                  We can help you choose.
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                  If your project involves several of these services, select
                  the option that best represents your main requirement.
                  You can tell us about the other areas inside your brief.
                </p>

              </div>

              <Link
                href="/#contact"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-[#910B0A] hover:text-white"
              >
                Contact KBX →
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}

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
                Creating thoughtful, sophisticated environments through
                design, architecture and bespoke spatial solutions.
              </p>

            </div>

            {/* FOOTER LINKS */}

            <div className="flex flex-wrap gap-5 text-xs text-black/50">

              <Link
                href="/"
                className="transition hover:text-black"
              >
                Website ↗
              </Link>

              <Link
                href="/client-portal"
                className="transition hover:text-black"
              >
                Client Portal ↗
              </Link>

              <Link
                href="/client-profile"
                className="transition hover:text-black"
              >
                Client Profile ↗
              </Link>

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