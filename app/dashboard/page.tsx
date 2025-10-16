"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react";
import RecruiterDashboard from "../recruiter/dashboard/page";
import CandidateDashboard from "../candidate/dashboard/page";

export default function Dashboard() {
    const {user} = useUser();
    const [role, setRole] = useState();

    useEffect(() => {
        if(!user) return;
        fetch(`/api/get-role?id=${user.id}`)
        .then(res => res.json())
        .then(data => setRole(data.role));
    }, [user]);

    if(!role) return <p>Loading...</p>

    return <>
        {role === "RECRUITER" && <RecruiterDashboard />}
        {role === "CANDIDATE" && <CandidateDashboard />}
    </>
}