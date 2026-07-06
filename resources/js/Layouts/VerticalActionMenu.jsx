import React from 'react';

export default function VerticalActionMenu() {
    return (
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">Actions disponibles</h2>

            <button
                onClick={() => alert("Envoi confirmé")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
                <span className="text-xl">📤</span>
                <span className="font-medium">Confirmer l'envoi</span>
            </button>

            <button
                onClick={() => alert("Livraison confirmée")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
                <span className="text-xl">✅</span>
                <span className="font-medium">Confirmer la livraison</span>
            </button>

            <button
                onClick={() => alert("Impossibilité remontée")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
                <span className="text-xl">⚠️</span>
                <span className="font-medium">Signaler une impossibilité</span>
            </button>
        </div>
    );
}