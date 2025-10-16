"use client";
import { useState } from "react";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const result = 'Completed'

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);


  return (
    <div className="p-4">
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded ml-2"
      >
        Parse Resume
      </button>

      {result && (
        <pre className="mt-4 bg-gray-100 p-2 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
