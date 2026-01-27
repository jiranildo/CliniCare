import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Activity, Mail, Lock, Loader2, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { checkAppState } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            if (isRegistering) {
                // Registration flow
                const { data, error } = await base44.auth.signUp(email, password, {
                    full_name: fullName,
                    role: 'user' // Default role
                });

                if (error) throw error;

                // Check if session exists (auto-login enabled) or if email confirmation is required
                if (data?.session) {
                    await checkAppState();
                } else {
                    setSuccessMessage('Cadastro realizado! Verifique seu email para confirmar a conta (ou faça login se não exigir confirmação).');
                    setIsRegistering(false); // Switch back to login
                }
            } else {
                // Login flow
                const { data, error } = await base44.auth.login(email, password);
                if (error) throw error;

                if (data?.user) {
                    await checkAppState();
                }
            }
        } catch (err) {
            console.error("Auth failed:", err);
            // Translate common Supabase errors if possible
            let msg = err.message;
            if (msg.includes('invalid login credentials')) msg = 'Email ou senha incorretos.';
            if (msg.includes('User already registered')) msg = 'Este email já está cadastrado.';
            if (msg.includes('Password should be at least')) msg = 'A senha deve ter pelo menos 6 caracteres.';

            setError(msg || 'Falha na autenticação. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setSuccessMessage('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-in zoom-in duration-500">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                </div>

                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl transition-all duration-300">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl font-bold text-slate-800">
                            {isRegistering ? 'Crie sua conta' : 'Bem-vindo ao CliniCare'}
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            {isRegistering
                                ? 'Preencha os dados abaixo para começar'
                                : 'Entre com suas credenciais para acessar o sistema'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-green-600" />
                                </div>
                                <p className="text-sm font-medium">{successMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg animate-in shake">
                                    {error}
                                </div>
                            )}

                            {isRegistering && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <Label htmlFor="fullname">Nome Completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="fullname"
                                            className="pl-9"
                                            placeholder="Seu nome"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required={isRegistering}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="pl-9"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    {!isRegistering && (
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                                        >
                                            Esqueceu a senha?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="pl-9"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder={isRegistering ? "Mínimo 6 caracteres" : ""}
                                        minLength={isRegistering ? 6 : undefined}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg font-medium transition-all duration-200"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isRegistering ? 'Cadastrando...' : 'Entrando...'}
                                    </>
                                ) : (
                                    isRegistering ? 'Criar Conta' : 'Entrar'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                                <button
                                    onClick={toggleMode}
                                    className="ml-1 text-cyan-600 hover:text-cyan-700 font-semibold hover:underline focus:outline-none"
                                >
                                    {isRegistering ? 'Fazer Login' : 'Cadastre-se'}
                                </button>
                            </p>
                        </div>

                        {!isRegistering && (
                            <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 text-center animate-in fade-in duration-500 delay-200">
                                <p className="font-semibold mb-1 text-slate-700">Credenciais Superadmin (Demo):</p>
                                <div className="flex flex-col gap-1 items-center">
                                    <p>Email: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-cyan-600 font-mono">admin@clinicare.com</code></p>
                                    <p>Senha: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-cyan-600 font-mono">admin123</code></p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-slate-400 mt-8">
                    &copy; {new Date().getFullYear()} CliniCare. Todos os direitos reservados.
                </p>
            </div>

            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
}
