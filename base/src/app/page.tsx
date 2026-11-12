"use client";

import dynamic from "next/dynamic";

// Tasks live in localStorage, so the dashboard renders in the browser only.
const Dashboard = dynamic(() => import("@/components/Dashboard"), { ssr: false });

export default function Home() {
  return <Dashboard />;
}
