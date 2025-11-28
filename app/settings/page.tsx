// app/settings/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { GlobalSettings } from '@/components/GlobalSettings';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <GlobalSettings user={session.user} />;
}
