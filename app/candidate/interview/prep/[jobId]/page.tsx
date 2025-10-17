"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { ResumeUploader } from "@/components/resume-uploader"; // Your uploader component
import { Button } from "@/components/ui/button";

// Define a clear type for the job details
type JobDetails = {
  title: string;
  description: string;
  requiredSkills: string[];
  company: {
    name: string;
  };
};

export default function InterviewPrepPage() {
  const { jobId } = useParams();
  console.log(jobId)
  const router = useRouter();

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResumeReady, setIsResumeReady] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);

  // --- 1. Data Fetching ---
  useEffect(() => {
    async function fetchJobDetails() {
      if (!jobId) {
        setError("Job ID is missing.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/candidate/jobs/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job details.");

        const data = await response.json();

        // Safely parse skills from a JSON string to an array
        const skills =
          typeof data.requiredSkills === "string"
            ? JSON.parse(data.requiredSkills)
            : data.requiredSkills || [];

        setJobDetails({ ...data, requiredSkills: skills });
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load job details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobDetails();
  }, [jobId]);

  // --- 2. Check if Resume Exists ---
  useEffect(() => {
    async function checkResumeExists() {
      try {
        const response = await fetch("/api/resume/fetch");
        if (response.ok) {
          const data = await response.json();
          // Check if resume exists (adjust based on your API response structure)
          if (data && (data.resume || data.resumeUrl || data.filename)) {
            setIsResumeReady(true);
          }
        }
      } catch (err) {
        console.error("Error checking resume:", err);
        // Don't show error, just keep isResumeReady as false
      }
    }
    checkResumeExists();
  }, []);

  const handleStartInterview = async () => {
    if (!jobId) return;

    setIsStartingCall(true);

    try {
      // 1. Call your backend API to start the Vapi call and create the InterviewSession.
      // This is the API route we designed in the previous step.
      const response = await fetch("/api/vapi/start-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Note: You need the candidate's phone number or 'browser' string here.
        // Assuming you'll get the current user's number or default to 'browser' for a web interview.
        // For simplicity, let's assume 'browser' and you'll fetch candidate info on the backend
        // based on the logged-in user (e.g., via a Clerk session).
        body: JSON.stringify({
          applicationId: jobId, // Pass the jobId or the application ID
          candidateNumber: "browser", // Use 'browser' for Vapi Web Call
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to start interview call.");
      }

      // 2. The backend should return the new InterviewSession ID
      const newSessionId = data.sessionId;

      // 3. Redirect the user to the Interview page using the new session ID
      // The Vapi call will be running in the background, and the frontend page
      // (app/interview/[sessionId]/page.tsx from before) will connect to it.
      router.push(`/candidate/interview/call/${newSessionId}`);
    } catch (err) {
      console.error("Start Interview Error:", err);
      alert("Error starting interview. Please try again.");
      setIsStartingCall(false); // Reset loading state on error
    }
  };

  // --- 3. Loading and Error States ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (error || !jobDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-card p-10 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground">
            {error || "The job could not be found."}
          </p>
        </div>
      </div>
    );
  }

  // --- 4. Main Content ---
  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-foreground mb-2">
          {jobDetails.title}
        </h1>
        <p className="text-xl text-primary font-semibold mb-8">
          {jobDetails.company.name}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details Section */}
          <div className="lg:col-span-2 bg-card p-8 border border-border rounded-[--radius-xl] shadow-lg">
            <h2 className="text-2xl font-bold text-card-foreground mb-4 border-b pb-2">
              Step 1: Review Job Details
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
              {jobDetails.description}
            </p>
            <h3 className="text-xl font-bold text-card-foreground mb-3">
              Key Requirements
            </h3>
            <div className="flex flex-wrap gap-2">
              {jobDetails.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Resume Uploader Section */}
          <div className="lg:col-span-1">
            <ResumeUploader onUploadSuccess={() => setIsResumeReady(true)} />
          </div>

          {/* Start Interview Section */}
          <div className="lg:col-span-1">
            <div className="bg-card p-8 border border-border rounded-[--radius-xl] shadow-lg text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">
                Step 3: Begin Interview
              </h2>
              <p className="text-muted-foreground mb-6">
                {isResumeReady
                  ? "You're all set! Click below to start your AI interview."
                  : "Once your resume is uploaded, you can start the AI-powered interview."}
              </p>
              <Button
                onClick={handleStartInterview}
                disabled={!isResumeReady || isStartingCall}
                size="lg"
                className="w-full h-14 text-lg font-bold"
              >
                {isStartingCall ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Initializing Call...
                  </>
                ) : (
                  <>
                    Start AI Interview
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              {isResumeReady && (
                <p className="mt-4 text-xs text-muted-foreground">
                  ✓ Resume detected
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
