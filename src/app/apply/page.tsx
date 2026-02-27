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
  if (!trimmed) {
    return false;
  }

  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) {
    return false;
  }

  const upper = letters.toUpperCase();
  return letters === upper;
}

function parseCompetitionTable(lines: string[], startIndex: number) {
  const rows: Array<[string, string, string, string]> = [];
  let i = startIndex;

  while (i < lines.length) {
    const l1 = (lines[i] ?? "").trim();
    if (!l1) {
      i += 1;
      continue;
    }

    if (isAllCapsHeading(l1) || /^Please take note/i.test(l1) || /^GUIDELINES/i.test(l1)) {
      break;
    }

    if (/^(\d+\.|\d+)$/.test(l1)) {
      const sn = l1.replace(/\.$/, "");
      const item = (lines[i + 1] ?? "").trim();
      const theme = (lines[i + 2] ?? "").trim();
      const stageTime = (lines[i + 3] ?? "").trim();

      if (item && theme && stageTime) {
        rows.push([sn, item, theme, stageTime]);
        i += 4;
        continue;
      }

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
    if (pendingOl.length) {
      blocks.push({ type: "ol", items: pendingOl });
      pendingOl = [];
    }
    if (pendingUl.length) {
      blocks.push({ type: "ul", items: pendingUl });
      pendingUl = [];
    }
  };

  while (i < rawLines.length) {
    const line = (rawLines[i] ?? "").trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushLists();
      i += 1;
      continue;
    }

    const isTableHeader =
      trimmed === "S/N" &&
      (rawLines[i + 1] ?? "").trim() === "ITEM" &&
      (rawLines[i + 2] ?? "").trim() === "THEME" &&
      (rawLines[i + 3] ?? "").trim() === "STAGE TIME";

    if (isTableHeader) {
      flushLists();
      const { rows, nextIndex } = parseCompetitionTable(rawLines, i + 4);
      if (rows.length) {
        blocks.push({
          type: "table",
          title: lastHeading,
          headers: ["S/N", "Item", "Theme", "Stage time"],
          rows,
        });
      }
      i = nextIndex;
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (olMatch) {
      pendingOl.push(olMatch[2]);
      i += 1;
      continue;
    }

    const ulMatch = trimmed.match(/^(?:·|\-|\*)\s*(.+)$/);
    if (ulMatch) {
      pendingUl.push(ulMatch[1]);
      i += 1;
      continue;
    }

    flushLists();

    if (isAllCapsHeading(trimmed)) {
      lastHeading = trimmed;
      if (blocks.length === 0) {
        blocks.push({ type: "h1", text: trimmed });
      } else if (/CATEGORY|OBJECTIVES|ORGANISATION|GUIDELINES|THEME/i.test(trimmed)) {
        blocks.push({ type: "h2", text: trimmed });
      } else {
        blocks.push({ type: "h3", text: trimmed });
      }
      i += 1;
      continue;
    }

    blocks.push({ type: "p", text: trimmed });
    i += 1;
  }

  flushLists();
  return blocks;
}

function renderSyllabusBlocks(blocks: SyllabusBlock[]) {
  return blocks.map((block, idx) => {
    if (block.type === "h1") {
      return (
        <h1 key={idx} className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {block.text}
        </h1>
      );
    }

    if (block.type === "h2") {
      return (
        <h2 key={idx} className="pt-4 text-xl sm:text-2xl font-extrabold text-gray-900">
          {block.text}
        </h2>
      );
    }

    if (block.type === "h3") {
      return (
        <h3 key={idx} className="pt-3 text-lg font-extrabold text-gray-900">
          {block.text}
        </h3>
      );
    }

    if (block.type === "p") {
      return (
        <p key={idx} className="text-sm sm:text-base text-gray-700 leading-relaxed">
          {block.text}
        </p>
      );
    }

    if (block.type === "ol") {
      return (
        <ol key={idx} className="list-decimal pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          {block.items.map((item, itemIdx) => (
            <li key={itemIdx} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      );
    }

    if (block.type === "ul") {
      return (
        <ul key={idx} className="list-disc pl-6 space-y-2 text-sm sm:text-base text-gray-700">
          {block.items.map((item, itemIdx) => (
            <li key={itemIdx} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === "table") {
      return (
        <div key={idx} className="pt-2">
          {block.title && (
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
              {block.title}
            </p>
          )}
          <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-[760px] w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  {block.headers.map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-gray-700 border-b border-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 align-top text-sm font-bold text-gray-800 border-b border-gray-100 w-20">
                      {row[0]}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-800 border-b border-gray-100 min-w-52">
                      {row[1]}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-700 border-b border-gray-100">
                      {row[2]}
                    </td>
                    <td className="px-4 py-3 align-top text-sm font-semibold text-gray-800 border-b border-gray-100 w-32">
                      {row[3]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  });
}

function stripDuplicatedHeaderBlocks(blocks: SyllabusBlock[]) {
  const startIndex = blocks.findIndex((b) => {
    if (b.type === "p" || b.type === "h1" || b.type === "h2" || b.type === "h3") {
      return /^main theme\s*:/i.test(b.text.trim());
    }
    return false;
  });

  if (startIndex === -1) {
    return blocks;
  }

  return blocks.slice(startIndex);
}

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
    if (!isSyllabusOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSyllabusOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSyllabusOpen]);

  useEffect(() => {
    let isMounted = true;

    const loadSyllabus = async () => {
      try {
        setSyllabusError("");
        const response = await fetch("/api/syllabus", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load syllabus");
        }

        const text = await response.text();
        if (isMounted) {
          setSyllabusText(text);
        }
      } catch {
        if (isMounted) {
          setSyllabusError("Syllabus is currently unavailable.");
        }
      }
    };

    loadSyllabus();

    return () => {
      isMounted = false;
    };
  }, []);

  const syllabusBlocks = useMemo(() => {
    if (!syllabusText) {
      return [] as SyllabusBlock[];
    }

    return stripDuplicatedHeaderBlocks(parseSyllabus(syllabusText));
  }, [syllabusText]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch('/api/school-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
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
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.error || "Failed to submit application");
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <main className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <section className="flex-1 relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-red-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(126,34,206,0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10 text-center">
            <div className="bg-white/40 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/40">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl animate-in zoom-in duration-500">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-4">Success!</h1>
              <p className="text-xl text-gray-700 mb-8">
                Thank you for applying. We've received your details and our team will be in touch within 5 business days.
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-700 to-red-600 text-white px-8 py-6 rounded-xl font-bold hover:shadow-lg transition-all">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <section className="flex-1 relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-red-50">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-gray-900 sm:text-5xl tracking-tight mb-4">
              Apply for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">TIPAC Participation</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Please complete all required fields below to register your institution for upcoming programs and theater initiatives.
            </p>
          </div>

          <div className="mb-8">
            {syllabusError ? (
              <div className="bg-white/80 backdrop-blur-2xl shadow-xl rounded-3xl border border-white/50 p-6 sm:p-8">
                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                  <p className="text-sm font-bold text-amber-900">{syllabusError}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-2xl shadow-xl rounded-3xl border border-white/50 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-700 to-red-600" />
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">Festival Syllabus</p>
                      <p className="text-xs text-gray-600">View the headed-paper version or download the official PDF.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-bold"
                      onClick={() => setIsSyllabusOpen(true)}
                      disabled={!syllabusText}
                    >
                      View full syllabus
                    </Button>
                    <a href="/api/syllabus/pdf" className="w-full sm:w-auto">
                      <Button
                        type="button"
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-700 to-red-600 hover:from-purple-800 hover:to-red-700 text-white rounded-xl font-bold"
                      >
                        Download PDF
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/90 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl rounded-[2rem] border border-white/50">
            <form className="space-y-10" onSubmit={handleSubmit}>

              {/* SECTION 1: INSTITUTION */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-purple-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-gray-800">Institution Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institutionName" className="font-bold text-gray-700">Institution Name *</Label>
                    <Input id="institutionName" name="institutionName" value={formData.institutionName} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institutionType" className="font-bold text-gray-700">Institution Type *</Label>
                    <select id="institutionType" name="institutionType" value={formData.institutionType} onChange={handleChange} required className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm text-gray-800">
                      <option value="">Select Type</option>
                      <option value="primary_school">Primary School</option>
                      <option value="secondary_school">Secondary School</option>
                      <option value="college_university">College/University</option>
                      <option value="ngo">NGO/Organization</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="address" className="font-bold text-gray-700">Physical Address *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-bold text-gray-700">City / District *</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfStudents" className="font-bold text-gray-700">Total Enrollment *</Label>
                    <Input id="numberOfStudents" name="numberOfStudents" type="number" min="1" value={formData.numberOfStudents} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-red-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-gray-800">Point of Contact</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="font-bold text-gray-700">Full Name *</Label>
                    <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-gray-700">Email Address *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold text-gray-700">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeLevels" className="font-bold text-gray-700">Target Grade Levels *</Label>
                    <Input id="gradeLevels" name="gradeLevels" placeholder="e.g. P4 - P7 or Ages 8-12" value={formData.gradeLevels} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* SECTION 3: STATEMENT */}
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="interestReason" className="font-bold text-gray-700">Why is your institution interested in joining TIPAC? *</Label>
                  <textarea
                    id="interestReason"
                    name="interestReason"
                    rows={5}
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm text-gray-800"
                    placeholder="Tell us about your goals for participating..."
                    value={formData.interestReason}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {submitError && (
                <div className="rounded-2xl bg-red-50 p-5 border border-red-200 flex items-center gap-3 animate-shake">
                  <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-bold text-red-800">{submitError}</p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-8">
                <Link href="/" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full sm:w-auto border-gray-300 text-gray-600 hover:bg-gray-50 px-10 py-7 rounded-2xl font-bold">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-700 to-red-600 hover:from-purple-800 hover:to-red-700 text-white shadow-xl px-12 py-7 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? "Processing..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {isSyllabusOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSyllabusOpen(false)}
            aria-label="Close syllabus"
          />
          <div className="absolute inset-x-0 top-10 sm:top-16 mx-auto max-w-5xl px-4">
            <div
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="TIPAC Festival 2026 Syllabus"
              tabIndex={-1}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Syllabus</h3>
                  <p className="text-sm text-gray-600">Headed paper format</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href="/api/syllabus/pdf">
                    <Button type="button" variant="outline" className="border-gray-300 rounded-xl font-bold">
                      Download PDF
                    </Button>
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl font-bold"
                    onClick={() => setIsSyllabusOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6 max-h-[75vh] overflow-auto bg-gradient-to-br from-purple-50 via-white to-red-50">
                <div className="mx-auto max-w-4xl">
                  <div className="bg-white shadow-2xl rounded-3xl border border-gray-200 overflow-hidden">
                    <div className="relative">
                      <div className="h-2 bg-gradient-to-r from-purple-700 via-purple-600 to-red-600" />
                      <div className="px-6 sm:px-10 py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-gray-200 bg-white">
                              <Image src="/logo.jpg" alt="TIPAC" fill className="object-contain p-2" sizes="64px" priority />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-wide text-gray-600">Theatre Initiative for the Pearl of Africa Children</p>
                              <p className="text-2xl font-black text-gray-900 tracking-tight">TIPAC Festival 2026</p>
                              <p className="text-sm font-semibold text-gray-700">Syllabus for Pre-Primary, Primary and Secondary Schools</p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Main theme</p>
                            <p className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">
                              Environmental Sustainability
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Festival dates</p>
                            <p className="text-sm font-extrabold text-gray-900">24th–26th April 2026</p>
                          </div>
                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Venue</p>
                            <p className="text-sm font-extrabold text-gray-900">Uganda National Cultural Centre</p>
                            <p className="text-xs font-semibold text-gray-700">Kampala</p>
                          </div>
                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Document</p>
                            <p className="text-sm font-extrabold text-gray-900">Official syllabus</p>
                            <p className="text-xs text-gray-600">Generated from syllabus.txt</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[1px] bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
                    </div>

                    <div className="px-6 sm:px-10 py-8">
                      <div className="space-y-4">{renderSyllabusBlocks(syllabusBlocks)}</div>
                    </div>

                    <div className="h-2 bg-gradient-to-r from-purple-700 via-purple-600 to-red-600" />
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