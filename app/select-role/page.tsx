"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Briefcase, GraduationCap } from "lucide-react";
import { toast } from "sonner";

// Define the roles as a TypeScript union type for safety
type RoleType = "CANDIDATE" | "RECRUITER";

export default function SelectRole() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  // State to track if the initial profile check is done. Prevents immediate screen flash.
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);

  useEffect(() => {
    // 1. Wait for Clerk to load
    if (!isLoaded || !user) {
      setRoleCheckComplete(false);
      return;
    }

    // 2. Check if user already has a role using the secure, session-based endpoint
    fetch("/api/get-role")
      .then((res) => {
        if (res.status === 404) {
          // Profile not found in DB, user needs to select a role.
          setRoleCheckComplete(true);
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch role status");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.role) {
          // Role found, redirect immediately
          if (data.role === "CANDIDATE") {
            router.push("/candidate/dashboard");
          } else if (data.role === "RECRUITER") {
            router.push("/recruiter/dashboard");
          }
        } else {
          // Profile check finished, show role selection UI
          setRoleCheckComplete(true);
        }
      })
      .catch((error) => {
        console.error("Error fetching user role:", error);
        // On error, still allow user to proceed with role selection
        setRoleCheckComplete(true);
      });
  }, [user, isLoaded, router]);

  const handleRoleSelect = async (role: RoleType) => {
    if (!user || isCreatingProfile) return;

    setIsCreatingProfile(true);

    try {
      // 3. POST to the correct API route for profile creation
      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        // Attempt to read and use the server error message
        const errorData = await response.json();
        throw new Error(errorData.error || `Server failed to create profile (${response.status})`);
      }

      toast.success("Profile Created!", {
        description: `Welcome as a ${role}. Redirecting to your dashboard...`,
      });

      // 4. Successful creation, redirect user
      setTimeout(() => {
        router.push(
          role === "CANDIDATE" ? "/candidate/dashboard" : "/recruiter/dashboard"
        );
      }, 500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Error creating profile:", error);
      toast.error("Profile Creation Failed", {
        description: errorMessage,
      });
      setIsCreatingProfile(false);
    }
  };

  // --- Loading States ---

  // Show a full-screen loading spinner while Clerk loads or while checking the role
  if (!isLoaded || !roleCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Checking profile status...</p>
      </div>
    );
  }

  // If loaded and no user is found, direct them back to sign-in (or show nothing)
  if (!user && isLoaded) {
    router.push("/");
    return null;
  }

  // --- Main Content ---

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="bg-card shadow-lg p-10 rounded-[--radius-xl] border border-border max-w-md w-full text-center">
        <h1 className="text-3xl font-extrabold text-foreground mb-4">
          Welcome to ScreenAI!
        </h1>
        <p className="text-muted-foreground mb-8">
          Please select the primary role that best describes how you will use
          the platform.
        </p>

        <div className="flex flex-col gap-6">
          {/* Candidate Button */}
          <button
            onClick={() => handleRoleSelect("CANDIDATE")}
            disabled={isCreatingProfile}
            className={`
              flex items-center justify-center w-full px-6 py-4 
              rounded-[--radius-xl] transition-all duration-300
              text-primary-foreground bg-primary hover:bg-primary/90 
              shadow-lg shadow-primary/30 disabled:opacity-50
            `}
          >
            {isCreatingProfile ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <GraduationCap className="w-5 h-5 mr-2" />
            )}
            I am a <b>Candidate</b> (Practice & Apply)
          </button>

          {/* Recruiter Button */}
          <button
            onClick={() => handleRoleSelect("RECRUITER")}
            disabled={isCreatingProfile}
            className={`
              flex items-center justify-center w-full px-6 py-4 
              rounded-[--radius-xl] transition-all duration-300
              text-secondary-foreground bg-secondary hover:bg-secondary/80 
              border border-border shadow-md shadow-secondary/30 disabled:opacity-50
            `}
          >
            {isCreatingProfile ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Briefcase className="w-5 h-5 mr-2" />
            )}
            I am a <b> Recruiter </b> (Hire & Screen)
          </button>
        </div>
      </div>
    </div>
  );
}
