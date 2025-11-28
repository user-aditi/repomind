// app/dashboard/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  return <EnhancedDashboard user={session.user} />;
}
