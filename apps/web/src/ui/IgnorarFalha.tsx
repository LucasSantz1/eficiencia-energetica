"use client";

import { Component, type ReactNode } from "react";

/**
 * Para um pedaço opcional da tela que baixa sob demanda (ex.: a sincronização da conta, E4): se o arquivo não chegar,
 * o pedaço some e o resto da tela continua de pé, em vez de cair na tela de erro.
 */
export class IgnorarFalha extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  render() {
    return this.state.falhou ? null : this.props.children;
  }
}
