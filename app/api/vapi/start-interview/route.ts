import { NextResponse, NextRequest } from "next/server";
import { VapiClient } from "@vapi-ai/server-sdk";
import { prisma } from "@/lib/prisma"; // Assuming you have a prisma client instance
import { currentUser } from "@clerk/nextjs/server";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID; // Replace with your Assistant ID
// const VAPI_PHONE_NUMBER_ID = 'YOUR_VAPI_PHONE_NUMBER_ID'; // For phone calls, or omit for web call

if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID) {
  throw new Error(
    "VAPI_API_KEY or VAPI_ASSISTANT_ID is missing in environment."
  );
}

const vapi = new VapiClient({ token: VAPI_API_KEY! });

interface VapiSingleCall {
  id: string;
  // Add other fields if strictly necessary, but 'id' is the minimum needed.
  [key: string]: unknown; // Allows for other properties without explicit definition
}

export async function POST(req: NextRequest) {
  const user = await currentUser();

  console.log("Authenticated user:", user);
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
    orderBy: { createdAt: 'desc' },
    select: { id: true },
});

const resumeId = latestResume?.id;

if (!resumeId) {
    // This handles cases where the frontend's 'isResumeReady' check was stale or incorrect
    return NextResponse.json(
        { message: "Resume required to start interview, but not found for candidate." },
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
      status: 'INTERVIEW_INVITED',
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

    // 1. Create a new InterviewSession in your database
    const newSession = await prisma.interviewSession.create({
      data: {
        applicationId: applicationId,
        type: "JOB_APPLICATION",
        status: "PENDING",
        // vapiCallId will be updated by webhook later
      },
    });

    // 2. Prepare the Vapi Call payload
    const callPayload = {
      assistantId: VAPI_ASSISTANT_ID,
      customer: {
        number: candidateNumber, // Use actual phone number or 'browser' for web call
      },
      // Pass the new session ID as metadata for the assistant to use in the tool call
      metadata: {
        interviewSessionId: newSession.id,
      },
      // For phone calls, you'd add: phoneNumberId: VAPI_PHONE_NUMBER_ID,
    };

    // 3. Initiate the Vapi Call (Web Call for simplicity here)
    const vapiCall = (await vapi.calls.create(callPayload)) as VapiSingleCall;

    // 4. Update the InterviewSession with the Vapi Call ID
    await prisma.interviewSession.update({
      where: { id: newSession.id },
      data: { vapiCallId: vapiCall.id, status: "IN_PROGRESS" },
    });

    return NextResponse.json({
      message: "Interview call initiated",
      callId: vapiCall.id,
      sessionId: newSession.id,
    });
  } catch (error) {
    console.error("Failed to start Vapi call:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
