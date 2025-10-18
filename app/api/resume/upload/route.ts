import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { put } from "@vercel/blob";

/**
 * Helper: Parse PDF buffer into text using LangChain's PDFLoader
 */
async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  let tempFilePath: string | null = null;

  try {
    // Write buffer to temp file
    tempFilePath = join(tmpdir(), `resume-${Date.now()}.pdf`);
    await writeFile(tempFilePath, buffer);

    // Load PDF using LangChain
    const loader = new PDFLoader(tempFilePath, { splitPages: false });
    const docs = await loader.load();

    // Combine text from all pages
    const text = docs.map((doc) => doc.pageContent).join("\n");

    console.log("Extracted text preview:", text.substring(0, 200));
    console.log("Total text length:", text.length);

    return text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF");
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (err) {
        console.warn("Failed to delete temporary file:", err);
      }
    }
  }
}

/**
 * POST handler: fetch and parse the current user's resume
 */
export async function POST(req: NextRequest) {
  console.log("Received resume parse request");
  try {
    // Authenticate user
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: "public",
      allowOverwrite: true,
    });
    const fileUrl = blob.url;

    console.log("File uploaded to Vercel Blob:", fileUrl);

    console.log("Resume record updated:", fileUrl);

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Failed to upload resume" },
        { status: 500 }
      );
    }

    // Fetch PDF from storage
    const response = await fetch(fileUrl);
    console.log("Fetching resume from URL:", fileUrl);
    // if (!response.ok) {
    //   throw new Error("Failed to fetch resume from storage");
    // }

    console.log("Fetched resume, status:", response.status);
    const buffer = Buffer.from(await response.arrayBuffer());
    console.log("Resume file size (bytes):", buffer.length);
    // Parse PDF to text
    const resumeText = await parsePDFBuffer(buffer);

    if (resumeText.length < 100) {
      return NextResponse.json(
        { error: "Resume content too short or could not be read" },
        { status: 400 }
      );
    }

    console.log("Parsed resume text length:", resumeText);
    const resumeRecord = await prisma.resume.upsert({
      where: { id: userId }, // or another unique field if you want multiple resumes per user
      create: {
        fileUrl, // file URL from Vercel Blob
        rawText: resumeText, // parsed text or empty string initially
        // connect to existing User
        userId: userId, // required by the model
      },
      update: {
        fileUrl,
        rawText: "", // update parsed text if available
      },
    });

    // Success
    return NextResponse.json({ resumeRecord }, { status: 200 });
  } catch (error) {
    console.error("Resume parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
