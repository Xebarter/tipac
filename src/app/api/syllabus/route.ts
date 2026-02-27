import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  try {
    const syllabusPath = path.join(process.cwd(), "syllabus.txt");
    const content = await readFile(syllabusPath, "utf8");

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load syllabus" }, { status: 500 });
  }
}
