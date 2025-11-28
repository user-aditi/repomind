"use client";

import { useEffect, useState } from "react";
import { FileCode, Loader2 } from "lucide-react";

interface FileItem {
  id: string;
  filePath: string;
}

export function CodeBrowser({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/files`);
        const data = await res.json();
        setFiles(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [projectId]);

  if (loading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b bg-gray-50 font-semibold text-sm text-gray-700 flex items-center gap-2">
        <FileCode className="h-4 w-4 text-indigo-600" />
        Indexed Files ({files.length})
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {files.length === 0 ? (
            <p className="text-xs text-gray-400 text-center p-4">No files indexed yet.</p>
        ) : (
            files.map((file) => (
            <div 
                key={file.id} 
                className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded cursor-pointer transition"
            >
                <span className="truncate font-mono text-xs">{file.filePath}</span>
            </div>
            ))
        )}
      </div>
    </div>
  );
}