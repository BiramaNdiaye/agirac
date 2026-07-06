import React, { useState } from 'react';

const Commande = () => {
  const [formData, setFormData] = useState({
    etatBCA: '',
    nomPrefixeCSV: '',
    motifRefus: '',
    accordTiersGestionnaire: '',
    commentaireImpossibilite: '',
    commentaireLibreRetour: '',
    dateEnvoiFichier: '',
    referenceBCA: '',
    dateCommande: '',
    referenceClientOperateur: '',
    offre: '',
    technologie: '',
    adresseSiteANom: '',
    adresseSiteAVoie: '',
    adresseSiteACP: '',
    adresseSiteAVille: '',
    adresseSiteACoordX: '',
    adresseSiteACoordY: '',
    nomProjet: '',
    contactFinalNom: '',
    contactFinalPrenom: '',
    contactFinalTelephone: '',
    contactFinalEmail: '',
    nomClientOperateur: '',
    contactCovageNom: '',
    contactCovagePrenom: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  
  };

  return (
    <div className="mx-auto p-6 bg-white rounded-lg shadow-md">
     <div className="bg-gradient-to-r from-[#F78719] to-[#FF4F04] p-4 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-white flex items-center ">
                            <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Informations Commande (AAA--JJJ--MM)
                        </h2>
                    </div>
      
     
    </div>
  );
};

export default Commande;