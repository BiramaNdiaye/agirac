import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Main from '@/Layouts/GuestLayout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard({ stats, evolution, recentActivity, recentComments, topOperators, transformationRate }) {
    const [animatedStats, setAnimatedStats] = useState({
        vt_total: 0,
        raccordements_total: 0,
        commentaires_total: 0,
        commentaires_non_lus: 0
    });

    // Animation des compteurs des cartes
    useEffect(() => {
        const duration = 800;
        const steps = 20;
        const stepTime = duration / steps;
        const increments = {
            vt_total: stats.vt.total / steps,
            raccordements_total: stats.raccordements.total / steps,
            commentaires_total: stats.commentaires.total / steps,
            commentaires_non_lus: stats.commentaires.non_lus / steps
        };
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setAnimatedStats({
                vt_total: Math.min(Math.floor(increments.vt_total * currentStep), stats.vt.total),
                raccordements_total: Math.min(Math.floor(increments.raccordements_total * currentStep), stats.raccordements.total),
                commentaires_total: Math.min(Math.floor(increments.commentaires_total * currentStep), stats.commentaires.total),
                commentaires_non_lus: Math.min(Math.floor(increments.commentaires_non_lus * currentStep), stats.commentaires.non_lus)
            });
            if (currentStep >= steps) clearInterval(interval);
        }, stepTime);
        return () => clearInterval(interval);
    }, [stats]);

    // Graphique d’évolution – données
    const vtEvolution = Array.isArray(evolution.vt) ? evolution.vt : [];
    const raccoEvolution = Array.isArray(evolution.raccordements) ? evolution.raccordements : [];

    const lineChartData = {
        labels: vtEvolution.map(item => item.date),
        datasets: [
            {
                label: 'Visites techniques',
                data: vtEvolution.map(item => item.total),
                borderColor: '#10b981', // emerald
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Raccordements',
                data: raccoEvolution.map(item => item.total),
                borderColor: '#4b5563', // gray-600
                backgroundColor: 'rgba(75, 85, 99, 0.05)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#4b5563',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#1e293b', // slate-800
                    font: { weight: 'bold', size: 12 },
                },
                position: 'top',
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                titleColor: '#0f172a',
                bodyColor: '#334155',
                borderColor: '#cbd5e1',
                borderWidth: 1,
                cornerRadius: 12,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            },
        },
        scales: {
            y: {
                grid: { color: '#e2e8f0', drawBorder: false },
                ticks: { color: '#475569' },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#475569' },
            },
        },
    };

    // Graphiques doughnut – répartition des statuts avec couleurs personnalisées (gris/vert)
    const vtStatusData = {
        labels: ['Planifiées', 'Réalisées', 'Impossibles', 'En attente'],
        datasets: [{
            data: [
                stats.vt.planned,
                stats.vt.completed,
                stats.vt.impossible,
                stats.vt.pending,
            ],
            backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'],
            borderWidth: 0,
        }],
    };

    const raccoStatusData = {
        labels: ['Planifiés', 'CR livré', 'DOE livré', 'DFT livré', 'Impossibles', 'En attente'],
        datasets: [{
            data: [
                stats.raccordements.planned,
                stats.raccordements.cr_delivered,
                stats.raccordements.doe_delivered,
                stats.raccordements.dft_delivered,
                stats.raccordements.impossible,
                stats.raccordements.pending,
            ],
            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#f59e0b'],
            borderWidth: 0,
        }],
    };

    const doughnutOptions = {
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#1e293b',
                    font: { size: 11, weight: '500' },
                    boxWidth: 12,
                    padding: 12,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.95)',
                titleColor: '#0f172a',
                bodyColor: '#334155',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                cornerRadius: 8,
            },
        },
    };

    const IconSparkle = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>;

    return (
        <Main>
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50/40">
                {/* Effets de fond - z-index bas */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                {/* Contenu principal - z-index élevé */}
                <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        {/* En-tête avec titre et animations */}
                        <div className="mb-10 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg animate-bounce">
                                    <IconSparkle className="text-emerald-600" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-slate-600 to-emerald-700 bg-clip-text text-transparent animate-gradient">
                                    Tableau de bord
                                </h1>
                            </div>
                            <p className="text-slate-600 text-lg flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Vue d’ensemble de votre activité
                            </p>
                        </div>

                        {/* Cartes globales avec verre dépoli et animation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {[
                                { title: 'Visites techniques', value: animatedStats.vt_total, icon: '📋', color: 'from-emerald-500 to-green-600', link: '/visites-techniques' },
                                { title: 'Raccordements', value: animatedStats.raccordements_total, icon: '🔌', color: 'from-slate-600 to-gray-700', link: '/raccordements' },
                                { title: 'Commentaires', value: animatedStats.commentaires_total, icon: '💬', color: 'from-emerald-600 to-teal-600', link: '/commentaires' },
                                { title: 'Non lus', value: animatedStats.commentaires_non_lus, icon: '🔔', color: 'from-rose-500 to-red-600', link: '/commentaires?status=non_lu' },
                            ].map((stat, idx) => (
                                <Link key={idx} href={stat.link} className="block group">
                                    <div className="relative transform transition-all duration-300 hover:scale-105 hover:rotate-1">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/40 shadow-xl overflow-hidden">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-md text-white`}>
                                                    <span className="text-xl">{stat.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.title}</p>
                                                    <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                                                </div>
                                            </div>
                                            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Graphique d’évolution */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 mb-12 hover:shadow-2xl transition-all duration-300">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <IconSparkle className="w-5 h-5 text-emerald-600" />
                                Évolution des commandes (30 derniers jours)
                            </h2>
                            <Line data={lineChartData} options={lineOptions} />
                        </div>

                        {/* Répartition des statuts (deux graphiques circulaires) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 transition-all duration-300 hover:shadow-2xl">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">Visites techniques – Répartition</h2>
                                <div className="w-64 h-64 mx-auto">
                                    <Doughnut data={vtStatusData} options={doughnutOptions} />
                                </div>
                                <div className="mt-5 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200">
                                        <span className="text-sm text-slate-600">Taux de transformation :</span>
                                        <span className="font-bold text-emerald-600">{transformationRate.vt.rate}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 transition-all duration-300 hover:shadow-2xl">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">Raccordements – Répartition</h2>
                                <div className="w-64 h-64 mx-auto">
                                    <Doughnut data={raccoStatusData} options={doughnutOptions} />
                                </div>
                                <div className="mt-5 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200">
                                        <span className="text-sm text-slate-600">Taux de transformation :</span>
                                        <span className="font-bold text-emerald-600">{transformationRate.raccordements.rate}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top opérateurs */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">🏆 Top opérateurs – Visites techniques</h2>
                                <div className="space-y-3">
                                    {topOperators.vt.map((op, idx) => (
                                        <div key={op.operator_name} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-emerald-600 w-6">#{idx+1}</span>
                                                <span className="text-slate-700 font-medium">{op.operator_name}</span>
                                            </div>
                                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-sm">{op.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">🏆 Top opérateurs – Raccordements</h2>
                                <div className="space-y-3">
                                    {topOperators.raccordements.map((op, idx) => (
                                        <div key={op.operator_name} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-emerald-600 w-6">#{idx+1}</span>
                                                <span className="text-slate-700 font-medium">{op.operator_name}</span>
                                            </div>
                                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-sm">{op.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dernières activités et commentaires non lus */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">⚡ Activités récentes (7 jours)</h2>
                                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scroll">
                                    {recentActivity.length === 0 ? (
                                        <p className="text-slate-500 text-center py-8">Aucune activité récente</p>
                                    ) : (
                                        recentActivity.map(activity => <ActionRow key={activity.id} activity={activity} />)
                                    )}
                                </div>
                                <div className="mt-4 text-right">
                                    <Link href="/visites-techniques" className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition inline-flex items-center gap-1">
                                        Voir toutes les visites →
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">💬 Commentaires non lus</h2>
                                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scroll">
                                    {recentComments.length === 0 ? (
                                        <p className="text-slate-500 text-center py-8">Aucun commentaire non lu</p>
                                    ) : (
                                        recentComments.map(comment => (
                                            <Link key={comment.id} href={comment.link} className="block hover:bg-white/30 transition-colors">
                                                <div className="p-4">
                                                    <p className="text-sm text-slate-700 line-clamp-2">{comment.contenu}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <p className="text-xs text-slate-500">De {comment.auteur} – {comment.reference}</p>
                                                        <p className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                                <div className="mt-4 text-right">
                                    <button className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition">
                                        Marquer tout comme lu →
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-slate-400 text-sm">
                            <p>✨ Données mises à jour en temps réel ✨</p>
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
                .custom-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
            `}</style>
        </Main>
    );
}

// Composant interne pour une ligne d'activité récente
const ActionRow = ({ activity }) => {
    const typeLabel = activity.type === 'vt' ? 'Visite technique' : 'Raccordement';
    const actionLabels = {
        planification: '📅 Planifiée',
        livraison_crvt: '✅ CRVT livré',
        impossibilite: '⚠️ Impossibilité',
        livraison_cr: '📋 CR livré',
        livraison_doe: '📄 DOE livré',
        livraison_dft: '🔧 DFT livré',
    };
    const actionLabel = actionLabels[activity.action_type] || activity.action_type;

    return (
        <Link href={activity.link} className="block hover:bg-white/30 transition-colors">
            <div className="p-4 border-b border-slate-100 last:border-0">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{activity.project || 'Sans projet'}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{activity.reference}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                {typeLabel}
                            </span>
                            <span className="text-xs text-slate-500">{actionLabel}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap ml-2">
                        {new Date(activity.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        </Link>
    );
};
