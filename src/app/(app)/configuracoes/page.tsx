import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtual } from "@/lib/auth";
import { obterTema } from "@/lib/tema";
import { formatDate } from "@/lib/format";
import { alterarSenha, convidarFamiliar } from "./actions";
import { FormularioComEstado } from "./formulario-com-estado";
import { SeletorTema } from "./seletor-tema";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");

  const [tema, membrosFamilia] = await Promise.all([
    obterTema(),
    prisma.usuario.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Configurações</h1>
        <p className="pagina-subtitulo">Sua conta, aparência do app e acesso da família.</p>
      </div>

      <div className="cartao pilha-pequena">
        <h2 className="cartao-titulo">Aparência</h2>
        <p className="texto-suave" style={{ fontSize: "0.85rem", margin: 0 }}>
          Tema atual: <strong>{tema === "claro" ? "Claro" : "Escuro"}</strong>
        </p>
        <SeletorTema temaAtual={tema} />
      </div>

      <div className="cartao pilha-pequena">
        <h2 className="cartao-titulo">Sua conta</h2>
        <p className="texto-suave" style={{ fontSize: "0.85rem", margin: 0 }}>
          {usuario.nome} · {usuario.email}
        </p>

        <FormularioComEstado acao={alterarSenha} className="pilha-pequena" botaoTexto="Alterar senha">
          <input name="senhaAtual" type="password" placeholder="Senha atual" required className="campo" />
          <input
            name="novaSenha"
            type="password"
            placeholder="Nova senha (mín. 6 caracteres)"
            required
            minLength={6}
            className="campo"
          />
        </FormularioComEstado>
      </div>

      <div className="cartao pilha-pequena">
        <h2 className="cartao-titulo">Família com acesso</h2>
        <p className="texto-suave" style={{ fontSize: "0.8rem", margin: 0 }}>
          Quem já tem login neste sistema.
        </p>

        <ul className="lista-simples">
          {membrosFamilia.map((membro) => (
            <li key={membro.id}>
              <div>
                <strong>{membro.nome}</strong>{" "}
                <span className="texto-suave">
                  · {membro.email} · desde {formatDate(membro.createdAt)}
                </span>
              </div>
              {membro.id === usuario.id && <span className="selo selo-info">Você</span>}
            </li>
          ))}
        </ul>

        <FormularioComEstado acao={convidarFamiliar} className="form-grade" botaoTexto="Criar acesso">
          <input name="nome" placeholder="Nome da pessoa" required className="campo" />
          <input name="email" type="email" placeholder="E-mail" required className="campo" />
          <input
            name="senha"
            type="password"
            placeholder="Senha inicial (mín. 6 caracteres)"
            required
            minLength={6}
            className="campo"
          />
        </FormularioComEstado>
      </div>
    </div>
  );
}
