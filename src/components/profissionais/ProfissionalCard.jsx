import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, Edit, Award, Shield, User, Trash2 } from "lucide-react";
import { format } from "date-fns";

const roleColors = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  profissional: "bg-cyan-100 text-cyan-700 border-cyan-200",
  profissional_saude: "bg-cyan-100 text-cyan-700 border-cyan-200",
  secretaria: "bg-pink-100 text-pink-700 border-pink-200",
  administrativo: "bg-blue-100 text-blue-700 border-blue-200",
  user: "bg-slate-100 text-slate-700 border-slate-200"
};

const roleLabels = {
  admin: "Administrador",
  profissional: "Profissional de Saúde",
  profissional_saude: "Profissional de Saúde",
  secretaria: "Secretária",
  administrativo: "Administrativo",
  user: "Usuário"
};

const roleIcons = {
  admin: Shield,
  profissional: Award,
  profissional_saude: Award,
  secretaria: User,
  administrativo: User,
  user: User
};

export default function ProfissionalCard({ profissional, onEdit, onDelete, isCurrentUser }) {
  // Determine which key to use for styling
  // Priority: role explicitly set -> type -> fallback to user
  let displayKey = 'user';

  if (profissional.role && roleLabels[profissional.role]) {
    displayKey = profissional.role;
  } else if (profissional.tipo_profissional && roleLabels[profissional.tipo_profissional]) {
    displayKey = profissional.tipo_profissional;
  }

  const RoleIcon = roleIcons[displayKey] || User;

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${displayKey === 'admin' ? 'from-purple-400 to-indigo-500' :
        displayKey === 'profissional_saude' ? 'from-cyan-400 to-teal-500' :
          displayKey === 'secretaria' ? 'from-pink-400 to-rose-500' :
            'from-blue-400 to-sky-500'
        }`} />

      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${displayKey === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' :
              displayKey === 'profissional_saude' ? 'bg-gradient-to-br from-cyan-500 to-teal-500' :
                displayKey === 'secretaria' ? 'bg-gradient-to-br from-pink-500 to-rose-500' :
                  'bg-gradient-to-br from-blue-500 to-sky-500'
              }`}>
              {profissional.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {profissional.full_name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Você
                  </span>
                )}
              </h3>
              {profissional.especialidade && (
                <p className="text-sm text-slate-600 font-medium">
                  {profissional.especialidade}
                </p>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${roleColors[displayKey] || roleColors.user}`}>
            <RoleIcon className="w-3 h-3" />
            {roleLabels[displayKey] || roleLabels.user}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {profissional.registro_profissional && (
            <div className="flex items-center gap-2 text-slate-600">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">{profissional.registro_profissional}</span>
            </div>
          )}

          {profissional.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-teal-600" />
              <span className="text-sm truncate">{profissional.email}</span>
            </div>
          )}

          {profissional.telefone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-cyan-600" />
              <span className="text-sm">{profissional.telefone}</span>
            </div>
          )}

          {profissional.data_nascimento && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm">
                {format(new Date(profissional.data_nascimento), "dd/MM/yyyy")}
              </span>
            </div>
          )}
        </div>

        {profissional.cpf && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
              CPF: {profissional.cpf}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            onClick={() => onEdit(profissional)}
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          {onDelete && !isCurrentUser && (
            <Button
              onClick={() => onDelete(profissional)}
              variant="outline"
              size="sm"
              className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}