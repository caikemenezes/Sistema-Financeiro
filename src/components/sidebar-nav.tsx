"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconGrid,
  IconArrowUpRight,
  IconFileText,
  IconTarget,
  IconClock,
  IconUsers,
  IconAlertTriangle,
  IconTrendingUp,
  IconBarChart,
  IconCalendar,
  IconSliders,
  IconEngrenagem,
  IconHelpCircle,
  IconWallet,
} from "@/components/icons";

const menuPrincipal = [
  { href: "/", label: "Dashboard", Icon: IconGrid },
  { href: "/simulador", label: "Simulador", Icon: IconSliders },
  { href: "/receitas", label: "Receitas", Icon: IconArrowUpRight },
  { href: "/contas", label: "Contas do Mês", Icon: IconFileText },
  { href: "/metas", label: "Metas", Icon: IconTarget },
  { href: "/prioridades", label: "Prioridades", Icon: IconClock },
  { href: "/dividas", label: "Dívidas", Icon: IconAlertTriangle },
  { href: "/investimentos", label: "Investimentos e Reservas", Icon: IconWallet },
  { href: "/relatorios", label: "Relatórios", Icon: IconBarChart },
  { href: "/configuracoes", label: "Configurações", Icon: IconEngrenagem },
];

const desativados = [{ label: "Família e Filhos", Icon: IconUsers }];

const emBreve = [
  { label: "Cotações", Icon: IconTrendingUp },
  { label: "Planejamento", Icon: IconCalendar },
  { label: "Ajuda e Suporte", Icon: IconHelpCircle },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav>
      <p className="nav-secao-titulo">Menu principal</p>
      <div className="nav">
        {menuPrincipal.map((item) => {
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={ativo ? "nav-link nav-link-ativo" : "nav-link"}
            >
              <item.Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <p className="nav-secao-titulo">Desativado</p>
      <div className="nav">
        {desativados.map((item) => (
          <span key={item.label} className="nav-link-desabilitado">
            <item.Icon size={18} />
            {item.label}
            <span className="etiqueta-em-breve">desativado</span>
          </span>
        ))}
      </div>

      <p className="nav-secao-titulo">Em breve</p>
      <div className="nav">
        {emBreve.map((item) => (
          <span key={item.label} className="nav-link-desabilitado">
            <item.Icon size={18} />
            {item.label}
            <span className="etiqueta-em-breve">em breve</span>
          </span>
        ))}
      </div>
    </nav>
  );
}
