import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await currentUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resume = await prisma.resume.findFirst({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent resume
      },
      select: {
        id: true,
        fileUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!resume) {
      return NextResponse.json({ resumeUrl: null, message: 'No resume found' }, { status: 200 });
    }

    return NextResponse.json({ resumeUrl: resume.fileUrl, resumeId: resume.id, uploadedAt: resume.createdAt }, { status: 200 });
} catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 });
}
}