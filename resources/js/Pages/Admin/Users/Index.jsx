import React, { useState, useEffect } from 'react';
import Main from '@/Layouts/GuestLayout';
import { Link, router, usePage } from '@inertiajs/react';

export default function Index({ users }) {
    const { props } = usePage();
    const authUser = props.auth.user;

    const [animatedStats, setAnimatedStats] = useState({
        total: 0,
        admin: 0,
        chef_projet: 0,
        technicien: 0,
    });

    // Calcul des statistiques à partir des utilisateurs
    useEffect(() => {
        const stats = {
            total: users?.data?.length || 0,
            admin: users?.data?.filter(u => u.roles?.[0]?.name === 'admin').length || 0,
            chef_projet: users?.data?.filter(u => u.roles?.[0]?.name === 'chef_projet').length || 0,
            technicien: users?.data?.filter(u => u.roles?.[0]?.name === 'technicien').length || 0,
        };

        const duration = 800;
        const steps = 20;
        const stepTime = duration / steps;
        const increments = {
            total: stats.total / steps,
            admin: stats.admin / steps,
            chef_projet: stats.chef_projet / steps,
            technicien: stats.technicien / steps,
        };
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setAnimatedStats({
                total: Math.min(Math.floor(increments.total * currentStep), stats.total),
                admin: Math.min(Math.floor(increments.admin * currentStep), stats.admin),
                chef_projet: Math.min(Math.floor(increments.chef_projet * currentStep), stats.chef_projet),
                technicien: Math.min(Math.floor(increments.technicien * currentStep), stats.technicien),
            });
            if (currentStep >= steps) clearInterval(interval);
        }, stepTime);
        return () => clearInterval(interval);
    }, [users]);

    const handleDelete = (id, name) => {
        if (confirm(`Supprimer définitivement l'utilisateur "${name}" ?`)) {
            router.delete(route('admin.users.destroy', id));
        }
    };

    const getRoleBadgeClass = (roleName) => {
        switch (roleName) {
            case 'admin':
                return 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm';
            case 'chef_projet':
                return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm';
            case 'technicien':
                return 'bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-sm';
            default:
                return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-sm';
        }
    };

    const getRoleLabel = (roleName) => {
        switch (roleName) {
            case 'admin': return 'Administrateur';
            case 'chef_projet': return 'Chef de projet';
            case 'technicien': return 'Technicien';
            default: return roleName || 'Aucun';
        }
    };

    const IconSparkle = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>;

    return (
        <Main>
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50/40">
                {/* Effets de fond animés */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-full  mx-auto">
                        {/* En-tête avec titre et bouton */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg animate-bounce">
                                        <IconSparkle className="text-emerald-600" />
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-slate-600 to-emerald-700 bg-clip-text text-transparent animate-gradient">
                                        Gestion des utilisateurs
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-lg flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Gérez les comptes et leurs rôles
                                </p>
                            </div>
                            <Link
                                href={route('admin.users.create')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Nouvel utilisateur
                            </Link>
                        </div>

                        {/* Cartes statistiques animées */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
                            {[
                                { label: 'Total utilisateurs', value: animatedStats.total, color: 'from-slate-600 to-gray-700', icon: '👥' },
                                { label: 'Administrateurs', value: animatedStats.admin, color: 'from-rose-500 to-red-600', icon: '👑' },
                                { label: 'Chefs de projet', value: animatedStats.chef_projet, color: 'from-emerald-500 to-green-600', icon: '📋' },
                                { label: 'Techniciens', value: animatedStats.technicien, color: 'from-emerald-600 to-teal-600', icon: '🔧' },
                            ].map((stat, idx) => (
                                <div key={idx} className="group relative transform transition-all duration-300 hover:scale-105 hover:rotate-1">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/40 shadow-xl overflow-hidden text-center">
                                        <div className="text-3xl mb-1">{stat.icon}</div>
                                        <div className="text-3xl font-black text-slate-800">{stat.value}</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{stat.label}</div>
                                        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tableau des utilisateurs (glassmorphique) */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <div className="inline-block min-w-full align-middle">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-gradient-to-r from-slate-50 to-white">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nom</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rôle</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {users?.data?.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="p-4 bg-slate-100 rounded-full">
                                                                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-slate-500 font-medium">Aucun utilisateur trouvé</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.data.map((user) => {
                                                    const roleName = user.roles?.[0]?.name || null;
                                                    const isCurrentUser = authUser && user.id === authUser.id;
                                                    return (
                                                        <tr key={user.id} className="group hover:bg-white/30 transition-all duration-150">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{user.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.email}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {roleName ? (
                                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${getRoleBadgeClass(roleName)}`}>
                                                                        {getRoleLabel(roleName)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs">Aucun rôle</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <Link
                                                                        href={route('admin.users.edit', user.id)}
                                                                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium transition-all hover:gap-2"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                        Modifier
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDelete(user.id, user.name)}
                                                                        disabled={isCurrentUser}
                                                                        className={`inline-flex items-center gap-1 transition-all ${
                                                                            isCurrentUser
                                                                                ? 'text-slate-400 cursor-not-allowed'
                                                                                : 'text-rose-600 hover:text-rose-800 hover:gap-2'
                                                                        }`}
                                                                        title={isCurrentUser ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer"}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Supprimer
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination stylisée */}
                            {users?.links && users.links.length > 0 && (
                                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 flex justify-center">
                                    <div className="flex gap-1 flex-wrap">
                                        {users.links.map((link, idx) => (
                                            <Link
                                                key={idx}
                                                href={link.url || '#'}
                                                className={`inline-flex items-center justify-center min-w-[2rem] px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                                    link.active
                                                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                                                        : 'bg-white/80 backdrop-blur-sm text-slate-600 border border-slate-200 hover:bg-white/90 hover:border-slate-300'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 3s linear infinite;
                }
            `}</style>
        </Main>
    );
}
