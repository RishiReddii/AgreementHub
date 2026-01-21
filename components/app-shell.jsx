'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Gauge,
    Layers,
    FileText,
    BookOpen,
    Menu,
    Search,
    Plus
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', label: 'Overview', icon: Gauge },
    { href: '/blueprints', label: 'Templates', icon: Layers },
    { href: '/contracts/new', label: 'New Document', icon: FileText, cta: true },
    { href: '/api-docs', label: 'API Reference', icon: BookOpen }
];

function NavLinks({ onNavigate }) {
    const pathname = usePathname();

    return (
        <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isCta = Boolean(item.cta);

                return (
                    <Link key={item.href} href={item.href} onClick={onNavigate}>
                        <div
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                isCta
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'text-slate-700 hover:bg-slate-100',
                                isActive && !isCta && 'bg-slate-100 text-slate-900 font-medium'
                            )}
                        >
                            <Icon className={cn('h-4 w-4', isCta ? 'text-white' : 'text-slate-500')} />
                            <span>{item.label}</span>
                            {isCta && <Plus className="ml-auto h-4 w-4" />}
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}

export function AppShell({ title, subtitle, actions, children }) {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-teal-50">
            <div className="mx-auto max-w-screen-2xl px-2 sm:px-3 lg:px-4">
                <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-x-3 lg:gap-x-5">
                    {/* Sidebar (desktop) */}
                    <aside className="hidden border-r border-slate-200/60 bg-white/80 px-4 py-5 backdrop-blur lg:block rounded-r-2xl lg:rounded-2xl lg:mt-4 lg:mb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-600 text-white">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="leading-tight">
                                <div className="text-sm font-semibold text-slate-900">AgreementHub</div>
                                <div className="text-xs text-slate-500">Workspace</div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <NavLinks />
                        </div>

                        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-medium text-slate-600">Tip</div>
                            <div className="mt-1 text-sm text-slate-700">
                                Start with a template, then generate documents in seconds.
                            </div>
                        </div>
                    </aside>

                    {/* Main */}
                    <div className="flex min-w-0 flex-col lg:mt-4 lg:mb-4">
                        {/* Topbar */}
                        <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur rounded-b-2xl lg:rounded-2xl">
                            <div className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 lg:px-5">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="icon" className="lg:hidden">
                                            <Menu className="h-4 w-4" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-80">
                                        <div className="mb-6 flex items-center gap-2">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-600 text-white">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="leading-tight">
                                                <div className="text-sm font-semibold text-slate-900">AgreementHub</div>
                                                <div className="text-xs text-slate-500">Workspace</div>
                                            </div>
                                        </div>
                                        <NavLinks onNavigate={() => { }} />
                                    </SheetContent>
                                </Sheet>

                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
                                    {subtitle ? <div className="truncate text-xs text-slate-500">{subtitle}</div> : null}
                                </div>

                                <div className="ml-auto hidden w-[380px] max-w-[42vw] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 lg:flex">
                                    <Search className="h-4 w-4 text-slate-400" />
                                    <Input
                                        className="h-6 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
                                        placeholder="Search documents, templates…"
                                    />
                                </div>

                                <div className="ml-auto flex items-center gap-2 lg:ml-3">
                                    {actions}
                                </div>
                            </div>
                        </header>

                        <main className="min-w-0 flex-1 px-2.5 py-4 sm:px-3 sm:py-6 lg:px-5 lg:py-6">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}


