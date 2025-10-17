import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma'; // Assuming you have a prisma client instance

export async function POST(req: NextRequest) {
  const event = await req.json();
  const { message } = event;

  if (!message || !message.type) {
    return NextResponse.json({ received: true });
  }

  // Handle Function Calls from the AI Assistant
  if (message.type === 'function-call' && message.functionCall.name === 'get_candidate_resume_data') {
    const { interviewSessionId } = message.functionCall.parameters;

    try {
      // 1. Find the Resume associated with the InterviewSession
      const session = await prisma.interviewSession.findUnique({
        where: { id: interviewSessionId },
        include: {
          application: {
            select: {
              resume: {
                select: { parsedData: true, rawText: true }
              },
              job: {
                select: { title: true }
              }
            }
          }
        }
      });

      const resumeData = session?.application?.resume?.parsedData;
      const jobTitle = session?.application?.job?.title;

      if (resumeData) {
        // 2. Format the data to return to the Vapi Assistant
        const result = {
          parsedResume: resumeData,
          jobTitle: jobTitle || 'unknown job',
          message: 'Resume data retrieved successfully. Use this to ask questions.',
        };

        // 3. Return the function-call result to Vapi
        return NextResponse.json({
          functionCall: {
            name: 'get_candidate_resume_data',
            result: JSON.stringify(result)
          }
        }, { status: 200 });
      } else {
        // Handle case where resume data is not found
        return NextResponse.json({
          functionCall: {
            name: 'get_candidate_resume_data',
            result: JSON.stringify({ error: 'Resume data not found for this session.' })
          }
        }, { status: 200 });
      }

    } catch (error) {
      console.error('Error handling get_candidate_resume_data:', error);
      // Return an error to the AI so it knows the tool failed
      return NextResponse.json({
        functionCall: {
          name: 'get_candidate_resume_data',
          result: JSON.stringify({ error: 'Internal server error during data retrieval.' })
        }
      }, { status: 200 });
    }
  }

  // Handle Status Updates (e.g., call-ended, call-failed)
  if (message.type === 'status-update' && message.status === 'call-ended') {
    const callId = message.call.id;
    const transcript = message.call.transcript;
    // The call object from Vapi will contain all the data, including a final summary and transcript.
    // Use the vapiCallId to find and update your InterviewSession model.
    await prisma.interviewSession.updateMany({
      where: { vapiCallId: callId },
      data: {
        status: 'ANALYSIS_PENDING', // Or 'COMPLETED' if analysis is done externally
        transcript: transcript,
        // summary: message.call.summary, // If Vapi provides it
      }
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// **Important Vapi Configuration Note:** You must set this endpoint (e.g., `https://yourdomain.com/api/vapi/webhook`) as the Server URL in your Vapi Assistant or Call configuration for the tool call and status updates to work.