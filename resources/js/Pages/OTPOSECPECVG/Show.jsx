import React from "react";
import { Head, Link } from "@inertiajs/react";


export default function Show({ otposecpecvg }) {


    const Field = ({ label, value }) => (
        <div className="border-b py-2">
            <span className="font-semibold text-gray-700">
                {label} :
            </span>

            <span className="ml-2 text-gray-900">
                {value ?? "-"}
            </span>
        </div>
    );



    return (
        <>
            <Head title="Détail OTPOSECPECVG" />


            <div className="p-6">


                <div className="flex justify-between items-center mb-6">


                    <h1 className="text-2xl font-bold">
                        Détail OTPOSECPECVG
                    </h1>


                    <Link
                        href={route('otposecpecvg.index')}
                        className="px-4 py-2 bg-gray-200 rounded"
                    >
                        Retour
                    </Link>


                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">



                    {/* Informations administratives */}

                    <div className="bg-white shadow rounded p-5">

                        <h2 className="text-lg font-bold mb-4">
                            Informations administratives
                        </h2>


                        <Field 
                            label="RDS"
                            value={otposecpecvg.admin_rds}
                        />


                        <Field
                            label="BCA"
                            value={otposecpecvg.admin_bca}
                        />


                        <Field
                            label="Contrat"
                            value={otposecpecvg.admin_contract}
                        />


                        <Field
                            label="Préfixe"
                            value={otposecpecvg.admin_prefix}
                        />


                        <Field
                            label="Projet"
                            value={otposecpecvg.project_name}
                        />


                        <Field
                            label="Référence ROP"
                            value={otposecpecvg.rop_ref}
                        />


                    </div>




                    {/* Informations techniques */}

                    <div className="bg-white shadow rounded p-5">

                        <h2 className="text-lg font-bold mb-4">
                            Informations techniques
                        </h2>


                        <Field
                            label="Technologie"
                            value={otposecpecvg.techno}
                        />


                        <Field
                            label="Réseau"
                            value={otposecpecvg.network}
                        />


                        <Field
                            label="BPE Piquage"
                            value={otposecpecvg.bpe_piquage}
                        />


                        <Field
                            label="BPE Piquage 2"
                            value={otposecpecvg.bpe_piquage_2}
                        />


                        <Field
                            label="Nombre fibres FON"
                            value={otposecpecvg.number_fibers_fon}
                        />


                        <Field
                            label="Equipement"
                            value={otposecpecvg.equipement_number}
                        />

                    </div>





                    {/* Site A */}

                    <div className="bg-white shadow rounded p-5">

                        <h2 className="text-lg font-bold mb-4">
                            Site A
                        </h2>


                        <Field
                            label="Nom"
                            value={otposecpecvg.address_site_a_name}
                        />


                        <Field
                            label="Adresse"
                            value={otposecpecvg.address_site_a_street}
                        />


                        <Field
                            label="Code postal"
                            value={otposecpecvg.address_site_a_postal}
                        />


                        <Field
                            label="Ville"
                            value={otposecpecvg.address_site_a_town}
                        />


                        <Field
                            label="Coordonnée X"
                            value={otposecpecvg.address_site_a_x}
                        />


                        <Field
                            label="Coordonnée Y"
                            value={otposecpecvg.address_site_a_y}
                        />


                    </div>





                    {/* Site B */}

                    <div className="bg-white shadow rounded p-5">


                        <h2 className="text-lg font-bold mb-4">
                            Site B
                        </h2>



                        <Field
                            label="Nom"
                            value={otposecpecvg.address_site_b_name}
                        />


                        <Field
                            label="Adresse"
                            value={otposecpecvg.address_site_b_street}
                        />


                        <Field
                            label="Code postal"
                            value={otposecpecvg.address_site_b_postal}
                        />


                        <Field
                            label="Ville"
                            value={otposecpecvg.address_site_b_town}
                        />


                        <Field
                            label="Coordonnée X"
                            value={otposecpecvg.address_site_b_x}
                        />


                        <Field
                            label="Coordonnée Y"
                            value={otposecpecvg.address_site_b_y}
                        />


                    </div>





                    {/* Contacts */}

                    <div className="bg-white shadow rounded p-5">


                        <h2 className="text-lg font-bold mb-4">
                            Contacts
                        </h2>


                        <Field
                            label="Contact site A"
                            value={
                                `${otposecpecvg.contact_on_site_firstname ?? ''}
                                ${otposecpecvg.contact_on_site_lastname ?? ''}`
                            }
                        />


                        <Field
                            label="Email site A"
                            value={otposecpecvg.contact_on_site_mail}
                        />


                        <Field
                            label="Téléphone site A"
                            value={otposecpecvg.contact_on_site_phone}
                        />



                        <Field
                            label="Contact site B"
                            value={
                                `${otposecpecvg.contact_on_site_b_firstname ?? ''}
                                ${otposecpecvg.contact_on_site_b_lastname ?? ''}`
                            }
                        />


                        <Field
                            label="Email site B"
                            value={otposecpecvg.contact_on_site_b_mail}
                        />


                        <Field
                            label="Téléphone site B"
                            value={otposecpecvg.contact_on_site_b_phone}
                        />


                    </div>





                    {/* Dates */}

                    <div className="bg-white shadow rounded p-5">


                        <h2 className="text-lg font-bold mb-4">
                            Dates
                        </h2>


                        <Field
                            label="Date commande"
                            value={otposecpecvg.order_date}
                        />


                        <Field
                            label="Début attente client"
                            value={otposecpecvg.begin_client_wait}
                        />


                        <Field
                            label="Fin attente client"
                            value={otposecpecvg.client_wait_end}
                        />


                        <Field
                            label="Annulation"
                            value={otposecpecvg.cancellation_date}
                        />


                    </div>


                </div>


            </div>
        </>
    );
}
