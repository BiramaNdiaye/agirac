import React from 'react';


export default function Travaux() {
   

    return (
        <div >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colonne 1 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Date d'envoi du fichier</label>
                      <input
                        type="date"
                        name="dateEnvoiFichier"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Date de la commande</label>
                      <input
                        type="date"
                        name="dateCommande"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Offre</label>
                      <input
                        type="text"
                        name="offre"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Adresse site A : Nom du site</label>
                      <input
                        type="text"
                        name="adresseSiteANom"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Adresse site A : Ville</label>
                      <input
                        type="text"
                        name="adresseSiteAVille"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Adresse site A : coordonnées Y</label>
                      <input
                        type="text"
                        name="adresseSiteACoordY"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
                  </div>
              
                  {/* Colonne 2 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Référence BCA</label>
                      <input
                        type="text"
                        name="referenceBCA"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Référence Client Opérateur</label>
                      <input
                        type="text"
                        name="referenceClientOperateur"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Technologie (FTTO/E/H)</label>
                      <select
                        name="technologie"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      >
                        <option value="">Sélectionner une technologie...</option>
                        <option value="FTTO">FTTO</option>
                        <option value="FTTE">FTTE</option>
                        <option value="FTTH">FTTH</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Adresse site A : Code Postal</label>
                      <input
                        type="text"
                        name="adresseSiteACP"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Adresse site A : coordonnées X</label>
                      <input
                        type="text"
                        name="adresseSiteACoordX"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
              
                    <div>
                      <label className="block text-sm font-bold text-gray-700 flex items-center">Nom Projet</label>
                      <input
                        type="text"
                        name="nomProjet"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F78719] focus:border-[#F78719] transition duration-200 hover:border-gray-400"
                      />
                    </div>
                  </div>
                </div>
        </div>
    );
}