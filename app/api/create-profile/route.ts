import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// call this api after signup to store role in user db

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk ID to be used as primary key
    const clerkId = user.id; 
    const primaryEmail = user.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "Missing user email from Clerk" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { role } = body;

    // Validate role
    if (role !== "CANDIDATE" && role !== "RECRUITER") {
      return NextResponse.json(
        { error: "Invalid role. Must be CANDIDATE or RECRUITER" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.user.findUnique({
      where: { clerkId: clerkId }, 
      select: { clerkId: true } // Only fetch the ID for existence check
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 409 }
      );
    }

    // Create new profile
    const profile = await prisma.user.create({
      data: {
        clerkId: clerkId, 
        email: primaryEmail,
        role: role,
      },
      select: { clerkId: true, email: true, role: true } // Avoid returning sensitive data
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}