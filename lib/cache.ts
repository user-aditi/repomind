// lib/cache.ts
import { unstable_cache, revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export const getCachedProject = unstable_cache(
  async (projectId: string) => {
    return db.project.findUnique({ where: { id: projectId } });
  },
  ['project'],
  { revalidate: 300, tags: ['projects'] }
);

export function invalidateProjectCache(projectId: string) {
  // Fallback to revalidating the dashboard and projects path
  // This is safer than revalidateTag if the API signature is mismatching
  revalidatePath('/dashboard');
  revalidatePath(`/projects/${projectId}`);
}