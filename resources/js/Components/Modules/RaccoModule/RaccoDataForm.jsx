import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { router } from '@inertiajs/react';
const VTWorkflow = () => {
  const [csvData, setCsvData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const simulate = true;
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [etatRCFilter, setEtatRCFilter] = useState('');
  const [fileName, setFileName] = useState('');

  // Filtres par colonne
  const [columnFilters, setColumnFilters] = useState({
    ReferenceBCA: '',
    DateVT: '',
    EtatCR: '',
    ContactClient: '',
    NomClient: '',
    Technologie: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

 
  const handleColumnFilterChange = (columnName, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

 const fetchCSVData = async () => {
  try {
    setIsLoading(true);
    
  
    console.log('Début de la récupération des données CSV...');
    
   
    const response = await axios.get('/api/vt/csv-data', {
      timeout: 30000, 
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

    console.log('Réponse reçue:', response);
    
    if (!response.data) {
      throw new Error('Réponse vide du serveur');
    }

    
    const receivedData = response.data;
    if (typeof receivedData !== 'object' || receivedData === null) {
      throw new Error('Format de données invalide');
    }

    const sortedFileNames = Object.keys(receivedData).reverse();
    const allData = sortedFileNames.flatMap(fileName => {
      if (!Array.isArray(receivedData[fileName])) {
        console.warn(`Le fichier ${fileName} ne contient pas un tableau valide`);
        return [];
      }
      return receivedData[fileName];
    });

  
    if (fileName && sortedFileNames.length > 0 && !sortedFileNames.includes(fileName)) {
      const newFiles = sortedFileNames.filter(f => f !== fileName);
      if (newFiles.length > 0) {
        toast.success(`Nouveau(x) fichier(s) détecté(s) : ${newFiles.join(', ')}`, {
          duration: 5000,
          style: {
            background: '#4CAF50',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 9999,
          },
        });
      }
    }

    setCsvData(allData);
    setFileName(sortedFileNames[0] || '');

  } catch (error) {
    console.error('Erreur détaillée:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    const errorMessage = error.response?.data?.message 
      || error.message 
      || 'Erreur inconnue lors de la récupération des données';

    toast.error(`Erreur : ${errorMessage}`, {
      duration: 4000,
      style: {
        background: '#F44336', 
        color: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: 500,
        zIndex: 9999,
      },
    });

    // 6. Réessai automatique pour les erreurs 500
    if (error.response?.status === 500) {
      console.log('Tentative de réessai dans 5 secondes...');
      setTimeout(fetchCSVData, 5000);
    }
  } finally {
    setIsLoading(false);
  }
};
  

  const sendUCRequest = async (ucType, additionalData = {}) => {
    if (!selectedRow) return;

    try {
      setIsLoading(true);
      const payload = {
        ...selectedRow,
        ...additionalData,
        uc_type: ucType,
      };

      if (simulate) {
        setTimeout(() => {
          const mockResponse = {
            message: `Succès pour ${ucType}`,
            data_sent: payload,
            cr_id: ucType === 'UC2.1' ? 'CR12345' : undefined,
          };
          setApiResponse(mockResponse);
          setIsLoading(false);
          setActiveForm(null);
        }, 1000);
      } else {
        let endpoint = '';
        switch (ucType) {
          case 'UC1.1':
            endpoint = '/api/vt/report-impossibility';
            break;
          case 'UC1.2':
            endpoint = '/api/vt/confirm-planning';
            break;
          case 'UC2.1':
            endpoint = '/api/vt/deliver-cr';
            break;
          case 'UC3.1':
            endpoint = '/api/vt/update-planning';
            break;
          case 'UC3.2':
            endpoint = '/api/vt/confirm-delivery';
            break;
          default:
            throw new Error('Type UC non valide');
        }

        const response = await axios.post(endpoint, payload);
        setApiResponse(response.data);
        setActiveForm(null);
      }
    } catch (error) {
      console.error(`Erreur UC ${ucType}:`, error);
    } finally {
      if (!simulate) setIsLoading(false);
    }
  };

  const fetchCRResponse = async (crId) => {
    if (simulate) {
      setIsLoading(true);
      setTimeout(() => {
        const mockCR = {
          cr_id: crId,
          status: 'Delivered',
          details: 'CR livré avec succès.',
        };
        setApiResponse(mockCR);
        setIsLoading(false);
      }, 1000);
    } else {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/vt/cr-response/${crId}`);
        setApiResponse(response.data);
      } catch (error) {
        console.error('Erreur récupération CR:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCSVData();
    const interval = setInterval(fetchCSVData, 50000);
    return () => clearInterval(interval);
   
  }, []);

  function handleRowSelect(row) {
    setSelectedRow(row);
    setFormData({
      DateVT: row.DateVT || '',
      EtatCR: row.EtatCR || '', 
      referenceBCA: row.ReferenceBCA || '',
      technologie: row.Technologie || ''
    });
    setApiResponse(null);
    setActiveForm(null);
  }

const exportCSV = async () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const reference = formData.referenceBCA
    ? formData.referenceBCA.replace(/[^a-zA-Z0-9]/g, '_')
    : 'REF';
  const filename = `PLANIFVT_${reference}_${dateStr}.csv`;

  
  const row = [
    formData.DateVT || '',
    formData.EtatCR || '',
    formData.referenceBCA || '',
    formData.technologie || '',
  ];

  const csvContent = [csvHeaders, row]
    .map(e => e.map(val => `${val}`).join(',')) 
    .join('\n');

  try {
    setIsLoading(true);
    
    // Toast pour indiquer le début de la connexion FTP
    toast.loading('Connexion au FTP en cours...', {
      id: 'ftp-connection',
      duration: 3000,
      style: {
        background: '#3B82F6',
        color: '#ffffff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: 500,
        zIndex: 9999,
      }
    });

    const response = await axios.post('/api/vt/upload-csv', {
      filename: filename,
      content: csvContent
    });

    if (response.data.success) {
      toast.dismiss('sftp-connection');
      toast.success(`Fichier uploadé avec succès sur le FTP: ${filename}`, {
        icon: '',
        duration: 5000,
        style: {
          background: '#F7871A', 
          color: '#f7fafc',       
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 9999,
        },
        success: {
          iconTheme: {
            primary: '#10B981',  
            secondary: '#f0fff4', 
          },
        },
      });
     
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    toast.dismiss('ftp-connection');
    console.error('Erreur upload:', error);
    toast.error(`Erreur lors de l'upload FTP: ${error.message}`, {
      duration: 5000,
      style: {
        background: '#EF4444',
        color: '#FFF5F5',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: 500,
        zIndex: 9999,
      },
      error: {
        iconTheme: {
          primary: '#EF4444', 
          secondary: '#FFF5F5',
        },
      },
    });
  } finally {
    setIsLoading(false);
  }
}; 
/*
  const renderForm = () => {
    switch (activeForm) {
      case 'UC1.1':
        return (
          <div className="mt-6 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="text-2xl font-semibold text-gray-800">UC1.1 — Remonter une impossibilité</h3>
              <button
                onClick={() => setActiveForm(null)}
                className="text-gray-500 hover:text-red-500 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Date de création du fichier</label>
                  <input
                    type="date"
                    name="DateVT"
                    onChange={handleInputChange}
                    value={formData.DateVT || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Adresse site A : Ville</label>
                  <input
                    type="text"
                    name="EtatCR"
                    value={formData.EtatCR || ''}
                    onChange={handleInputChange}
                    placeholder="Ex : Paris"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" readOnly
                  />
                </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Capacité en FO du câble d'extension
                </label>
                <select
                  name="capaciteFO"
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Sélectionner...</option>
                  {[12, 24, 36, 48, 72, 96, 144, 288, 432].map(cap => (
                    <option key={cap} value={cap}>{cap}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Longueur en ML de Génie Civil
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="longueurGC"
                  onChange={handleInputChange}
                  value={formData.longueurGC || ''}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                Commentaire libre état planification VT
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="longueurGC"
                  onChange={handleInputChange}
                  value={formData.longueurGC || ''}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Référence BCA</label>
                  <input
                    type="text"
                    name="referenceBCA"
                    value={formData.referenceBCA || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Motif d'échec</label>
                  <select
                    name="technologie"
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Sélectionner un motif...</option>
                    <option value="Cas de force majeur">Cas de force majeur</option>
                    <option value="Demande d'annulation de la commande à l'initiative du Client">Demande d'annulation</option>
                    <option value="Evènement public">Evènement public</option>
                    <option value="Le Client est indisponible">Client indisponible</option>
                    <option value="Le Client est injoignable">Client injoignable</option>
                    <option value="Le Client ne sais pas">Client ne sait pas</option>
                    <option value="Le Client ne veut pas">Client ne veut pas</option>
                    <option value="Le contact Client est obsolète">Contact obsolète</option>
                    <option value="Le partenaire n'a pas planifié la visite technique">Partenaire non planifié</option>
                    <option value="Le Site Client est en construction">Site en construction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Commentaire libre DOE
                  </label>
                  <input
                    type="text"
                    name="commentaireDOE"
                    onChange={handleInputChange}
                    value={formData.commentaireDOE || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Date dépôt DFT Orange (GCB1)
              </label>
              <input
                type="date"
                name="dateDepotDFT"
                onChange={handleInputChange}
                value={formData.dateDepotDFT || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => setActiveForm(null)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                 onClick={() => exportCSV()}
                className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition shadow-md"
              >
                Envoyer
              </button>
            </div>
          </div>
        );
        
      case 'UC3.1':
        return (
          <div className="mt-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">UC3.1 - Confirmer l'envoi</h3>
              <button
                onClick={() => setActiveForm(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de création du fichier</label>
                  <input
                    type="date"
                    name="dateEnvoiFichier"
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date VT Planif Partenaire</label>
                  <input
                    type="date"
                    name="dateCommande"
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence BCA</label>
                  <input
                    type="text"
                    name="referenceBCA"
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence Client Opérateur</label>
                  <input
                    type="text"
                    name="referenceClientOperateur"
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setActiveForm(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => sendUCRequest('UC3.1', formData)}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
              >
                Confirmer
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
*/
  const filteredData = csvData.filter(row => {
  
    const matchesSearch = searchTerm === '' || row.ReferenceBCA.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateStart = !dateFilterStart || new Date(row.DateVT) >= new Date(dateFilterStart);
    const matchesDateEnd = !dateFilterEnd || new Date(row.DateVT) <= new Date(dateFilterEnd);
    const matchesEtatRC = etatRCFilter === '' || row.EtatCR === etatRCFilter;
    
    
    const matchesColumnFilters = Object.entries(columnFilters).every(([key, value]) => {
      if (!value) return true;
      return String(row[key]).toLowerCase().includes(value.toLowerCase());
    });

    return matchesSearch && matchesDateStart && matchesDateEnd && matchesEtatRC && matchesColumnFilters;
  });
const renderFilters = () => {
  return (
    <div className="bg-white p-4 mb-4 rounded-3xl shadow-lg border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Filtres de recherche</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonne 1 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-4"> Période</h4>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date de début</label>
              <input
                type="date"
                value={dateFilterStart}
                onChange={(e) => setDateFilterStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date de fin</label>
              <input
                type="date"
                value={dateFilterEnd}
                onChange={(e) => setDateFilterEnd(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Colonne 2 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-4"> Détails BCA</h4>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Référence BCA</label>
              <input
                type="text"
                placeholder="Saisir une référence..."
                value={columnFilters.ReferenceBCA}
                onChange={(e) => handleColumnFilterChange('ReferenceBCA', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date VT</label>
              <input
                type="date"
                value={columnFilters.DateVT}
                onChange={(e) => handleColumnFilterChange('DateVT', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Colonne 3 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-4"> Autres critères</h4>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">État CR</label>
              <input
                type="text"
                placeholder="Ex: En attente, Terminé..."
                value={columnFilters.EtatCR}
                onChange={(e) => handleColumnFilterChange('EtatCR', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Technologie</label>
              <input
                type="text"
                placeholder="Ex: Fibre, ADSL..."
                value={columnFilters.Technologie}
                onChange={(e) => handleColumnFilterChange('Technologie', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  const renderTableHeader = () => {
      if (csvData.length === 0) return null;

  return (
    <thead className="bg-[#45C4EB] text-white">
      <tr>
        {Object.keys(csvData[0]).map((key) => (
          <th key={key} className="py-2 px-4 text-left text-sm uppercase border-b">
            {key}
          </th>
        ))}
      </tr>
    </thead>
  );
  };
  return (
  <div className="bg-white min-h-screen py-12">
      <div className="max-w-full mx-auto px-6">
        {/* En-tête */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 border-b-4 border-orange-500 inline-block pb-3 tracking-tight">
            Backlog Raccordement
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            Suivi des fichiers de raccordement et détails des commandes
          </p>
        </header>

        {/* Filtres */}
        <section className="mb-10">
          <div >
            {renderFilters()}
          </div>
        </section>

        {/* Tableau de données */}
        <section>
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  {renderTableHeader()}
                  <tbody className="divide-y divide-gray-100">
                    {filteredData.map((row, index) => (
                      <tr
                        key={index}
                        className={`transition-all duration-200 ${
                          selectedRow?.id === row.id
                            ? 'bg-orange-100'
                            : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => handleRowSelect(row)}
                      >
                        {Object.values(row).map((value, i) => (
                          <td
                            key={i}
                            className="px-6 py-4 whitespace-nowrap text-gray-700"
                          >
                            {String(value)}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => router.visit(`/commande/${row.ReferenceBCA}`)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Voir plus →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20">
                <h3 className="text-lg font-semibold text-gray-800">
                  Aucune donnée disponible
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Aucun résultat ne correspond aux filtres sélectionnés ou le fichier CSV est vide.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Modal détails */}
        {isOpen && selectedRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl relative">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">
                Détails du fichier CSV
              </h2>

              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-600 capitalize mb-1">
                      {key}
                    </label>
                    <input
                      type="text"
                      defaultValue={value}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    />
                  </div>
                ))}
              </form>

              <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  </div>


  );
};

export default VTWorkflow;