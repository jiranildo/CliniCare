
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  Activity,
  UserCog,
  CalendarDays,
  User,
  Calendar,
  CreditCard,
  Stethoscope,
  Shield,
  UserCheck,
  Briefcase,
  UserSquare2,
  FileSignature, // Added FileSignature icon
  Lock // Added Lock icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    roles: ["admin", "secretaria", "profissional_saude", "profissional"]
  },
  {
    title: "Agenda",
    url: createPageUrl("Agenda"),
    icon: CalendarDays,
    roles: ["admin", "secretaria"] // Global Agenda: Admin & Secretaria only
  },
  {
    title: "Pacientes",
    url: createPageUrl("Pacientes"),
    icon: Users,
    roles: ["admin", "secretaria"] // Global Pacientes: Admin & Secretaria only
  },
  {
    title: "Profissionais",
    url: createPageUrl("Profissionais"),
    icon: UserCog,
    roles: ["admin", "secretaria"]
  },
  {
    title: "Prontuários",
    url: createPageUrl("Prontuarios"),
    icon: FileText,
    roles: ["admin"] // Global Prontuarios: Admin only (Profissionais use specific menu)
  },
  {
    title: "Atividades",
    url: createPageUrl("Atividades"),
    icon: ClipboardList,
    roles: ["admin", "secretaria", "profissional_saude", "profissional"]
  },
  {
    title: "Contratos",
    url: createPageUrl("Contratos"),
    icon: FileSignature,
    roles: ["admin", "secretaria"]
  },
  {
    title: "Modelos de Contrato",
    url: createPageUrl("ContratoModelos"),
    icon: FileText,
    roles: ["admin", "secretaria"]
  },

  {
    title: "Financeiro",
    url: createPageUrl("Financeiro"),
    icon: DollarSign,
    roles: ["admin", "secretaria"]
  },

];

const menuPacienteItems = [
  {
    title: "Área do Paciente",
    url: createPageUrl("AreaPaciente"),
    icon: User,
    roles: ["admin", "paciente"]
  },
  {
    title: "Meus Agendamentos",
    url: createPageUrl("MeusAgendamentos"),
    icon: Calendar,
    roles: ["admin", "paciente"]
  },
  {
    title: "Meus Pagamentos",
    url: createPageUrl("MeusPagamentos"),
    icon: CreditCard,
    roles: ["admin", "paciente"]
  },
  {
    title: "Meu Prontuário",
    url: createPageUrl("MeuProntuario"),
    icon: Stethoscope,
    roles: ["admin", "paciente"]
  }
];

const menuSecretariaItems = [
  {
    title: "Área da Secretaria",
    url: createPageUrl("AreaSecretaria"),
    icon: UserCheck,
    roles: ["admin", "secretaria"]
  },
  {
    title: "Agenda do Dia",
    url: createPageUrl("Agenda"),
    icon: Calendar,
    roles: ["admin", "secretaria"]
  },
  {
    title: "Gestão de Pacientes",
    url: createPageUrl("Pacientes"),
    icon: Users,
    roles: ["admin", "secretaria"]
  },
  {
    title: "Controle Financeiro",
    url: createPageUrl("Financeiro"),
    icon: DollarSign,
    roles: ["admin", "secretaria"]
  }
];

const menuProfissionalItems = [
  {
    title: "Área do Profissional",
    url: createPageUrl("AreaProfissional"),
    icon: Briefcase,
    roles: ["admin", "profissional_saude", "profissional"]
  },
  {
    title: "Minha Agenda",
    url: createPageUrl("Agenda"),
    icon: CalendarDays,
    roles: ["admin", "profissional_saude", "profissional"]
  },
  {
    title: "Meus Pacientes",
    url: createPageUrl("Pacientes"),
    icon: Users,
    roles: ["admin", "profissional_saude", "profissional"]
  },
  {
    title: "Prontuários",
    url: createPageUrl("Prontuarios"),
    icon: FileText,
    roles: ["admin", "profissional_saude", "profissional"]
  }
];

import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout(false);
  };

  const filteredNavigation = navigationItems.filter(
    item => !user?.role || item.roles.includes(user.role)
  );

  const filteredMenuPaciente = menuPacienteItems.filter(
    item => !user?.role || item.roles.includes(user.role)
  );

  const filteredMenuSecretaria = menuSecretariaItems.filter(
    item => !user?.role || item.roles.includes(user.role)
  );

  const filteredMenuProfissional = menuProfissionalItems.filter(
    item => !user?.role || item.roles.includes(user.role)
  );

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: "Administrador",
      secretaria: "Secretária",
      profissional_saude: "Profissional",
      profissional: "Profissional",
      user: "Usuário"
    };
    return roles[role] || "Usuário";
  };

  const isAdmin = user?.role === 'admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
        <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">CliniCare</h2>
                <p className="text-xs text-slate-500">Gestão de Clínicas</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3 overflow-y-auto">
            {/* MENU PRINCIPAL */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Menu Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`
                            transition-all duration-200 rounded-xl mb-1
                            ${isActive
                              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                              : 'hover:bg-slate-100 text-slate-700'
                            }
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* MENU PACIENTE - APENAS PARA ADMIN OU PACIENTE */}
            {(isAdmin || user?.role === 'paciente') && filteredMenuPaciente.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-2 flex items-center gap-2 bg-purple-50 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-purple-700">Menu Paciente</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredMenuPaciente.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`
                              transition-all duration-200 rounded-xl mb-1
                              ${isActive
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                                : 'hover:bg-purple-50 text-slate-700'
                              }
                            `}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-500'}`} />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* MENU SECRETARIA - APENAS PARA ADMIN OU SECRETARIA */}
            {(isAdmin || user?.role === 'secretaria') && filteredMenuSecretaria.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-2 flex items-center gap-2 bg-pink-50 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-pink-600" />
                  <span className="text-pink-700">Menu Secretaria</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredMenuSecretaria.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`
                              transition-all duration-200 rounded-xl mb-1
                              ${isActive
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                                : 'hover:bg-pink-50 text-slate-700'
                              }
                            `}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-pink-500'}`} />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* MENU PROFISSIONAL - APENAS PARA ADMIN OU PROFISSIONAL */}
            {(isAdmin || user?.role === 'profissional' || user?.role === 'profissional_saude') && filteredMenuProfissional.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-2 flex items-center gap-2 bg-green-50 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-700">Menu Profissional</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredMenuProfissional.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`
                              transition-all duration-200 rounded-xl mb-1
                              ${isActive
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                                : 'hover:bg-green-50 text-slate-700'
                              }
                            `}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-green-500'}`} />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 transition-colors">
                  <Avatar className="h-9 w-9 ring-2 ring-slate-200">
                    <AvatarImage src={user?.foto_url} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white text-sm font-semibold">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {user?.full_name || "Usuário"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {getRoleLabel(user?.role)}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)} className="cursor-pointer">
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 lg:hidden">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-bold text-slate-800">CliniCare</h1>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
