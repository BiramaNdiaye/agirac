import { useState } from 'react';
import { router, Link, Head, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Toaster } from 'react-hot-toast';

export default function Main({ header, children, title }) {
    const { auth } = usePage().props;
    const user = auth?.user || null;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        {
            name: 'Dashboard',
            route: 'dashboard',
            icon: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z'
        },
        {
            name: 'Visites techniques',
            route: 'visites-techniques.index',
            icon: 'M9 12h6m-6 4h6M7 3h6l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z'
        },
        {
            name: 'Raccordements',
            route: 'raccordements.index',
            icon: 'M10.586 13.414a2 2 0 010-2.828l3.172-3.172a2 2 0 112.828 2.828l-1.586 1.586m-5.414 5.414a2 2 0 002.828 0l3.172-3.172a2 2 0 10-2.828-2.828l-1.586 1.586'
        },
         {
            name: 'Planif Modifier',
            route: 'edit-planif-dates.index',
            icon: 'M10.586 13.414a2 2 0 010-2.828l3.172-3.172a2 2 0 112.828 2.828l-1.586 1.586m-5.414 5.414a2 2 0 002.828 0l3.172-3.172a2 2 0 10-2.828-2.828l-1.586 1.586'
        },

        {
            name: 'Route Optiques',
            route: 'routeoptiques.index',
            icon: 'M10.586 13.414a2 2 0 010-2.828l3.172-3.172a2 2 0 112.828 2.828l-1.586 1.586m-5.414 5.414a2 2 0 002.828 0l3.172-3.172a2 2 0 10-2.828-2.828l-1.586 1.586'
        },
	 {
            name: 'Fichiers ok/nok',
            route: 'rejetes.index',
            icon: 'M10.586 13.414a2 2 0 010-2.828l3.172-3.172a2 2 0 112.828 2.828l-1.586 1.586m-5.414 5.414a2 2 0 002.828 0l3.172-3.172a2 2 0 10-2.828-2.828l-1.586 1.586'
        },
 {
            name:'Commandes Annulées',
            route: 'annulations.index',
            icon: 'M10.586 13.414a2 2 0 010-2.828l3.172-3.172a2 2 0 112.828 2.828l-1.586 1.586m-5.414 5.414a2 2 0 002.828 0l3.172-3.172a2 2 0 10-2.828-2.828l-1.586 1.586'
        },

        {
            name: 'Commentaires',
            route: 'commentaires.index',
            icon: 'M8 10h8M8 14h5m-8 6l-4 1 1-4a9 9 0 1111 2H8a1 1 0 00-.447.105z'
        },
        {
            name: 'Attente client',
            route: 'attente-client.index',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        {
            name: 'Gestion utilisateurs',
            route: 'admin.users.index',
            icon: 'M17 20h5v-1a4 4 0 00-5-3.874M9 20H4v-1a4 4 0 015-3.874m8-6.126a4 4 0 11-8 0 4 4 0 018 0zm-10 0a4 4 0 11-8 0 4 4 0 018 0z'
        },
        {
            name: 'Fichiers erreurs',
            route: 'errors.index',
            icon: 'M9.172 9.172a4 4 0 015.656 0M12 14h.01M7 3h6l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z'
        },
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/40">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#10b981',
                        color: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                    },
                }}
            />

            <Head title={title || 'TST CONNECT'} />

            {/* Sidebar Desktop */}
            <aside className="fixed inset-y-0 left-0 z-20 hidden lg:flex lg:flex-col w-64 bg-gradient-to-b from-[#2A7B9B] to-[#1f5f7a] shadow-2xl">
                <div className="flex items-center justify-center h-16 px-4 border-b border-white/20">
                    <Link href={route('dashboard')} className="flex items-center transform transition hover:scale-105 duration-200">
                        <ApplicationLogo className="h-8 w-auto fill-current text-white drop-shadow-md" />
                    </Link>
                </div>

                <nav className="flex-1 py-8 px-3 space-y-1.5">
                    {navigation.map((item) => {
                        const active = isRouteActive(item.route);
                        return (
                            <Link
                                key={item.name}
                                href={item.route === '#' ? '#' : route(item.route)}
                                className={`
                                    group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                    ${active 
                                        ? 'bg-white/20 text-white shadow-lg' 
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }
                                `}
                            >
                                <svg 
                                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                                <span>{item.name}</span>
                                {active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/20 text-sm text-center text-white/80 font-medium">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{user?.name}</span>
                    </div>
                </div>
            </aside>

            {/* Zone principale */}
            <div className="lg:ml-64 flex flex-col min-h-screen">
                <header className=" bg-[#2A7B9B]/10 backdrop-blur-md border-b border-[#2A7B9B]/20 shadow-md">
                    <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden text-slate-600 hover:text-[#2A7B9B] focus:outline-none transition-colors p-1 rounded-lg hover:bg-slate-100"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                           
                            {/* Titre Covage FTTO */}
                            <span className="hidden sm:inline-block text-xl font-bold text-[#2A7B9B] border-l border-slate-300 pl-3 ml-1">
                                Covage FTTO
                            </span>
                        </div>

                        <div className="flex-1"></div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2A7B9B] hover:bg-[#1f5f7a] rounded-full transition-colors shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Déconnexion
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
    {header && (
        <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl shadow-lg mb-6 p-5 transition-all hover:shadow-xl">
            <div className="text-slate-700 font-semibold">{header}</div>
        </div>
    )}
    <div className="animate-fade-in-up">
        {children}
    </div>
</main>
            </div>

            {/* Drawer mobile */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="relative w-72 max-w-[80%] h-full bg-gradient-to-b from-[#2A7B9B] to-[#1f5f7a] shadow-2xl transform transition-transform duration-300">
                        <div className="p-5 border-b border-white/20 flex justify-between items-center">
                            <span className="text-lg font-semibold text-white">Menu</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <nav className="py-6 px-3 space-y-1.5">
                            {navigation.map((item) => {
                                const active = isRouteActive(item.route);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.route === '#' ? '#' : route(item.route)}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                            ${active 
                                                ? 'bg-white/20 text-white shadow-md' 
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                            }
                                        `}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                        </svg>
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
