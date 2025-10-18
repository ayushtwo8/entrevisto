import { NextResponse, NextRequest } from "next/server";
import { VapiClient } from "@vapi-ai/server-sdk";
import { prisma } from "@/lib/prisma"; // Assuming you have a prisma client instance
import { currentUser } from "@clerk/nextjs/server";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID; // Replace with your Assistant ID
// const VAPI_PHONE_NUMBER_ID = 'YOUR_VAPI_PHONE_NUMBER_ID'; // For phone calls, or omit for web call

let vapi: VapiClient | undefined;
if (VAPI_API_KEY && VAPI_ASSISTANT_ID) {
  vapi = new VapiClient({ token: VAPI_API_KEY });
}

interface VapiSingleCall {
  id: string;
  // Add other fields if strictly necessary, but 'id' is the minimum needed.
  [key: string]: unknown; // Allows for other properties without explicit definition
}

export async function POST(req: NextRequest) {
  if (!vapi) {
    console.error(
      "Vapi Client not initialized due to missing environment variables."
    );
    return NextResponse.json(
      { message: "Server configuration error: VAPI keys missing." },
      { status: 500 }
    );
  }

  const user = await currentUser();

  console.log("DEBUG: Authenticated user:", user?.id);
  const candidateClerkId = user?.id;

  if (!candidateClerkId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId, candidateNumber } = await req.json();

    if (!jobId || !candidateNumber) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const latestResume = await prisma.resume.findFirst({
      where: { userId: candidateClerkId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const resumeId = latestResume?.id;

    if (!resumeId) {
      // This handles cases where the frontend's 'isResumeReady' check was stale or incorrect
      return NextResponse.json(
        {
          message:
            "Resume required to start interview, but not found for candidate.",
        },
        { status: 400 }
      );
    }

    const application = await prisma.application.upsert({
      where: {
        candidateId_jobId: {
          candidateId: candidateClerkId, // Use the authenticated user's ID
          jobId: jobId,
        },
      },
      update: {
        // If the application exists, update its status if needed,
        // but for now, we just ensure it exists.
        status: "INTERVIEW_INVITED",
        resumeId: resumeId,
      },
      create: {
        candidateId: candidateClerkId,
        jobId: jobId,
        resumeId: resumeId,
        status: "INTERVIEW_INVITED",
      },
      select: { id: true, resumeId: true },
    });

    if (!application.resumeId) {
      return NextResponse.json(
        {
          message:
            "Resume required to start interview, but not found for candidate.",
        },
        { status: 400 }
      );
    }
    const applicationId = application.id;

    let interviewSession = await prisma.interviewSession.findUnique({
      where: { applicationId: applicationId },
      select: { id: true, vapiCallId: true, status: true },
    });

    let sessionAlreadyInProgress = false;

    if (interviewSession) {
      // Session exists. If it's still 'PENDING' or 'COMPLETED', we just return the existing ID.
      sessionAlreadyInProgress = interviewSession.status === "IN_PROGRESS";
      console.log(
        `DEBUG: Existing Interview Session found: ${interviewSession.id}, Status: ${interviewSession.status}`
      );
    } else {
      // Session does NOT exist, so create it (with status 'PENDING')
      interviewSession = await prisma.interviewSession.create({
        data: {
          applicationId: applicationId,
          type: "JOB_APPLICATION",
          status: "PENDING",
        },
        select: { id: true, vapiCallId: true, status: true },
      });
    }

    if (!interviewSession.vapiCallId || sessionAlreadyInProgress) {
      // If it's a new session OR if the previous one finished and we want to retry (optional logic)
      // For simplicity, let's just create the Vapi call if the vapiCallId is missing.

      // 2a. Prepare the Vapi Call payload
      const callPayload = {
        assistantId: VAPI_ASSISTANT_ID,
        customer: { number: candidateNumber },
        metadata: { interviewSessionId: interviewSession.id },
      };

      // 2b. Initiate the Vapi Call
      const vapiCall = (await vapi.calls.create(
        callPayload as any
      )) as VapiSingleCall;

      // 2c. Update the InterviewSession with the Vapi Call ID and status
      interviewSession = await prisma.interviewSession.update({
        where: { id: interviewSession.id },
        data: { vapiCallId: vapiCall.id, status: "IN_PROGRESS" },
        select: { id: true, vapiCallId: true, status: true },
      });
    }

    return NextResponse.json({
      message: "Interview call initiated/resumed",
      callId: interviewSession.vapiCallId,
      sessionId: interviewSession.id, // Return the existing or new session ID
    });
  } catch (error) {
    console.error("FAILED TO START VAPI CALL - DETAILED ERROR:", error);

    // 🟢 RETURN THE DETAILED ERROR MESSAGE TO THE FRONTEND
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected server error occurred.";

    return NextResponse.json(
      { message: `Internal Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
