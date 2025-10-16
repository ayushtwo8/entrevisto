"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";

// Mock job details type for this page
type JobDetails = {
  title: string;
  company: { name: string };
};

export default function InterviewPage() {
  const { jobId } = useParams();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    // Hide navbar/header by adding a class to body or html
    document.body.classList.add('interview-mode');
    document.documentElement.classList.add('interview-mode');
    
    // Alternative: Hide by ID if your navbar has a specific ID
    const navbar = document.querySelector('nav') || document.querySelector('header[role="navigation"]');
    if (navbar instanceof HTMLElement) {
      navbar.style.display = 'none';
    }

    return () => {
      // Cleanup: Show navbar again when leaving the page
      document.body.classList.remove('interview-mode');
      document.documentElement.classList.remove('interview-mode');
      if (navbar instanceof HTMLElement) {
        navbar.style.display = '';
      }
    };
  }, []);

  useEffect(() => {
    // Fetch job details to display context during the interview
    async function fetchJobDetails() {
      if (!jobId) return;
      try {
        const response = await fetch(`/api/candidate/jobs/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job");
        const data = await response.json();
        setJobDetails(data);
      } catch (error) {
        console.error("Failed to load job details for interview:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobDetails();
  }, [jobId]);

  useEffect(() => {
    // Enter fullscreen on mount
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.log("Fullscreen request failed:", error);
      }
    };

    enterFullscreen();

    return () => {
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const handleEndInterview = async () => {
    if (confirm("Are you sure you want to end the interview?")) {
      // Exit fullscreen before ending
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      // Add your end interview logic here (e.g., redirect, save data, etc.)
      alert("Ending interview...");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="mt-4 text-lg">Preparing your interview...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">AI Interview</h1>
          <div className="text-sm text-muted-foreground">
            For the position of {jobDetails?.title || "..."} at {jobDetails?.company?.name || "..."}
          </div>
        </div>
      </header>

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
              Recording in progress
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Controls */}
      <footer className="bg-card/50 backdrop-blur-sm border-t border-border flex justify-center items-center p-6 space-x-4">
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`rounded-full h-14 w-14 flex items-center justify-center transition-all duration-200 shadow-lg ${
            isMicOn
              ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              : "bg-destructive hover:bg-destructive/80 text-destructive-foreground"
          }`}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
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
          onClick={handleEndInterview}
          className="rounded-full h-14 w-14 flex items-center justify-center bg-destructive hover:bg-destructive/80 text-destructive-foreground transition-all duration-200 shadow-lg"
          title="End Interview"
        >
          <PhoneOff size={24} />
        </button>
      </footer>
    </div>
  );
}