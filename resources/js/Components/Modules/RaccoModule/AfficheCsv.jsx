import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, InformationCircleIcon, SearchIcon } from '@heroicons/react/outline';

export default function FormulaireBCA() {
  const [searchTerm, setSearchTerm] = useState('');
  const [commandData, setCommandData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchCommand = async () => {
    setIsLoading(true);
    try {
   
      await new Promise(resolve => setTimeout(resolve, 800));
      
     
      const mockData = {
        bcaState: "Validé",
        csvPrefix: "CMD_2023",
        reference: "BCA-2023-0456",
        orderDate: "2023-05-15",
        clientReference: "CLI-78945",
        offer: "Fibre Pro",
        technology: "FTTO",
        projectName: "Immeuble Les Hauts"
        // ... autres champs
      };
      
      setCommandData(mockData);
    } catch (error) {
      console.error("Erreur lors de la recherche", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-6 space-y-8 bg-white rounded-lg shadow-md">
      {/* En-tête avec recherche */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Information commande</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Référence BCA, client ou projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCommand()}
            />
          </div>
          <button
            onClick={searchCommand}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recherche...
              </>
            ) : (
              <>Rechercher</>
            )}
          </button>
        </div>
      </header>

      {commandData ? (
        <>
          {/* Bloc 1 – Informations Générales BCA */}
          <Section title="Informations Générales BCA">
            <InputGrid>
              <InputField 
                placeholder="État du BCA dans X3" 
                value={commandData.bcaState} 
                readOnly 
              />
              <InputField 
                placeholder="Nom préfixe CSV" 
                value={commandData.csvPrefix} 
                readOnly 
              />
              <InputField 
                placeholder="Référence BCA" 
                value={commandData.reference} 
                readOnly 
              />
              <InputField 
                placeholder="Date de la commande" 
                type="date" 
                value={commandData.orderDate} 
                readOnly 
              />
              <InputField 
                placeholder="Référence Client Opérateur" 
                value={commandData.clientReference} 
                readOnly 
              />
              <InputField 
                placeholder="Offre" 
                value={commandData.offer} 
                readOnly 
              />
              <InputField 
                placeholder="Technologie (FTTO/E/H)" 
                value={commandData.technology} 
                readOnly 
              />
              <InputField 
                placeholder="Nom Projet" 
                value={commandData.projectName} 
                readOnly 
              />
            </InputGrid>
          </Section>

          {/* Autres sections avec données... */}
          {/* ... (le reste de votre formulaire) ... */}

          
        </>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <SearchIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Rechercher une commande</h3>
          <p className="mt-1 text-sm text-gray-500">
            Entrez une référence BCA, client ou nom de projet pour afficher les détails.
          </p>
        </div>
      )}
    </div>
  );
}

// Composants réutilisés (inchangés)
function Section({ title, children }) {
  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-xs border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">{title}</h2>
      {children}
    </section>
  );
}

function InputGrid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

function InputField({ placeholder, type = "text", value, readOnly = false }) {
  return (
    <input
      type={type}
      className={`w-full px-4 py-2 border ${readOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
      placeholder={placeholder}
      value={value || ''}
      readOnly={readOnly}
    />
  );
}

// ... (autres composants inchangés)