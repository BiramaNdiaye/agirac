import { useState } from 'react';
import { router, Link, Head, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Toaster } from 'react-hot-toast';
import {
    LayoutDashboard,
    ClipboardCheck,
    Cable,
    CalendarClock,
    Waypoints,
    FileText,
    XCircle,
    MessageSquare,
    Clock,
    Users,
    AlertTriangle,
    Menu,
    X,
    LogOut,
} from 'lucide-react';

export default function Main({ header, children, title }) {
    const { auth } = usePage().props;
    const user = auth?.user || null;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', route: 'dashboard', Icon: LayoutDashboard },
        { name: 'Visites techniques', route: 'visites-techniques.index', Icon: ClipboardCheck },
        { name: 'Raccordements', route: 'raccordements.index', Icon: Cable },
        { name: 'Planif Modifier', route: 'edit-planif-dates.index', Icon: CalendarClock },
        { name: 'Route Optiques', route: 'routeoptiques.index', Icon: Waypoints },
        { name: 'Reponse Covage', route: 'docko.index', Icon: FileText },
        { name: 'Commandes Annulées', route: 'annulations.index', Icon: XCircle },
        { name: 'Commentaires', route: 'commentaires.index', Icon: MessageSquare },
        { name: 'Attente client', route: 'attente-client.index', Icon: Clock },
       
        { name: 'Fichiers erreurs', route: 'errors.index', Icon: AlertTriangle },
    ];

    const isRouteActive = (routeName) => {
        if (routeName === '#') return false;
        if (routeName === 'dashboard') return route().current('dashboard');
        if (routeName.includes('.index')) {
            const base = routeName.replace('.index', '');
            return route().current(base + '.*');
        }
        return route().current(routeName);
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const NavList = ({ onNavigate, dense }) => (
        <nav className={dense ? 'flex-1 space-y-0.5 px-3 py-6' : 'flex-1 space-y-0.5 px-3 py-8'}>
            {navigation.map(({ name, route: routeName, Icon }) => {
                const active = isRouteActive(routeName);
                return (
                    <Link
                        key={name}
                        href={routeName === '#' ? '#' : route(routeName)}
                        onClick={onNavigate}
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                            active
                                ? 'bg-white/15 text-white'
                                : 'text-teal-50/70 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-400" />
                        )}
                        <Icon
                            className={`h-[18px] w-[18px] shrink-0 ${
                                active ? 'text-amber-300' : 'text-teal-50/50 group-hover:text-white'
                            }`}
                            strokeWidth={1.75}
                        />
                        <span className="truncate">{name}</span>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#0f766e',
                        color: '#ffffff',
                        borderRadius: '10px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                    },
                }}
            />

            <Head title={title || 'TST CONNECT'} />

            {/* Sidebar desktop */}
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#1c5670] lg:flex">
                <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
                    <Link href={route('dashboard')} className="flex items-center gap-2.5">
                        <ApplicationLogo className="h-7 w-auto fill-current text-white" />
                        
                    </Link>
                </div>

                <NavList />

                <div className="border-t border-white/10 px-4 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-[#1c5670]">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-sm font-medium text-teal-50/90">
                            {user?.name}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Zone principale */}
            <div className="flex min-h-screen flex-col lg:ml-64">
                <header className="border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                        >
                            <Menu className="h-6 w-6" strokeWidth={1.75} />
                        </button>

                        <div className="flex-1" />

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-full bg-[#1c5670] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#164459]"
                        >
                            <LogOut className="h-4 w-4" strokeWidth={2} />
                            Déconnexion
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {header && (
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="font-semibold text-slate-700">{header}</div>
                        </div>
                    )}
                    <div>{children}</div>
                </main>
            </div>

            {/* Drawer mobile */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/50"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="relative flex h-full w-72 max-w-[80%] flex-col bg-[#1c5670] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <span className="text-sm font-semibold text-white">Menu</span>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg p-1 text-teal-50/70 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-5 w-5" strokeWidth={1.75} />
                            </button>
                        </div>
                        <NavList onNavigate={() => setMobileMenuOpen(false)} dense />
                    </div>
                </div>
            )}
        </div>
    );
}
