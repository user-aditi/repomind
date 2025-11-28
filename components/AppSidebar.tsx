// components/AppSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FolderGit2, 
  GitBranch,
  Settings, 
  LogOut,
  MessageSquare,
  FileCode,
  Mic,
  BarChart3
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  projectId?: string;
}

export function AppSidebar({ projectId }: SidebarProps) {
  const pathname = usePathname();

  const mainLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const projectLinks = projectId ? [
    {
      href: `/projects/${projectId}`,
      label: 'Overview',
      icon: BarChart3,
    },
    {
      href: `/projects/${projectId}/chat`,
      label: 'AI Chat',
      icon: MessageSquare,
    },
    {
      href: `/projects/${projectId}/files`,
      label: 'Code Files',
      icon: FileCode,
    },
      {
        href: `/projects/${projectId}/commits`,
        label: 'Commits',
        icon: GitBranch,
      },
    {
      href: `/projects/${projectId}/meetings`,
      label: 'Meetings',
      icon: Mic,
    },
    {
      href: `/projects/${projectId}/summary`,
      label: 'Summary',
      icon: BarChart3,
    },
    {
      href: `/projects/${projectId}/settings`,
      label: 'Settings',
      icon: Settings,
    },
  ] : [];

  return (
    <div className="flex h-full flex-col border-r bg-muted/40">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FolderGit2 className="h-6 w-6" />
          <span>RepoMind</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname === link.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <link.icon className="mr-2 h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {projectLinks.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
                PROJECT
              </p>
              {projectLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={pathname === link.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
