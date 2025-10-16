import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }>}
) {
    const user = await currentUser();
    const userId = user?.id;

    const { jobId } = await params;

    // 1. Authorization Check (Ensure the user is logged in)
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Data Validation
    if (!jobId) {
        return NextResponse.json({ error: "Missing Job ID" }, { status: 400 });
    }

    try {
        // 3. Fetch Job Data with Company Name
        const job = await prisma.job.findUnique({
            where: { id: jobId },   
            select: {
                title: true,
                description: true,
                requiredSkills: true,
                requirements: true,
                company: { select: { name: true } },
                id: true,
                location: true,
                department: true,
                salary: true,
                postedDate: true,
                status: true,
            }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json(job, { status: 200 });

    } catch (error) {
        console.error(`Error fetching job ${jobId}:`, error);
        return NextResponse.json(
            { error: "Failed to retrieve job details" },
            { status: 500 }
        );
    }
}
