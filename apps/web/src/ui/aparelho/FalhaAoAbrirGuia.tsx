"use client";

import { Component, createRef, type ReactNode } from "react";
import { classesDeBotao } from "@/ui/estilosDeBotao";

interface Props {
  children: ReactNode;
  aoTentarDeNovo: () => void;
  aoVoltar: () => void;
}

/**
 * Se o pedaço do "não sei qual é o meu" não baixar (internet caiu entre abrir a tela e tocar no botão), o `lazy` joga o
 * erro para cima e, sem esta barreira, derrubaria a tela de cômodos inteira (seguranca, 25/11/2026). Aqui o erro fica
 * só no lugar das perguntas, com "Tentar de novo" e "Voltar" para as perguntas de antes.
 */
export class FalhaAoAbrirGuia extends Component<Props, { falhou: boolean }> {
  state = { falhou: false };

  private aviso = createRef<HTMLDivElement>();

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  // O texto "Carregando…" que tinha o lugar some: o foco vai para o aviso, para "Tentar de novo" ficar a um Tab.
  componentDidUpdate(_: Props, antes: { falhou: boolean }) {
    if (this.state.falhou && !antes.falhou) this.aviso.current?.focus();
  }

  render() {
    if (!this.state.falhou) return this.props.children;
    return (
      <div ref={this.aviso} tabIndex={-1} role="alert" className="space-y-3 rounded-[var(--radius-controle)] bg-fundo p-4">
        <p className="font-bold text-tinta">Não deu para abrir as perguntas.</p>
        <p className="text-tinta-suave">Pode ser a internet. Confira a conexão e tente de novo.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={this.props.aoTentarDeNovo} className={classesDeBotao("principal")}>
            Tentar de novo
          </button>
          <button type="button" onClick={this.props.aoVoltar} className={classesDeBotao("secundario")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }
}
