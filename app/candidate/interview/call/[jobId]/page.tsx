"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import Vapi from "@vapi-ai/web";

// Mock job details type for this page
type JobDetails = {
  title: string;
  company: { name: string };
};

export default function InterviewPage() {
  const { jobId } = useParams();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [assistantId, setAssistantId] = useState(null);
  const [callStatus, setCallStatus] = useState('Idle');
  const [error, setError] = useState<string | null>(null);

  const { toggleCall, isCallActive, setMuted, mute, volume, isMuted, send } = new Vapi(`${process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY}`);

  // Vapi event listener to update call status
  useEffect(() => {
    // This is a basic setup. You'd typically use a more structured event handler.
    if (isCallActive) {
        setCallStatus('In Progress (Listening/Speaking)');
    } else if (assistantId && !isCallActive) {
        setCallStatus('Ready to Start');
    } else {
        setCallStatus('Idle');
    }
  }, [isCallActive, assistantId]);

  const fetchAssistant = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/vapi-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobDetails), // Send the context data
      });

      if (!response.ok) {
        throw new Error('Failed to get assistant ID from backend.');
      }

      const data = await response.json();
      setAssistantId(data.assistantId);
      setCallStatus('Ready to Start');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setCallStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Function to Start/End the Vapi Call ---
  const handleToggleCall = () => {
    if (!assistantId) {
      setError("Assistant not ready. Please try fetching it again.");
      return;
    }
    toggleCall({ assistantId }); // Start the call with the dynamically created assistant
  };

  if (!assistantId && !loading && !error) {
    return (
      <div className="card">
        <h2>Setup Interview</h2>
        <p>Job: {MOCK_DATA.jobTitle}</p>
        <button onClick={fetchAssistant} disabled={loading}>
          {loading ? 'Setting up...' : 'Configure Interviewer'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Main Video Feed (Candidate) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="text-muted-foreground text-2xl z-10">Your Camera Feed</div>
          {/* Placeholder for actual video element */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-md z-10">
            <div className="text-sm font-medium">John Doe (You)</div>
          </div>
        </div>

        {/* AI Interviewer & Questions */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              AI Interviewer
            </h2>
            <div className="space-y-4 text-base">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="text-muted-foreground">Hello, thank you for your time today.</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <div className="font-semibold text-foreground">
                  Let&apos;s start with our first question: Can you tell me about a challenging project you&apos;ve worked on?
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              {callStatus}
            </div>
          </div>
        </div>
      </main>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Footer with Controls */}
      <footer className="bg-card/50 backdrop-blur-sm border-t border-border flex justify-center items-center p-6 space-x-4">
        {isCallActive && <button
          onClick={() => setMuted(!isMuted)}
          className={`rounded-full h-14 w-14 flex items-center justify-center transition-all duration-200 shadow-lg ${
            isMuted
              ? "bg-destructive hover:bg-destructive/80 text-destructive-foreground"
              : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>}
        <button
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={`rounded-full h-14 w-14 flex items-center justify-center transition-all duration-200 shadow-lg ${
            isCameraOn
              ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              : "bg-destructive hover:bg-destructive/80 text-destructive-foreground"
          }`}
          title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        <button
          onClick={handleToggleCall}
          disabled={loading}
          className="rounded-full h-14 w-14 flex items-center justify-center bg-destructive hover:bg-destructive/80 text-destructive-foreground transition-all duration-200 shadow-lg"
          title="End Interview"
        >
          <PhoneOff size={24} />
        </button>
      </footer>
    </div>
  );
}