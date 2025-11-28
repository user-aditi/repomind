"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadMeetingPage({ params }: { params: Promise<{ projectId: string }> }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const resolvedParams = await params; // Unwrap params

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/projects/${resolvedParams.projectId}/meetings/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      router.push(`/projects/${resolvedParams.projectId}/meetings`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong uploading the file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link href=".." className="flex items-center text-sm text-gray-500 mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Meetings
      </Link>
      
      <div className="bg-white p-8 rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Upload Recording</h1>
        <p className="text-gray-500 mb-8">Select a <b>.WAV</b> file to transcribe.</p>

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition">
            <Upload className="h-10 w-10 text-gray-400 mb-4" />
            <input 
              type="file" 
              accept=".wav" 
              onChange={handleFileChange} 
              className="w-full text-center text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-400 mt-2">Max file size: 25MB (Node limit)</p>
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-300 flex justify-center items-center gap-2"
          >
            {uploading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Transcribing... (This may take a minute)
                </>
            ) : (
                "Start Processing"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}