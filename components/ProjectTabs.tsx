"use client"; // This directive makes it safe to use hooks

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, FileCode, Mic, Settings } from "lucide-react";

export function ProjectTabs({ projectId }: { projectId: string }) {
  return (
    <div className="border-b bg-gray-50 px-6 flex gap-6 overflow-x-auto">
        <TabLink href={`/projects/${projectId}`} icon={LayoutDashboard} label="Overview" exact />
        <TabLink href={`/projects/${projectId}/chat`} icon={MessageSquare} label="Chat" />
        <TabLink href={`/projects/${projectId}/files`} icon={FileCode} label="Code" />
        <TabLink href={`/projects/${projectId}/meetings`} icon={Mic} label="Meetings" />
        <TabLink href={`/projects/${projectId}/settings`} icon={Settings} label="Settings" />
    </div>
  );
}

function TabLink({ href, icon: Icon, label, exact }: any) {
    const pathname = usePathname();
    // Logic to highlight the active tab
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-600 border-transparent hover:border-gray-300 hover:text-gray-900"
            }`}
        >
            <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-gray-500"}`} />
            {label}
        </Link>
    )
}