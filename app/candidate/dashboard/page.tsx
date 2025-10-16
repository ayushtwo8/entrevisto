"use client";

import useSWR from "swr";
import { Briefcase, MapPin, DollarSign, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CandidateDashboard() {
  const { data: jobs, error, isLoading } = useSWR("/api/jobs", fetcher);
  const router = useRouter();

  if (isLoading) return <p className="p-8 text-muted-foreground">Loading jobs...</p>;
  if (error) return <p className="p-8 text-destructive">Failed to load jobs.</p>;

  return (
    <div className="bg-background min-h-screen p-24">
      <h1 className="text-3xl font-bold text-foreground mb-6">Available Job Openings</h1>
      <p className="text-muted-foreground mb-8">Explore active positions you can apply for or take AI screening interviews.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {jobs?.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No jobs available right now.</p>
        ) : (
          jobs.map((job: any) => (
            <div
              key={job.id}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2 text-card-foreground">{job.title}</h2>
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> {job.department}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(job.postedDate).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-foreground line-clamp-3 mb-4">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills?.map((skill: string, i: number) => (
                    <span key={i} className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push(`/candidate/jobs/${job.id}`)}
                className="mt-6 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                View Details / Apply
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
