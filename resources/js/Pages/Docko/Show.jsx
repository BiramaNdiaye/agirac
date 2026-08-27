import React from 'react';
import { Link, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';

export default function Show({ response }) {
    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('fr-FR');
    };

    const handleMarkAsRead = () => {
        if (!response.is_read) {
            router.post(route('docko.mark-read', response.id), {}, {
                onSuccess: () => router.reload(),
            });
        }
    };

    return (
        <Main>
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-4">
                        <Link href={route('docko.index')} className="text-blue-600 hover:text-blue-800">
                            ← Retour à la liste
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h1 className="text-2xl font-bold text-gray-900">Retour DOCKO</h1>
                                <div className="flex gap-2">
                                    {!response.is_read && (
                                        <button
                                            onClick={handleMarkAsRead}
                                            className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                                        >
                                            Marquer comme lu
                                        </button>
                                    )}
                                    <Link
                                        href={response.commande_type === 'vt'
                                            ? route('visites-techniques.show', response.commande_id)
                                            : route('raccordements.show', response.commande_id)
                                        }
                                        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                                    >
                                        Voir la commande
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-6 border-t pt-4">
                                <dl className="grid grid-cols-1 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Type</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{response.type_label}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">RDS</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{response.rds}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">BCA</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{response.bca}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Statut</dt>
                                        <dd className="mt-1">
                                            <span className={`px-2 py-1 text-sm rounded-full ${
                                                response.status === 'accepte' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {response.status_label}
                                            </span>
                                        </dd>
                                    </div>
                                    {response.fail_reason && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Motif du refus</dt>
                                            <dd className="mt-1 text-sm text-red-600">{response.fail_reason}</dd>
                                        </div>
                                    )}
                                    {response.comment && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Commentaire</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{response.comment}</dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Date d'import</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatDate(response.imported_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Fichier source</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{response.source_file || '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Main>
    );
}
