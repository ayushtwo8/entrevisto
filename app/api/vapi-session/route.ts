// app/api/vapi-session/route.ts
// This route will handle creating a Vapi assistant dynamically
// and returning its ID to the frontend to start the interview.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VapiClient } from "@vapi-ai/server-sdk";

const vapi = new VapiClient({token: process.env.VAPI_API_KEY as string}); // VAPI_API_KEY should be your secret key

export async function POST(req: Request) {
  try {
    const { jobId, resumeId, candidateId } = await req.json();

    if (!jobId || !resumeId || !candidateId) {
      return NextResponse.json(
        { message: 'Missing required parameters: jobId, resumeId, candidateId' },
        { status: 400 }
      );
    }

    // 1. Fetch Job and Resume details from your database using Prisma
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        title: true,
        description: true,
        requiredSkills: true,
        company: { select: { name: true } },
      },
    });

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        rawText: true,
        parsedData: true, // Assuming this is JSONB in PostgreSQL, Prisma handles it as `Json` type
      },
    });

    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }
    if (!resume) {
      return NextResponse.json({ message: 'Resume not found' }, { status: 404 });
    }

    // --- Type Guarding and Parsing for Resume.parsedData ---
    // This is crucial because `Json` type in Prisma can be anything.
    // Define an interface for your expected parsed resume data.
    interface ParsedResumeData {
      skills?: string[];
      experience?: Array<{ title: string; company: string; description?: string; }>;
      education?: Array<{ degree: string; institution: string; }>;
      // Add other structured fields you expect here
    }

    let parsedResume: ParsedResumeData = {};
    if (resume.parsedData) {
      // Ensure parsedData is an object before casting
      if (typeof resume.parsedData === 'object' && !Array.isArray(resume.parsedData)) {
        parsedResume = resume.parsedData as ParsedResumeData;
      }
    }

    const parsedResumeSkills = Array.isArray(parsedResume.skills) ? parsedResume.skills.join(', ') : '';
    const parsedResumeExperience = Array.isArray(parsedResume.experience)
      ? parsedResume.experience.map(exp => `${exp.title} at ${exp.company}`).join('; ')
      : '';
    const parsedResumeEducation = Array.isArray(parsedResume.education)
      ? parsedResume.education.map(edu => `${edu.degree} from ${edu.institution}`).join('; ')
      : '';

    // 2. Construct the Vapi System Prompt dynamically
    const systemPrompt = `
      You are an AI Interviewer for a company called "${job.company.name}".
      Your goal is to screen a candidate for the "${job.title}" position.

      **Interview Guidelines:**
      1.  **Personalized Questions:** Ask questions directly related to the candidate's resume and the job description.
      2.  **Follow-up Questions:** If the candidate gives a detailed answer, ask clarifying or deeper follow-up questions to probe their experience, problem-solving skills, and thought process.
      3.  **Broaden if needed:** If the candidate struggles or the conversation becomes stale, gently pivot to other relevant areas from their resume or the job description.
      4.  **Cover Key Areas:** Ensure you cover experience, technical skills, behavioral aspects, and motivation for this specific role.
      5.  **Professional Tone:** Maintain a polite, encouraging, and professional tone throughout the interview.
      6.  **Conclude Gracefully:** Aim for approximately 10-15 questions or a total duration of 10-15 minutes. When you feel sufficient information has been gathered, thank the candidate and inform them the interview is complete. Do NOT ask for their availability for next steps; that's handled by the platform.

      **Job Details for "${job.title}" at "${job.company.name}":**
      -   **Description:** ${job.description}
      -   **Required Skills:** ${job.requiredSkills.join(', ')}

      **Candidate's Resume Information:**
      -   **Raw Text:**
          """
          ${resume.rawText}
          """
      -   **Parsed Skills (if available):** ${parsedResumeSkills || 'No specific parsed skills were parsed from the resume.'}
      -   **Parsed Experience (if available):** ${parsedResumeExperience || 'No specific parsed experience was found.'}
      -   **Parsed Education (if available):** ${parsedResumeEducation || 'No specific parsed education was found.'}

      **Begin the Interview:**
      Start by introducing yourself as the AI interviewer from ${job.company.name} and briefly explain the purpose of the interview. Then, ask your first question.
    `;

    // 3. Create a Vapi Assistant dynamically
    const assistantConfig = {
      model: {
        provider: "openai" as const, // Use 'as const' for type safety with literal strings
        model: "gpt-5" as const, // Or 'gpt-4-turbo', 'claude-3-opus-20240229', etc.
        systemPrompt: systemPrompt,
        temperature: 0.7, // Adjust for more creative (higher) or focused (lower) responses
        maxTokens: 80, // Limit AI response length to keep conversation flowing
      },
      voice: {
        provider: "azure" as const, // Or 'deepgram', 'google', etc.
        voiceId: "en-US-JennyNeural", // Choose a suitable voice ID
      },
      firstMessage: "Hello, I'm your AI interviewer for " + job.company.name + ". Let's begin!",
      // Optional: Configure speech-to-text (transcriber)
      transcriber: {
        provider: "deepgram" as const,
        model: "nova-2-general" as const, // Or 'nova-2-phone', etc.
        language: "en" as const,
      },
      // Optional: Add other Vapi assistant properties as needed,
      // e.g., 'fillerWords', 'maxDuration', 'recordingEnabled', 'endCallMessage', 'keywords'
      endCallMessage: "Thank you for your time. Your interview with Entrevisto is now complete.",
    };

    const assistant = await vapi.assistants.create(assistantConfig);

    // 4. Return the Assistant ID to the frontend
    // The frontend will use this ID to start the Vapi call via the client SDK.
    return NextResponse.json({ assistantId: assistant.id }, { status: 200 });

  } catch (error) {
    console.error('Error creating Vapi interview session:', error);
    // Differentiate between known errors (e.g., Vapi API) and unexpected
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Failed to create interview session', error: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect(); // Ensure Prisma connection is closed
  }
}