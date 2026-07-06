// resources/js/Pages/Home.jsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Home() {
    const modules = [
        
        {
            id: 4,
            title: 'NEXLOOP / FTTO',
            description: 'Solutions FTTO Nexloop - Infrastructure réseau',
            icon: '🔄',
            color: 'bg-gradient-to-r from-orange-500 to-orange-700',
            iconColor: 'text-orange-100',
            path: '/modules/nexloop/ftto',
            status: 'active',
            features: [
                'Gestion Nexloop',
                'Infrastructure FTTO',
                'Monitoring réseau'
            ]
        }
    ];

    return (
        <>
            <Head title="Tableau de bord - Modules" />

            {/* Conteneur principal avec fond sombre et centrage */}
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">

                {/* Bouton Déconnexion en haut à droite */}
                <div className="w-full flex justify-end p-6">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg 
                                   transition-all duration-200 font-medium flex items-center gap-2 
                                   hover:shadow-red-500/25 border border-red-400/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Déconnexion
                    </Link>
                </div>

                {/* Contenu centré verticalement */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
                    
                    {/* Titre principal */}
                    <div className="text-center mb-10">
                            <h1 className="text-4xl font-bold text-white mb-3">
                                Tableau de bord - Modules
                            </h1>
                            <p className="text-gray-300 text-lg max-w-2xl">
                                Choisissez un module pour accéder à ses fonctionnalités
                            </p>
                    </div>
                        
                        {/* Grille de modules */}
                    <div className="max-w-7xl w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {modules.map(module => (
                                    <div 
                                        key={module.id} 
                                        className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-700"
                                    >
                                        {/* Bande colorée en haut */}
                                        <div className={`h-3 ${module.color}`}></div>
                                        
                                        <div className="p-6">
                                            {/* En-tête avec icône et statut */}
                                            <div className="flex justify-between items-start mb-5">
                                                <div className={`p-4 rounded-xl ${module.color} shadow-lg`}>
                                                    <span className="text-4xl">{module.icon}</span>
                                                </div>
                                                <span className={`px-3 py-1 text-sm font-semibold rounded-full shadow ${
                                                    module.status === 'active' 
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                }`}>
                                                    {module.status === 'active' ? 'ACTIF' : 'INACTIF'}
                                                </span>
                                            </div>

                                            {/* Titre et description */}
                                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                                {module.title}
                                            </h3>
                                            <p className="text-gray-600 mb-5">
                                                {module.description}
                                            </p>

                                            {/* Liste des fonctionnalités */}
                                            <div className="mb-7">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                                    Fonctionnalités :
                                                </h4>
                                                <ul className="space-y-2">
                                                    {module.features.map((feature, index) => (
                                                        <li key={index} className="flex items-center text-sm text-gray-600">
                                                            <svg className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Bouton d'accès - rendu plus visible */}
                                            <Link
                                                href={module.path}
                                                className={`
                                                    block w-full text-center py-3.5 rounded-xl font-bold
                                                    transition-all duration-300 shadow-lg hover:shadow-xl
                                                    ${module.color} text-white hover:brightness-110
                                                    transform hover:scale-[1.02] active:scale-[0.98]
                                                    border-0 relative overflow-hidden group
                                                `}
                                            >
                                                {/* Effet de brillance au survol */}
                                                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                                                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                                
                                                {/* Texte du bouton */}
                                                <span className="relative flex items-center justify-center">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                    Accéder au module
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                    </div>

                   
                </div>
            </div>
        </>
    );
}
