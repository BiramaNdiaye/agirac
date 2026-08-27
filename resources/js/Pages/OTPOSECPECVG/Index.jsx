import React from "react";
import { Head, Link } from "@inertiajs/react";
import Main from '@/Layouts/GuestLayout';
import { Eye, ChevronRight } from 'lucide-react';

export default function Index({ otposecpecvg, filters }) {
    // Helper function to format empty values
    const formatValue = (value) => value || '—';

    return (
        <Main>
            <Head title="OTPOSECPECVG" />

            <div className="max-w-full  mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xl">
                            OTP
                        </span>
                        <span className="text-gray-600 font-light">/</span>
                        <span className="text-gray-700">Secpecvg</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Liste des enregistrements · {otposecpecvg.total || 0} entrées
                    </p>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        RDS
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        BCA
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Opérateur
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ville
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {otposecpecvg.data.map((item, index) => (
                                    <tr 
                                        key={item.id}
                                        className="hover:bg-blue-50/30 transition-colors duration-150 group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-gray-900">
                                                {formatValue(item.admin_rds)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-700">
                                                {formatValue(item.admin_bca)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                                                <span className="text-gray-700">
                                                    {formatValue(item.operator_name)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-700">
                                                {formatValue(item.address_site_a_town)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link
                                                href={route('otposecpecvg.show', item.id)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow group-hover:scale-105"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>Voir</span>
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {otposecpecvg.data.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-sm">
                                Aucun enregistrement trouvé
                            </p>
                        </div>
                    )}

                    {/* Pagination Info (Optional) */}
                    {otposecpecvg.total > 0 && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                            Affichage de {otposecpecvg.from || 0} à {otposecpecvg.to || 0} sur {otposecpecvg.total || 0} entrées
                        </div>
                    )}
                </div>
            </div>
        </Main>
    );
}
