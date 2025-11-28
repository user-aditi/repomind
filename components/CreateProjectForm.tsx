// components/CreateProjectForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Changed from useToast
import { Loader2 } from 'lucide-react';

export function CreateProjectForm() {
  const [name, setName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, githubUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      toast.success('Project created successfully!');

      // Redirect to project page
      router.push(`/projects/${data.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          placeholder="My Awesome Project"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="githubUrl">GitHub Repository URL</Label>
        <Input
          id="githubUrl"
          type="url"
          placeholder="https://github.com/username/repository"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          required
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Make sure the repository is public or you have access to it
        </p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Project
      </Button>
    </form>
  );
}
