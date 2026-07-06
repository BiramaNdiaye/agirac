// resources/js/Pages/Orders/MultipleMatches.jsx

import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function MultipleMatches({ 
    auth, 
    orders, 
    versionsByDate, 
    orderId, 
    bcaReference, 
    totalVersions 
}) {
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [showVersionDetails, setShowVersionDetails] = useState(false);
    const { url } = usePage();

    const formatDate = (dateString) => {
        if (!dateString) return 'Non spécifiée';
        try {
            // Format: YYYYMMDD
            if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
                const year = dateString.substring(0, 4);
                const month = dateString.substring(4, 6);
                const day = dateString.substring(6, 8);
                return `${day}/${month}/${year}`;
            }
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        // Format: HHMM
        if (timeString.length === 4 && /^\d{4}$/.test(timeString)) {
            return `${timeString.substring(0, 2)}:${timeString.substring(2, 4)}`;
        }
        return timeString;
    };

    const formatDateTime = (date, time) => {
        const formattedDate = formatDate(date);
        const formattedTime = formatTime(time);
        if (formattedTime) {
            return `${formattedDate} à ${formattedTime}`;
        }
        return formattedDate;
    };

    const getPrefixColor = (prefix) => {
        const colors = {
            'PLANIFVTDATE': 'bg-blue-100 text-blue-800 border-blue-200',
            'EDITPLANIFDATE': 'bg-amber-100 text-amber-800 border-amber-200',
            'PLANIFDATEVTKO': 'bg-red-100 text-red-800 border-red-200',
            'CRVTCLI': 'bg-green-100 text-green-800 border-green-200',
            'CRIDOCCLI': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'OTPLANIFRACCODATE': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'DOEDOC': 'bg-purple-100 text-purple-800 border-purple-200',
            'DFTDOC': 'bg-violet-100 text-violet-800 border-violet-200',
            'COMMENT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'ATTENTECLIENT': 'bg-orange-100 text-orange-800 border-orange-200'
        };
        return colors[prefix] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getPrefixLabel = (prefix) => {
        const labels = {
            'PLANIFVTDATE': 'Planification RDV',
            'EDITPLANIFDATE': 'Modification RDV',
            'PLANIFDATEVTKO': 'Annulation RDV',
            'CRVTCLI': 'CR Visite Technique',
            'CRIDOCCLI': 'CR Intervention',
            'OTPLANIFRACCODATE': 'Planification Raccordement',
            'DOEDOC': 'Livraison DOE',
            'DFTDOC': 'Livraison DFT',
            'COMMENT': 'Commentaire',
            'ATTENTECLIENT': 'Attente Client'
        };
        return labels[prefix] || prefix;
    };

    const getVersionBadge = (timestamp) => {
        if (!timestamp) return 'Version inconnue';
        
        const now = Date.now() / 1000;
        const diff = now - timestamp;
        const hours = diff / 3600;
        
        if (hours < 24) {
            return 'Version récente';
        } else if (hours < 168) {
            return 'Version récente';
        } else {
            return 'Version archivée';
        }
    };

    const handleSelectVersion = (order) => {
        setSelectedVersion(order);
        setShowVersionDetails(true);
    };

    const handleConfirmSelection = () => {
        if (selectedVersion) {
            router.get(route('orders.details', {
                orderId: selectedVersion.prefix,
                bcaReference: selectedVersion.order.admin_rds,
                selectedDate: selectedVersion.date
            }));
        }
    };

    const handleViewAllVersions = () => {
        router.get(route('orders.versions', {
            orderId: orderId,
            bcaReference: bcaReference
        }));
    };

    // Grouper les commandes par date si ce n'est pas déjà fait
    const groupedOrders = versionsByDate || orders.reduce((groups, order) => {
        const date = order.date || 'unknown';
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(order);
        return groups;
    }, {});

    // Trier les dates du plus récent au plus ancien
    const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
        if (a === 'unknown') return 1;
        if (b === 'unknown') return -1;
        return b.localeCompare(a);
    });

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Commandes multiples trouvées" />
            
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header avec avertissement */}
                    <div className="mb-8 animate-slideDown">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                                <div className="relative p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                                    Plusieurs versions trouvées
                                                </h1>
                                                <p className="text-amber-100 mt-1">
                                                    {totalVersions || orders.length} version(s) de cette commande sont disponibles
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => window.history.back()}
                                                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                </svg>
                                                Retour
                                            </button>
                                            <button
                                                onClick={handleViewAllVersions}
                                                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                                Voir toutes les versions
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informations de recherche */}
                    <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Critères de recherche</h2>
                        </div>
                        <div className="p-6 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                <span className="text-sm text-gray-700">Type de commande:</span>
                                <span className="font-medium text-blue-700">{getPrefixLabel(orderId)} ({orderId})</span>
                            </div>
                            
                            {bcaReference && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">Référence RDS:</span>
                                    <span className="font-medium text-green-700">{bcaReference}</span>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm text-gray-700">Versions disponibles:</span>
                                <span className="font-medium text-purple-700">{totalVersions || orders.length} version(s)</span>
                            </div>
                        </div>
                    </div>

                    {/* Dialog de sélection de version */}
                    {showVersionDetails && selectedVersion && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowVersionDetails(false)}>
                            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                                <div className={`p-6 ${getPrefixColor(selectedVersion.prefix)}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/30 rounded-xl">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">Confirmation de sélection</h3>
                                                <p className="text-sm opacity-80">Veuillez confirmer la version à utiliser</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowVersionDetails(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500 mb-2">Version sélectionnée</p>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {formatDateTime(selectedVersion.date, selectedVersion.time)}
                                        </p>
                                        <p className="text-xs text-gray-400 font-mono mt-1">{selectedVersion.filename}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowVersionDetails(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleConfirmSelection}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-md"
                                        >
                                            Confirmer cette version
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Versions groupées par date */}
                    {sortedDates.map((date) => {
                        const versions = groupedOrders[date];
                        const isCurrent = date === sortedDates[0]; // La version la plus récente
                        
                        return (
                            <div key={date} className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                                        {versions.length}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {date === 'unknown' ? 'Date inconnue' : formatDate(date)}
                                    </h2>
                                    {isCurrent && (
                                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                                            Plus récente
                                        </span>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {versions.map((item, index) => {
                                        const prefixColor = getPrefixColor(item.prefix);
                                        const prefixLabel = getPrefixLabel(item.prefix);
                                        const versionBadge = getVersionBadge(item.timestamp);
                                        const isLatest = index === 0 && isCurrent;
                                        
                                        return (
                                            <div
                                                key={index}
                                                className={`group bg-white rounded-2xl shadow-md hover:shadow-xl border overflow-hidden transition-all duration-300 transform hover:-translate-y-1 animate-slideUp ${
                                                    isLatest ? 'border-green-300 ring-2 ring-green-200' : 'border-gray-100'
                                                }`}
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                {/* Badge de version */}
                                                {isLatest && (
                                                    <div className="absolute top-3 right-3 z-10">
                                                        <span className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded-full shadow-md">
                                                            Dernière version
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* En-tête avec préfixe */}
                                                <div className={`p-5 border-b ${prefixColor.split(' ')[0]} bg-opacity-30`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${prefixColor}`}>
                                                            {prefixLabel}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            {item.prefix}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800">
                                                                {item.order.admin_bca || 'Non spécifié'}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                RDS: {item.order.admin_rds || '-'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Corps de la carte */}
                                                <div className="p-5 space-y-4">
                                                    {/* Date et heure du fichier */}
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            Date de création
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {formatDateTime(item.date, item.time)}
                                                        </p>
                                                        <p className="text-xs text-gray-400 font-mono mt-1 truncate" title={item.filename}>
                                                            {item.filename}
                                                        </p>
                                                    </div>

                                                    {/* Badge de version */}
                                                    <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                                                        versionBadge === 'Version récente' 
                                                            ? 'bg-green-50 text-green-700' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{versionBadge}</span>
                                                    </div>

                                                    {/* Informations du site */}
                                                    {item.order.address_site_a_name && (
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-700">{item.order.address_site_a_name}</p>
                                                                {item.order.address_site_a_town && (
                                                                    <p className="text-xs text-gray-500">{item.order.address_site_a_town}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Opérateur */}
                                                    {item.order.operator_name && (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            <span className="text-sm text-gray-600">{item.order.operator_name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Boutons d'action */}
                                                <div className="p-5 pt-0 flex gap-2">
                                                    <button
                                                        onClick={() => handleSelectVersion(item)}
                                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-medium rounded-xl transition-all duration-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Sélectionner
                                                    </button>
                                                  



<Link
  href={`/orders/${item.order.admin_bca}/${item.order.admin_rds}/${item.prefix}/${item.date || ''}`}
  className="inline-flex items-center justify-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
  Aperçu
</Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Message d'aide */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
                        <div className="flex items-start gap-4 p-5">
                            <div className="flex-shrink-0">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-blue-800">Pourquoi plusieurs versions ?</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    Plusieurs versions de cette commande ont été trouvées. 
                                    Chaque version correspond à un fichier différent avec sa propre date et heure de création.
                                </p>
                                <p className="text-xs text-blue-600 mt-2">
                                    💡 Astuce: La version la plus récente (en haut de la liste) contient les dernières mises à jour. 
                                    Vous pouvez sélectionner une version plus ancienne si nécessaire.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bouton de retour */}
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Retour à la recherche
                        </button>
                    </div>
                </div>
            </div>

            {/* Styles d'animation */}
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-slideDown {
                    animation: slideDown 0.5s ease-out;
                }
                
                .animate-slideUp {
                    animation: slideUp 0.5s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
