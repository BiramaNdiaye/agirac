import React from 'react';
import { Link } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';


export default function Show({ rejete }) {
  return (
    <Main>
      <h1>Détail du rejet #{rejete.id}</h1>
      <div className="card">
        <div className="card-body">
          <dl className="row">
            <dt className="col-sm-3">Admin RDS</dt>
            <dd className="col-sm-9">{rejete.admin_rds}</dd>
            <dt className="col-sm-3">Admin BCA</dt>
            <dd className="col-sm-9">{rejete.admin_bca}</dd>
            <dt className="col-sm-3">Contrat</dt>
            <dd className="col-sm-9">{rejete.admin_contract}</dd>
            <dt className="col-sm-3">Préfixe</dt>
            <dd className="col-sm-9">{rejete.admin_prefix}</dd>
            <dt className="col-sm-3">Raison d'échec</dt>
            <dd className="col-sm-9">{rejete.fail_reason ?? 'Non renseignée'}</dd>
            <dt className="col-sm-3">Fichier source</dt>
            <dd className="col-sm-9">{rejete.source_file}</dd>
            <dt className="col-sm-3">Date fichier</dt>
            <dd className="col-sm-9">{rejete.file_date ?? 'N/A'}</dd>
            <dt className="col-sm-3">Heure fichier</dt>
            <dd className="col-sm-9">{rejete.file_time ?? 'N/A'}</dd>
            <dt className="col-sm-3">Version active ?</dt>
            <dd className="col-sm-9">{rejete.is_current_version ? 'Oui' : 'Non'}</dd>
            <dt className="col-sm-3">Importé le</dt>
            <dd className="col-sm-9">{new Date(rejete.imported_at).toLocaleString()}</dd>
            <dt className="col-sm-3">Créé le</dt>
            <dd className="col-sm-9">{new Date(rejete.created_at).toLocaleString()}</dd>
            <dt className="col-sm-3">Mis à jour le</dt>
            <dd className="col-sm-9">{new Date(rejete.updated_at).toLocaleString()}</dd>
          </dl>
        </div>
      </div>
      <Link href="/rejetes" className="btn btn-secondary mt-3">Retour</Link>
    </Main>
  );
}
