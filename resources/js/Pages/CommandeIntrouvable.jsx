// resources/js/Pages/CommandeIntrouvable.jsx

import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';

export default function CommandeIntrouvable({ auth, message, retryUrl }) {
    const { url } = usePage();
    
    // Message par défaut si non fourni
    const errorMessage = message || "La commande que vous recherchez n'existe pas ou n'a pas pu être trouvée.";
    const backUrl = retryUrl || '/dashboard';
    
    return (
        <Main user={auth.user}>
            <Head title="Commande introuvable" />
            
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="max-w-7xl w-full">
                    {/* Carte principale */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        {/* En-tête avec dégradé */}
                        <div className="bg-gradient-to-r from-[#46BA68] to-[#515E65] px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Commande introuvable
                                    </h1>
                                    <p className="text-white/80 text-sm mt-1">
                                        Nous n'avons pas pu localiser la commande demandée
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Corps de la carte */}
                        <div className="p-8">
                            {/* Illustration */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="w-32 h-32 bg-[#46BA68]/10 rounded-full flex items-center justify-center">
                                        <svg className="w-16 h-16 text-[#46BA68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-2 -right-2">
                                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Message d'erreur */}
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-semibold text-[#515E65] mb-2">
                                    Commande non trouvée
                                </h2>
                                <p className="text-gray-500 leading-relaxed">
                                    {errorMessage}
                                </p>
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                   <p className="text-xs text-gray-500">
                                Assurez-vous que la référence BCA et le RDS sont correctement saisis.
                            </p>
                                </div>
                            </div>
                            
                            {/* Boutons d'action */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={backUrl}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#515E65] font-medium rounded-xl hover:bg-gray-50 hover:border-[#46BA68] transition-all duration-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Retour à l'accueil
                                </Link>
                                
                                
                            </div>
                        </div>
                        
                        
                    </div>
                    
                    
                </div>
            </div>
        </Main>
    );
}
