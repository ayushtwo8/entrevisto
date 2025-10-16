import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const {  jobId } = await params;
  console.log("Fetching job with ID:", jobId);

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true }, // Make sure this relation exists
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job, { status: 200 });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
