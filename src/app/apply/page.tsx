"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type SyllabusBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] }
  | {
    type: "table";
    title?: string;
    headers: [string, string, string, string];
    rows: Array<[string, string, string, string]>;
  };

function isAllCapsHeading(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) return false;
  return letters === letters.toUpperCase();
}

function parseCompetitionTable(lines: string[], startIndex: number) {
  const rows: Array<[string, string, string, string]> = [];
  let i = startIndex;
  while (i < lines.length) {
    const l1 = (lines[i] ?? "").trim();
    if (!l1) { i += 1; continue; }
    if (isAllCapsHeading(l1) || /^Please take note/i.test(l1) || /^GUIDELINES/i.test(l1)) break;
    if (/^(\d+\.|\d+)$/.test(l1)) {
      const sn = l1.replace(/\.$/, "");
      const item = (lines[i + 1] ?? "").trim();
      const theme = (lines[i + 2] ?? "").trim();
      const stageTime = (lines[i + 3] ?? "").trim();
      if (item && theme && stageTime) { rows.push([sn, item, theme, stageTime]); i += 4; continue; }
      break;
    }
    break;
  }
  return { rows, nextIndex: i };
}

function parseSyllabus(text: string): SyllabusBlock[] {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: SyllabusBlock[] = [];
  let i = 0;
  let pendingOl: string[] = [];
  let pendingUl: string[] = [];
  let lastHeading: string | undefined;
  const flushLists = () => {
    if (pendingOl.length) { blocks.push({ type: "ol", items: pendingOl }); pendingOl = []; }
    if (pendingUl.length) { blocks.push({ type: "ul", items: pendingUl }); pendingUl = []; }
  };
  while (i < rawLines.length) {
    const line = (rawLines[i] ?? "").trimEnd();
    const trimmed = line.trim();
    if (!trimmed) { flushLists(); i += 1; continue; }
    const isTableHeader = trimmed === "S/N" && (rawLines[i + 1] ?? "").trim() === "ITEM" && (rawLines[i + 2] ?? "").trim() === "THEME" && (rawLines[i + 3] ?? "").trim() === "STAGE TIME";
    if (isTableHeader) {
      flushLists();
      const { rows, nextIndex } = parseCompetitionTable(rawLines, i + 4);
      if (rows.length) blocks.push({ type: "table", title: lastHeading, headers: ["S/N", "Item", "Theme", "Stage time"], rows });
      i = nextIndex; continue;
    }
    const olMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (olMatch) { pendingOl.push(olMatch[2]); i += 1; continue; }
    const ulMatch = trimmed.match(/^(?:·|\-|\*)\s*(.+)$/);
    if (ulMatch) { pendingUl.push(ulMatch[1]); i += 1; continue; }
    flushLists();
    if (isAllCapsHeading(trimmed)) {
      lastHeading = trimmed;
      if (blocks.length === 0) blocks.push({ type: "h1", text: trimmed });
      else if (/CATEGORY|OBJECTIVES|ORGANISATION|GUIDELINES|THEME/i.test(trimmed)) blocks.push({ type: "h2", text: trimmed });
      else blocks.push({ type: "h3", text: trimmed });
      i += 1; continue;
    }
    blocks.push({ type: "p", text: trimmed });
    i += 1;
  }
  flushLists();
  return blocks;
}

function renderSyllabusBlocks(blocks: SyllabusBlock[]) {
  return blocks.map((block, idx) => {
    if (block.type === "h1") return <h1 key={idx} className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{block.text}</h1>;
    if (block.type === "h2") return <h2 key={idx} className="pt-4 text-xl sm:text-2xl font-extrabold text-gray-900">{block.text}</h2>;
    if (block.type === "h3") return <h3 key={idx} className="pt-3 text-lg font-extrabold text-gray-900">{block.text}</h3>;
    if (block.type === "p") return <p key={idx} className="text-sm sm:text-base text-gray-700 leading-relaxed">{block.text}</p>;
    if (block.type === "ol") return <ol key={idx} className="list-decimal pl-6 space-y-2 text-sm sm:text-base text-gray-700">{block.items.map((item, itemIdx) => <li key={itemIdx} className="pl-1">{item}</li>)}</ol>;
    if (block.type === "ul") return <ul key={idx} className="list-disc pl-6 space-y-2 text-sm sm:text-base text-gray-700">{block.items.map((item, itemIdx) => <li key={itemIdx} className="pl-1">{item}</li>)}</ul>;
    if (block.type === "table") return (
      <div key={idx} className="pt-2">
        {block.title && <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{block.title}</p>}
        <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-[760px] w-full bg-white">
            <thead className="bg-gray-50">
              <tr>{block.headers.map((h) => <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-gray-700 border-b border-gray-200">{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3 align-top text-sm font-bold text-gray-800 border-b border-gray-100 w-20">{row[0]}</td>
                  <td className="px-4 py-3 align-top text-sm text-gray-800 border-b border-gray-100 min-w-52">{row[1]}</td>
                  <td className="px-4 py-3 align-top text-sm text-gray-700 border-b border-gray-100">{row[2]}</td>
                  <td className="px-4 py-3 align-top text-sm font-semibold text-gray-800 border-b border-gray-100 w-32">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
    return null;
  });
}

function stripDuplicatedHeaderBlocks(blocks: SyllabusBlock[]) {
  const startIndex = blocks.findIndex((b) => {
    if (b.type === "p" || b.type === "h1" || b.type === "h2" || b.type === "h3") return /^main theme\s*:/i.test(b.text.trim());
    return false;
  });
  return startIndex === -1 ? blocks : blocks.slice(startIndex);
}

// ─── Field wrapper with floating label feel ──────────────────────────────────
function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
        {label}{required && <span className="ml-0.5 text-purple-600">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-11 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";

const selectCls =
  "w-full h-11 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm outline-none transition-all appearance-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";

export default function SchoolApplicationPage() {
  const [formData, setFormData] = useState({
    institutionName: "",
    address: "",
    city: "",
    contactPerson: "",
    email: "",
    phone: "",
    institutionType: "",
    numberOfStudents: "",
    gradeLevels: "",
    interestReason: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [syllabusText, setSyllabusText] = useState<string>("");
  const [syllabusError, setSyllabusError] = useState<string>("");
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);

  useEffect(() => {
    if (!isSyllabusOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setIsSyllabusOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSyllabusOpen]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setSyllabusError("");
        const res = await fetch("/api/syllabus", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const text = await res.text();
        if (isMounted) setSyllabusText(text);
      } catch {
        if (isMounted) setSyllabusError("Syllabus is currently unavailable.");
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const syllabusBlocks = useMemo(() => {
    if (!syllabusText) return [] as SyllabusBlock[];
    return stripDuplicatedHeaderBlocks(parseSyllabus(syllabusText));
  }, [syllabusText]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/school-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setFormData({ institutionName: "", address: "", city: "", contactPerson: "", email: "", phone: "", institutionType: "", numberOfStudents: "", gradeLevels: "", interestReason: "" });
      } else {
        const err = await res.json();
        setSubmitError(err.error || "Failed to submit application");
      }
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SUCCESS STATE ──────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <section className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md text-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-red-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Thank you for applying. Our team will review your application and reach out within <strong className="text-gray-700">5 business days</strong>.
              </p>
              <Link href="/">
                <button className="w-full h-11 rounded-lg bg-gradient-to-r from-purple-700 to-red-600 hover:from-purple-800 hover:to-red-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg">
                  Return to Homepage
                </button>
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // ─── MAIN PAGE ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* ── Hero header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">School Participation</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Apply for&nbsp;
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">
                  TIPAC Festival 2026
                </span>
              </h1>
              <p className="mt-2 text-gray-500 text-base max-w-xl">
                Register your school or organisation for Uganda's premier children's theatre initiative. Fill in the form below and we'll be in touch.
              </p>
            </div>

            {/* Syllabus card */}
            {!syllabusError && (
              <div className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:items-end gap-3 min-w-[220px]">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Festival Syllabus</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSyllabusOpen(true)}
                    disabled={!syllabusText}
                    className="h-9 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    View
                  </button>
                  <a href="/api/syllabus/pdf">
                    <button
                      type="button"
                      className="h-9 px-4 rounded-lg bg-gradient-to-r from-purple-700 to-red-600 text-white text-sm font-semibold hover:from-purple-800 hover:to-red-700 transition-all"
                    >
                      Download PDF
                    </button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-1 space-y-5">

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">What to expect</p>
              {[
                { n: "1", title: "Complete the form", desc: "Fill in your institution and contact details." },
                { n: "2", title: "We review", desc: "Our team reviews your application within 5 business days." },
                { n: "3", title: "Confirmation", desc: "You receive an email confirmation with next steps." },
                { n: "4", title: "Participate!", desc: "Join TIPAC Festival 2026, 24–26 April at UNCC, Kampala." },
              ].map((step) => (
                <div key={step.n} className="flex gap-3.5 mb-4 last:mb-0">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-red-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {step.n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Festival info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Festival Details</p>
              {[
                { label: "Dates", value: "24–26 April 2026" },
                { label: "Venue", value: "Uganda National Cultural Centre, Kampala" },
                { label: "Theme", value: "Environmental Sustainability" },
                { label: "Open to", value: "Pre-Primary, Primary & Secondary Schools" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-semibold text-gray-800 mt-0.5">{value}</span>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <div className="bg-purple-50 rounded-2xl border border-purple-100 p-5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-purple-900">Your data is safe</p>
                  <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                    Information submitted here is used solely for TIPAC participation and is never shared with third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="text-center">
              <p className="text-xs text-gray-500">Need help? Contact us at</p>
              <a href="mailto:info@tipac.org" className="text-sm font-semibold text-purple-700 hover:text-purple-800 transition-colors">
                info@tipac.org
              </a>
            </div>
          </aside>

          {/* ── Form ── */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Section 1 */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Institution Information</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Basic details about your school or organisation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="institutionName" label="Institution Name" required>
                    <input id="institutionName" name="institutionName" value={formData.institutionName} onChange={handleChange} required placeholder="e.g. St. Mary's Primary School" className={inputCls} />
                  </Field>

                  <Field id="institutionType" label="Institution Type" required>
                    <div className="relative">
                      <select id="institutionType" name="institutionType" value={formData.institutionType} onChange={handleChange} required className={selectCls}>
                        <option value="">Select type…</option>
                        <option value="primary_school">Primary School</option>
                        <option value="secondary_school">Secondary School</option>
                        <option value="college_university">College / University</option>
                        <option value="ngo">NGO / Organisation</option>
                        <option value="other">Other</option>
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </Field>

                  <div className="sm:col-span-2">
                    <Field id="address" label="Physical Address" required>
                      <input id="address" name="address" value={formData.address} onChange={handleChange} required placeholder="Street address, area" className={inputCls} />
                    </Field>
                  </div>

                  <Field id="city" label="City / District" required>
                    <input id="city" name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Kampala" className={inputCls} />
                  </Field>

                  <Field id="numberOfStudents" label="Total Enrollment" required>
                    <input id="numberOfStudents" name="numberOfStudents" type="number" min="1" value={formData.numberOfStudents} onChange={handleChange} required placeholder="e.g. 450" className={inputCls} />
                  </Field>
                </div>
              </section>

              {/* Section 2 */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Contact Person</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Who should we reach out to regarding this application?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="contactPerson" label="Full Name" required>
                    <input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required placeholder="First and last name" className={inputCls} />
                  </Field>

                  <Field id="phone" label="Phone Number" required>
                    <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="+256 7XX XXX XXX" className={inputCls} />
                  </Field>

                  <Field id="email" label="Email Address" required>
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="contact@school.ug" className={inputCls} />
                  </Field>

                  <Field id="gradeLevels" label="Target Grade Levels" required>
                    <input id="gradeLevels" name="gradeLevels" value={formData.gradeLevels} onChange={handleChange} required placeholder="e.g. P4 – P7, or Ages 8–12" className={inputCls} />
                  </Field>
                </div>
              </section>

              {/* Section 3 */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Supporting Statement</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Share why your institution wishes to participate</p>
                  </div>
                </div>

                <Field id="interestReason" label="Why do you want to join TIPAC?" required>
                  <textarea
                    id="interestReason"
                    name="interestReason"
                    rows={5}
                    value={formData.interestReason}
                    onChange={handleChange}
                    required
                    placeholder="Tell us about your goals, your students, and what you hope to gain from participating in TIPAC Festival 2026…"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                  />
                </Field>
              </section>

              {/* Error */}
              {submitError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <p className="text-xs text-gray-400 text-center sm:text-left">
                  Fields marked <span className="text-purple-600 font-semibold">*</span> are required
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/">
                    <button
                      type="button"
                      className="w-full sm:w-auto h-11 px-8 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-11 px-10 rounded-lg bg-gradient-to-r from-purple-700 to-red-600 hover:from-purple-800 hover:to-red-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      "Submit Application →"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Syllabus Modal ── */}
      {isSyllabusOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSyllabusOpen(false)}
            aria-label="Close syllabus"
          />
          <div className="absolute inset-x-0 top-10 sm:top-16 mx-auto max-w-5xl px-4">
            <div
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="TIPAC Festival 2026 Syllabus"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                <div>
                  <h3 className="text-base font-bold text-gray-900">TIPAC Festival 2026 — Syllabus</h3>
                  <p className="text-xs text-gray-500">Headed paper format</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href="/api/syllabus/pdf">
                    <button type="button" className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      Download PDF
                    </button>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsSyllabusOpen(false)}
                    className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 max-h-[75vh] overflow-auto bg-gray-50">
                <div className="mx-auto max-w-4xl">
                  <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-purple-700 via-purple-500 to-red-600" />
                    <div className="px-6 sm:px-10 py-8">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                            <Image src="/logo.jpg" alt="TIPAC" fill className="object-contain p-1.5" sizes="56px" priority />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Theatre Initiative for the Pearl of Africa Children</p>
                            <p className="text-xl font-black text-gray-900 tracking-tight">TIPAC Festival 2026</p>
                            <p className="text-sm text-gray-600">Syllabus for Pre-Primary, Primary & Secondary Schools</p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex-shrink-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Main Theme</p>
                          <p className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">Environmental Sustainability</p>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Festival dates", value: "24th–26th April 2026" },
                          { label: "Venue", value: "Uganda National Cultural Centre\nKampala" },
                          { label: "Document", value: "Official Syllabus" },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5 whitespace-pre-line">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
                    <div className="px-6 sm:px-10 py-8">
                      <div className="space-y-4">{renderSyllabusBlocks(syllabusBlocks)}</div>
                    </div>
                    <div className="h-1.5 bg-gradient-to-r from-purple-700 via-purple-500 to-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}