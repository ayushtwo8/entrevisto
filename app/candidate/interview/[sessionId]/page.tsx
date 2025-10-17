'use client';

import { useEffect, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

// Vapi Public API Key (Get this from your Vapi Dashboard)
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY; 
// Replace with the ID you used in the backend for web calls
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID; 

// Initialize Vapi client
const vapi = new Vapi(VAPI_PUBLIC_KEY as string);

interface InterviewPageProps {
  params: { sessionId: string };
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const { sessionId } = params;
  const [isVapiActive, setIsVapiActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use your theme colors for Tailwind classes based on your global CSS variables
  const buttonClass = `
    bg-primary text-primary-foreground hover:bg-primary/90 
    rounded-[var(--radius-lg)] p-4 text-lg font-bold shadow-md 
    transition-all duration-300
  `;
  const containerClass = `
    min-h-screen p-8 flex flex-col items-center justify-center 
    bg-background text-foreground font-sans
  `;
  const cardClass = `
    bg-card text-card-foreground p-6 rounded-[var(--radius-xl)] 
    shadow-lg w-full max-w-lg border border-border
  `;

  // Function to start the Vapi call
  const startInterview = useCallback(async () => {
    if (!sessionId) {
      setError("Interview Session ID is missing.");
      return;
    }
    
    // In a real application, you would make an API call here 
    // to your `/api/vapi/start-interview` endpoint to create the call
    // and session on the backend.
    
    // For a Vapi *Web* Call using the SDK, you can start directly:
    try {
        vapi.start(VAPI_ASSISTANT_ID, {
            // Passing the session ID in metadata for the webhook logic to work
            metadata: { 
                interviewSessionId: sessionId 
            }
        });
        setIsVapiActive(true);
    } catch (e) {
        console.error("Vapi start error:", e);
        setError("Failed to start the voice interview.");
    }
  }, [sessionId]);

  // Set up Vapi event listeners
  useEffect(() => {
    vapi.on('call-start', () => {
      setIsVapiActive(true);
      setError(null);
    });

    vapi.on('call-end', () => {
      setIsVapiActive(false);
      alert('Interview finished. Check the database for the transcript!');
    });

    vapi.on('error', (e) => {
      console.error('Vapi Error:', e);
      setError(e.message || 'An unknown Vapi error occurred.');
      setIsVapiActive(false);
    });

    vapi.on('message', (message) => {
      if (message.type === 'transcript') {
        const role = message.role === 'assistant' ? 'AI Interviewer' : 'You';
        setTranscript(prev => [...prev, `${role}: ${message.transcript}`]);
      }
    });

    return () => {
      vapi.removeAllListeners();
      vapi.stop(); // Clean up on unmount
    };
  }, []);

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        <h1 className="text-2xl font-serif font-bold text-center mb-6">
          AI Interview Session
        </h1>
        <p className="text-center text-muted-foreground mb-4">
          Session ID: **{sessionId}**
        </p>

        <button 
          onClick={isVapiActive ? () => vapi.stop() : startInterview} 
          disabled={!VAPI_PUBLIC_KEY}
          className={`${buttonClass} w-full`}
        >
          {isVapiActive ? 'End Interview' : 'Start Interview'}
        </button>

        {error && (
          <p className="mt-4 p-3 bg-destructive text-destructive-foreground rounded-[var(--radius-sm)]">
            Error: {error}
          </p>
        )}
      </div>

      <div className={`${cardClass} mt-8 max-h-96 overflow-y-auto`}>
        <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">
          Live Transcript
        </h2>
        {transcript.length === 0 ? (
          <p className="text-muted-foreground italic">
            {isVapiActive ? 'Waiting for conversation...' : 'Press Start Interview to begin.'}
          </p>
        ) : (
          <div className="space-y-3">
            {transcript.map((line, index) => (
              <p 
                key={index} 
                className={`text-sm ${line.startsWith('AI') ? 'font-medium text-primary' : 'text-foreground'}`}
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}