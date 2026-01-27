import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Shield, Info, UserPlus } from "lucide-react";

export default function ProfissionalModal({ profissional, onClose }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState(profissional || {
    full_name: '',
    email: '',
    telefone: '',
    cpf: '',
    especialidade: '',
    registro_profissional: '',
    endereco: '',
    data_nascimento: '',

    tipo_profissional: 'profissional_saude',
    role: 'user', // Default role
    password: '' // Campo para senha provisória
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const createProfissionalMutation = useMutation({
    mutationFn: async (data) => {
      // Criar novo usuário
      const novoUsuario = {
        email: data.email,
        full_name: data.full_name,
        role: data.role, // Usa o perfil selecionado
        telefone: data.telefone,
        cpf: data.cpf,
        especialidade: data.especialidade,
        registro_profissional: data.registro_profissional,
        endereco: data.endereco,
        data_nascimento: data.data_nascimento,
        tipo_profissional: data.tipo_profissional,
        password: data.password, // Envia a senha escolhida
        must_change_password: true // Força troca de senha no primeiro login
      };

      // Separa a senha do resto dos dados
      const { password, ...userData } = novoUsuario;

      // Chama a função administrativa (simulada) para criar o usuário
      return await base44.auth.adminCreateUser(userData.email, password, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profissionais']);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (err) => {
      console.error('Erro ao criar profissional:', err);
      setError(err.message || 'Erro ao criar profissional. Verifique se o email já não está cadastrado.');
    }
  });

  const updateProfissionalMutation = useMutation({
    mutationFn: async (data) => {
      // Se houver senha e o usuário for admin, tenta atualizar a senha via shim (Auth)
      if (data.password && data.password.length >= 6) {
        try {
          await base44.auth.adminUpdateUser(profissional.id, data.password, null);
        } catch (e) {
          console.error("Failed to update password:", e);
        }
      }

      // Ensure role is included in the update payload
      const updatePayload = {
        ...data,
        role: data.role // Explicitly ensure role is updated
      };

      return await base44.entities.User.update(profissional.id, updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profissionais']);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (err) => {
      setError(err.message || 'Erro ao atualizar profissional');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validações
    if (!profissional) {
      // Modo criação
      if (!formData.full_name || !formData.email || !formData.password) {
        setError('Nome, email e senha são obrigatórios');
        return;
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (!formData.especialidade) {
        setError('Especialidade é obrigatória');
        return;
      }

      await createProfissionalMutation.mutateAsync(formData);
    } else {
      // Modo edição
      await updateProfissionalMutation.mutateAsync(formData);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const getTipoProfissionalLabel = (tipo) => {
    const labels = {
      profissional_saude: "Profissional de Saúde",
      secretaria: "Secretária",
      administrativo: "Administrativo"
    };
    return labels[tipo] || tipo;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Administrador",
      user: "Usuário Comum",
      profissional: "Profissional",
      secretaria: "Secretária",
      paciente: "Paciente"
    };
    return labels[role] || role;
  };



  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {profissional ? (
              <>
                <Shield className="w-6 h-6 text-cyan-600" />
                Editar Perfil do Profissional
              </>
            ) : (
              <>
                <UserPlus className="w-6 h-6 text-green-600" />
                Cadastrar Novo Profissional
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {profissional ? 'Dados atualizados com sucesso!' : 'Profissional cadastrado com sucesso!'}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!profissional && (
            <Alert className="bg-green-50 border-green-200">
              <UserPlus className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>✅ Cadastro Direto de Profissional</strong>
                <p className="text-sm mt-1">
                  Como administrador, você pode cadastrar profissionais diretamente no sistema.
                  O profissional receberá acesso imediato após o cadastro.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {profissional && (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Nome:</strong> {profissional.full_name}</p>
                    <p><strong>Email:</strong> {profissional.email}</p>
                    <p><strong>Perfil de Acesso:</strong> {getRoleLabel(profissional.role)}</p>
                    {profissional.tipo_profissional && (
                      <p><strong>Tipo:</strong> {getTipoProfissionalLabel(profissional.tipo_profissional)}</p>
                    )}
                    <p><strong>Data de Cadastro:</strong> {new Date(profissional.created_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </AlertDescription>
              </Alert>

              {isAdmin && (
                <div className="space-y-2">
                  <Label className="text-purple-700 font-semibold">Perfil de Acesso (Super Admin)</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger className="border-purple-200 bg-purple-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário Comum</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="secretaria">Secretária</SelectItem>
                      <SelectItem value="paciente">Paciente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-purple-600">
                    <strong>Admin:</strong> Acesso total.<br />
                    <strong>Outros:</strong> Perfis específicos de acesso.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Campos de criação - aparecem apenas para novos profissionais */}
            {!profissional && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-red-600">* Nome Completo</Label>
                  <Input
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nome completo do profissional"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-red-600">* Email</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Este email será usado para acessar o sistema
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-red-600">* Senha Provisória</Label>
                  <Input
                    type="text" // Mostrar senha para conferência do admin ou password se preferir ocultar
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Defina uma senha provisória (mín. 6 caracteres)"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-slate-500">
                  </p>
                </div>
              </>
            )}

            {/* Admin pode redefinir senha na edição também */}
            {profissional && isAdmin && (
              <div className="space-y-2 md:col-span-2">
                <Label className="text-purple-700 font-semibold">Redefinir Senha (Opcional)</Label>
                <Input
                  type="text"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nova senha (deixe em branco para manter a atual)"
                  minLength={6}
                />
                <p className="text-xs text-slate-500">
                  Preencha apenas se desejar alterar a senha do usuário.
                </p>
              </div>
            )}

            {/* SELETOR UNIFICADO DE FUNÇÃO/CARGO */}
            <div className="space-y-2">
              <Label className="text-slate-800 font-semibold">Função no Sistema</Label>
              <Select
                value={formData.role === 'admin' ? 'admin' :
                  formData.role === 'profissional' ? 'profissional' :
                    formData.role === 'secretaria' ? 'secretaria' :
                      formData.role === 'paciente' ? 'paciente' :
                        'profissional'} // Default fallback
                onValueChange={(val) => {
                  let tipo = 'profissional_saude';
                  if (val === 'admin') tipo = 'administrativo';
                  if (val === 'secretaria') tipo = 'secretaria';
                  if (val === 'paciente') tipo = 'paciente';

                  setFormData({
                    ...formData,
                    role: val,
                    tipo_profissional: tipo
                  });
                }}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional de Saúde (Médico, Físio, etc)</SelectItem>
                  <SelectItem value="secretaria">Secretária / Recepção</SelectItem>
                  <SelectItem value="admin">Administrador do Sistema</SelectItem>
                  <SelectItem value="paciente">Paciente</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Define o acesso aos menus e o tipo de perfil do usuário.
              </p>
            </div>

            {/* Campos comuns - editáveis em ambos os modos */}
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.telefone || ''}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={formData.data_nascimento || ''}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className={!profissional ? "text-red-600" : ""}>
                {!profissional && "* "}Especialidade
              </Label>
              <Input
                value={formData.especialidade || ''}
                onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                placeholder="Ex: Psicologia, Fisioterapia, Medicina"
                required={!profissional}
              />
            </div>

            <div className="space-y-2">
              <Label>Registro Profissional</Label>
              <Input
                value={formData.registro_profissional || ''}
                onChange={(e) => setFormData({ ...formData, registro_profissional: e.target.value })}
                placeholder="Ex: CRM 12345, CRP 06/12345"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco || ''}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
          </div>

          {!profissional && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>⚠️ Importante sobre Acesso:</strong>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>O profissional poderá fazer login usando o email cadastrado</li>
                  <li>O sistema pedirá a troca da senha automaticamente no primeiro login</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              disabled={createProfissionalMutation.isPending || updateProfissionalMutation.isPending}
            >
              {createProfissionalMutation.isPending || updateProfissionalMutation.isPending ?
                'Salvando...' :
                profissional ? 'Salvar Alterações' : 'Cadastrar Profissional'
              }
            </Button>
          </div>
        </form>
      </DialogContent >
    </Dialog >
  );
}