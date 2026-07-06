import { Head, Link,useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
export default function Welcome({ auth,status }) {
     const { data, setData, post, processing, errors, reset } = useForm({
            email: '',
            password: '',
            remember: false,
        });
    
        const submit = (e) => {
            e.preventDefault();
    
            post(route('login'), {
                onFinish: () => reset('password'),
            });
        };
    return (
    <>
    <Head title="Bienvenue - TST Connect" />

    <div className="flex flex-col justify-between min-h-screen bg-gray-100 px-4">
        {/* Section bienvenue */}
        <div className="flex flex-col items-center text-center mt-16">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Bienvenue sur{' '}
                <span className="bg-gradient-to-r from-[#185386] to-[#49B96F] bg-clip-text text-transparent">
                    TSTConnect
                </span>
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto">
                La plateforme de suivi de parcours, de collaboration et d’échange de vos projets.
            </p>
        </div>

        {/* Section principale (formulaire ou bouton selon l'état de connexion) */}
        <div className="flex justify-center items-center flex-grow mb-10">
            {auth.user ? (
                <div className="text-center">
                    <p className="text-xl font-medium mb-6 text-gray-700">
                        Bonjour {auth.user.name},
                    </p>
                    <Link
                        href={route('dashboard')}
                        className="px-8 py-3 bg-gradient-to-r from-[#185386] to-[#49B96F] text-white rounded-xl font-semibold text-lg shadow-lg hover:scale-105 transition-all duration-300"
                    >
                        Accéder à mon espace
                    </Link>
                </div>
            ) : (
                <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
                    <img
                        src="/img/logo11.png"
                        alt="Logo"
                        className="w-48 h-auto mx-auto mb-6"
                    />

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        {/* Champ email */}
                        <div>
                            <InputLabel htmlFor="email" value="Email" />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Champ mot de passe */}
                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Mot de passe" />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Bouton de soumission */}
                        <div className="mt-6">
                            <PrimaryButton
                                className="w-full justify-center bg-gradient-to-r from-[#185386] to-[#49B96F]"
                                disabled={processing}
                            >
                                Se connecter
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            )}
        </div>
    </div>
</>




    );
}
