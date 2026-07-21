"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconGrid,
  IconArrowUpRight,
  IconFileText,
  IconCreditCard,
  IconTarget,
  IconUsers,
  IconAlertTriangle,
  IconTrendingUp,
  IconBarChart,
  IconCalendar,
  IconSliders,
  IconHelpCircle,
} from "@/components/icons";

const menuPrincipal = [
  { href: "/", label: "Dashboard", Icon: IconGrid },
  { href: "/receitas", label: "Receitas", Icon: IconArrowUpRight },
  { href: "/contas", label: "Contas do Mês", Icon: IconFileText },
  { href: "/cartoes", label: "Cartões de Crédito", Icon: IconCreditCard },
  { href: "/metas", label: "Metas e Prioridades", Icon: IconTarget },
  { href: "/familia", label: "Família e Filhos", Icon: IconUsers },
  { href: "/dividas", label: "Dívidas", Icon: IconAlertTriangle },
];

const emBreve = [
  { label: "Cotações", Icon: IconTrendingUp },
  { label: "Relatórios", Icon: IconBarChart },
  { label: "Planejamento", Icon: IconCalendar },
  { label: "Configurações", Icon: IconSliders },
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
