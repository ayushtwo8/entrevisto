"use client";

import useSWR from "swr";
import { Zap, Briefcase, Calendar, CheckCircle, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";

type InterviewData = {
  id: string;
  status: "Completed" | "In Progress" | "Awaiting Selection" | "Ready";
  score?: number;
  job: {
    title: string;
    company: {
      name: string;
    };
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const InterviewCard: React.FC<{ interview: InterviewData }> = ({ interview }) => {
  const router = useRouter();
  const isReady = interview.status === "Ready";
  const isInProgress = interview.status === "In Progress";

  const handleAction = () => {
    if (isReady) router.push(`/candidate/interview/prep/${interview.id}`);
    else if (isInProgress) router.push(`/interview/call/${interview.id}`);
    else router.push(`/candidate/interview/details/${interview.id}`);
  };

  let icon, statusText, statusColor, actionText, actionStyle;
  switch (interview.status) {
    case "Ready":
      icon = <Zap className="w-5 h-5" />;
      statusText = "Ready to Start Interview";
      statusColor = "text-primary";
      actionText = "Start Interview Now";
      actionStyle = "bg-primary text-primary-foreground hover:bg-primary/90";
      break;
    case "Completed":
      icon = <CheckCircle className="w-5 h-5" />;
      statusText = `Score: ${interview.score ? (interview.score * 100).toFixed(0) : "--"}%`;
      statusColor = "text-primary";
      actionText = "View Feedback";
      actionStyle = "bg-primary text-primary-foreground hover:bg-primary/90";
      break;
    case "In Progress":
      icon = <Hourglass className="w-5 h-5 animate-pulse" />;
      statusText = "Interview in Progress";
      statusColor = "text-destructive";
      actionText = "Resume Session";
      actionStyle = "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      break;
    case "Awaiting Selection":
      icon = <Calendar className="w-5 h-5" />;
      statusText = "Awaiting Recruiter Review";
      statusColor = "text-muted-foreground";
      actionText = "Check Status";
      actionStyle = "bg-secondary text-secondary-foreground hover:bg-secondary/80 border";
      break;
    default:
      icon = <Briefcase className="w-5 h-5" />;
      statusText = interview.status;
      statusColor = "text-muted-foreground";
      actionText = "View Details";
      actionStyle = "bg-muted text-muted-foreground hover:bg-muted/80";
  }

  return (
    <div className="bg-card p-6 border border-border rounded-[--radius-xl] shadow-lg w-full max-w-sm flex flex-col justify-between transition-transform duration-300 hover:shadow-xl hover:scale-[1.01]">
      <div>
        <h3 className="text-xl font-extrabold mb-1">{interview.job.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          {interview.job.company.name}
        </p>

        <div className={`flex items-center gap-2 text-sm font-semibold p-3 mb-6 rounded-[--radius-md] border ${statusColor}`}>
          {icon}
          <span>{statusText}</span>
        </div>
      </div>

      <button
        onClick={handleAction}
        className={`flex items-center justify-center gap-2 w-full px-4 py-3 font-semibold rounded-[--radius-md] ${actionStyle}`}
      >
        {actionText}
      </button>
    </div>
  );
};

export default function CandidateInterviewCards() {
  const { data, error, isLoading } = useSWR("/api/interviews", fetcher);

  if (isLoading) return <p>Loading interviews...</p>;
  if (error) return <p>Failed to load interviews.</p>;

  return (
    <div className="bg-background min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">My Interviews & Practice Sessions</h1>
      <p className="text-muted-foreground mb-8">Review your progress and feedback from completed interviews.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.length === 0 ? (
          <p className="text-muted-foreground">No interviews found yet.</p>
        ) : (
          data.map((interview: InterviewData) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))
        )}
      </div>
    </div>
  );
}
