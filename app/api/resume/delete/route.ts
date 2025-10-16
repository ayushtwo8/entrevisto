import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    try {
        const user = await currentUser();
        const userId = user?.id;

        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const resumeId = searchParams.get("resumeId");
        console.log("Resume ID to delete:", resumeId);
        if (!resumeId) {
            return new Response(JSON.stringify({ error: "Resume ID is required" }), { status: 400 });
        }

        // Verify that the resume belongs to the user
        const existingResume = await prisma.resume.findUnique({
            where: { id: resumeId },
        });

        if (!existingResume || existingResume.userId !== userId) {
            return new Response(JSON.stringify({ error: "Resume not found or access denied" }), { status: 404 });
        }

        // Delete the resume record
        await prisma.resume.delete({
            where: { id: resumeId },
        });

     

        return NextResponse.json({ message: "Resume deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting resume:", error);
        return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
    }
}