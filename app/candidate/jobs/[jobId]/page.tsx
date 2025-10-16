"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, DollarSign, Briefcase, ArrowLeft, Sparkles } from "lucide-react";

interface Job {
  title: string;
  department: string;
  location: string;
  salary: string;
  description: string;
  requirements: string;
  requiredSkills: string[];
  postedDate: string;
  status: string;
  company?: { name?: string };
}

export default function JobDetailsPage() {
  const {jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    const fetchJob = async () => {
      const res = await fetch(`/api/candidate/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        console.log(data);
      }
      setLoading(false);
    };
    fetchJob();
  }, [jobId]);

  if (loading)
    return <p className="p-8 text-muted-foreground">Loading job details...</p>;

  if (!job)
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Job not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Back Button */}
      <button
        onClick={() => router.push("/candidate/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Job Listings
      </button>

      {/* Job Header */}
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground mb-2">{job.title}</h1>
        <p className="text-muted-foreground mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          {job.department} · {job.company?.name || "Unknown Company"}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {job.location}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> {job.salary}
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Posted on {new Date(job.postedDate).toLocaleDateString()}
          </div>
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-foreground">Job Description</h2>
          <p className="text-muted-foreground leading-relaxed">{job.description}</p>
        </section>

        {/* Requirements */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-foreground">Requirements</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {job.requirements}
          </p>
        </section>

        {/* Skills */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3 text-foreground">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(job.requiredSkills)
      ? job.requiredSkills
      : job.requiredSkills.split(',').map((s) => s.trim())
    ).map((skill, i) => (
      <span
        key={i}
        className="px-3 py-1 text-sm bg-accent/20 text-accent-foreground rounded-full"
      >
        {skill}
      </span>
    ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => alert("Job applied successfully!")}
            className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            Apply Now
          </button>
          <button
            onClick={() => router.push(`/candidate/interview/prep/${jobId}`)}
            className="flex-1 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80 transition"
          >
            Start AI Interview
          </button>
        </div>
      </div>
    </div>
  );
}
