"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IndexButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const startIndexing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/index`, {
        method: "POST",
      });
      if (res.ok) {
        // CHANGED: Accurate message
        alert("Indexing started! Please wait a few moments for data to appear.");
        router.refresh();
      } else {
        alert("Failed to start indexing");
      }
    } catch (e) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
        onClick={startIndexing}
        disabled={loading}
        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-400"
    >
        {loading ? "Scanning Repository..." : "Start Indexing Codebase"}
    </button>
  );
}