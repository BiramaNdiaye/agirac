import React, { useState } from 'react';
import Main from '@/Layouts/GuestLayout';
import { Link, router, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import SelectInput from '@/Components/SelectInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Create() {
    const { errors } = usePage().props;
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
    });
    const [processing, setProcessing] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('admin.users.store'), formData, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };

    const IconSparkle = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>;

    return (
        <Main>
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50/40">
                {/* Effets de fond */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto">
                        {/* Lien retour */}
                        <div className="mb-6">
                            <Link
                                href={route('admin.users.index')}
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium transition-all group"
                            >
                                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Retour à la liste
                            </Link>
                        </div>

                        {/* Carte formulaire glassmorphique */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
                            <div className="px-6 py-5 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md">
                                        <IconSparkle className="text-emerald-600" />
                                    </div>
                                    <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">
                                        Créer un utilisateur
                                    </h1>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <InputLabel htmlFor="name" value="Nom complet" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                        autoFocus
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value="Mot de passe" />
                                    <TextInput
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <InputError message={errors.password} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Confirmer le mot de passe" />
                                    <TextInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="role" value="Rôle" />
                                    <SelectInput
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                    >
                                        <option value="">Sélectionner un rôle</option>
                                        <option value="admin">Administrateur</option>
                                        <option value="chef_projet">Chef de projet</option>
                                        <option value="technicien">Technicien</option>
                                    </SelectInput>
                                    <InputError message={errors.role} className="mt-1" />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Link href={route('admin.users.index')}>
                                        <SecondaryButton type="button">Annuler</SecondaryButton>
                                    </Link>
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Création...' : 'Créer l\'utilisateur'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Main>
    );
}
