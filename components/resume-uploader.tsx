"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, UploadCloud, CheckCircle2, X, FileText, Download, Trash2, Eye } from 'lucide-react';

// Add onUploadSuccess to the component's props
type ResumeUploaderProps = {
  onUploadSuccess?: () => void;
};

export function ResumeUploader({ onUploadSuccess }: ResumeUploaderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
   const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [existingResumeId, setExistingResumeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExistingResume = async () => {
      if (!isSignedIn || !user?.id) {
        return;
      }

      await fetchResume();
    };

    fetchExistingResume();
  }, [isSignedIn, user?.id]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadSuccess(false);
      } else {
        setSelectedFile(null);
        toast.error("Invalid file type", { description: "Please upload a PDF file." });
      }
    }
  };

  const fetchResume = async () => {
    try {
      const response = await fetch('/api/resume/fetch');
      if (response.ok) {
        const data = await response.json();
        if (data.resumeUrl) {
          setExistingResumeUrl(data.resumeUrl);
          setExistingResumeId(data.resumeId);
        }
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSignedIn || !user?.id || !selectedFile) {
        toast.error("Please select a file to upload.");
        return;
    }

    setUploading(true);
    setUploadSuccess(false);
    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      toast.loading("Uploading and parsing resume...", { id: "resume-upload" });
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload resume.');
      }

      const data = await response.json();
      toast.success("Resume processed successfully!", { id: "resume-upload" });
      setUploadSuccess(true);
      setSelectedFile(null);

      await fetchResume();

      if(data.resumeUrl){
        setExistingResumeUrl(data.resumeUrl);
      }

      // *** Call the callback function on success ***
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      console.error("Resume upload error:", error);
      toast.error("Resume upload failed", { id: "resume-upload" });
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

   const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your resume?')) return;

    try {
      const response = await fetch(`/api/resume/delete?resumeId=${existingResumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExistingResumeUrl(null);
        toast.success("Resume deleted successfully!");
      } else {
        throw new Error('Failed to delete resume');
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast.error("Failed to delete resume");
    }
  };

  if (!isLoaded) return <div className="text-muted-foreground">Loading...</div>;
  if (!isSignedIn) return <div className="text-muted-foreground">Please sign in.</div>;

  return (
    <div className="bg-card p-8 border border-border rounded-[--radius-xl] shadow-lg">
      {existingResumeUrl && (
        <div className="bg-muted/30 p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-3">Current Resume</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">Your Resume</p>
                <p className="text-sm text-muted-foreground">Uploaded successfully</p>
              </div>
            </div>
            <div className="flex gap-2 md:flex flex-col ">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(existingResumeUrl, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = existingResumeUrl;
                  link.download = 'resume.pdf';
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive "
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
        <h2 className="text-2xl font-bold text-card-foreground mb-4">
            Step 2: Upload Your Resume
        </h2>
        <p className="text-muted-foreground mb-6">
            Upload your resume to get a personalized AI assessment.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
            {!selectedFile ? (
                    <label 
                        htmlFor="resume-file" 
                        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
                        </div>
                        <Input 
                            id="resume-file" 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={uploading || uploadSuccess}
                        />
                    </label>
                ) : (
                    // --- DISPLAY FOR SELECTED FILE ---
                    <div className="flex items-center justify-between w-full h-48 p-4 border-2 border-primary/50 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-4">
                            <FileText className="w-10 h-10 text-primary" />
                            <div>
                                <p className="font-semibold text-foreground truncate">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {Math.round(selectedFile.size / 1024)} KB
                                </p>
                            </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-1 text-muted-foreground rounded-full hover:bg-destructive/20 hover:text-destructive"
                          disabled={uploading}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            <Button type="submit" disabled={!selectedFile || uploading || uploadSuccess} className="w-full h-12 text-base">
                    {uploading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                     : uploadSuccess ? <><CheckCircle2 className="mr-2 h-5 w-5" />Success!</>
                     : <>Analyze Resume</>
                    }
                </Button>
        </form>
    </div>
  );
}