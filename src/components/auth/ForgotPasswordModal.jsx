import React, { useState } from 'react';
import { X, Mail, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await base44.auth.resetPasswordForEmail(email);
            setIsSuccess(true);
        } catch (err) {
            console.error("Reset request failed:", err);
            // Avoid revealing if email exists or not for security, but for UX we might show errors
            setError('Ocorreu um erro ao tentar enviar o email. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Header decoration */}
                <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500 w-full" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <KeyRound className="w-6 h-6 text-cyan-600" />
                    </div>

                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Recuperar Senha</h2>
                        <p className="text-slate-500 mt-2">
                            {!isSuccess
                                ? 'Digite seu email para receber um link de redefinição.'
                                : 'Verifique sua caixa de entrada!'}
                        </p>
                    </div>

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2 text-left">
                                <label htmlFor="reset-email" className="text-sm font-medium text-slate-700 ml-1">
                                    Email cadastrado
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        Enviar Link
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100">
                                Enviamos um email para <strong>{email}</strong> com as instruções para redefinir sua senha.
                            </div>

                            <p className="text-xs text-slate-400">
                                Não recebeu? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                            </p>

                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="w-full"
                            >
                                Voltar para Login
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        Ainda com problemas? Contate o suporte.
                    </p>
                </div>
            </div>
        </div>
    );
}
