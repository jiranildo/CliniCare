import Agenda from './pages/Agenda';
import Agendamentos from './pages/Agendamentos';
import AreaPaciente from './pages/AreaPaciente';
import AreaProfissional from './pages/AreaProfissional';
import AreaSecretaria from './pages/AreaSecretaria';
import Atividades from './pages/Atividades';
import ContratoModelos from './pages/ContratoModelos';
import Contratos from './pages/Contratos';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';
import Home from './pages/Home';
import MeuProntuario from './pages/MeuProntuario';
import MeusAgendamentos from './pages/MeusAgendamentos';
import MeusPagamentos from './pages/MeusPagamentos';
import Pacientes from './pages/Pacientes';
import Pacotes from './pages/Pacotes';
import Profissionais from './pages/Profissionais';
import Prontuarios from './pages/Prontuarios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "Agendamentos": Agendamentos,
    "AreaPaciente": AreaPaciente,
    "AreaProfissional": AreaProfissional,
    "AreaSecretaria": AreaSecretaria,
    "Atividades": Atividades,
    "ContratoModelos": ContratoModelos,
    "Contratos": Contratos,
    "Dashboard": Dashboard,
    "Estoque": Estoque,
    "Financeiro": Financeiro,
    "Home": Home,
    "MeuProntuario": MeuProntuario,
    "MeusAgendamentos": MeusAgendamentos,
    "MeusPagamentos": MeusPagamentos,
    "Pacientes": Pacientes,
    "Pacotes": Pacotes,
    "Profissionais": Profissionais,
    "Prontuarios": Prontuarios,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};