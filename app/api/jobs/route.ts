import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const user = await currentUser();
    const userId = user?.id;

    // 1. Authorization Check (Ensure the user is logged in)
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { company: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User not associated with any company" }, { status: 403 });
        }
        const data = await request.json();
        const newJob = await prisma.job.create({
            data: {
                title: data.title,
                department: data.department,
                location: data.location,
                salary: data.salary,
                description: data.description,
                requirements: data.requirements,
                requiredSkills: data.requiredSkills,
                company: {
                    connect: { id: dbUser?.companyId }
                }
            },
        })

        return NextResponse.json(newJob, { status: 201 });
    } catch (error) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

}
export async function GET() {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(jobs, { status: 200 });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}