"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { contarUso } from "./uso";

/**
 * "Ouvir" (HIS-101): o próprio celular lê a tela em voz alta (Web Speech API). Nada vai para servidor nenhum: só usamos
 * voz que roda no aparelho (`localService`). Alguns navegadores de computador oferecem uma voz "da internet" (o texto
 * iria para a empresa do navegador): essa não usamos, e sem voz em português no aparelho o botão não aparece
 * (princípio 5: nada sai do aparelho sem a pessoa saber). Só um "Ouvir" fala por vez; tocar em outro, ou sair da
 * tela, para o que estava falando.
 */
let quemFala: string | null = null;
const ouvintes = new Set<() => void>();

function mudar(dono: string | null) {
  quemFala = dono;
  ouvintes.forEach((avisar) => avisar());
}

function temSintese(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** A voz do aparelho em português do Brasil; senão, outro português do aparelho. Nunca uma voz da internet. */
function vozEmPortugues(): SpeechSynthesisVoice | undefined {
  if (!temSintese()) return undefined;
  const locais = window.speechSynthesis.getVoices().filter((v) => v.localService);
  return locais.find((v) => v.lang.replace("_", "-").toLowerCase() === "pt-br") ?? locais.find((v) => v.lang.toLowerCase().startsWith("pt"));
}

function temVoz(): boolean {
  return vozEmPortugues() !== undefined;
}

/** O Chrome carrega as vozes depois da página: o botão aparece quando elas chegam. */
function assinarVozes(avisar: () => void): () => void {
  if (!temSintese()) return () => undefined;
  window.speechSynthesis.addEventListener("voiceschanged", avisar);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", avisar);
}

function pararTudo() {
  if (temSintese()) window.speechSynthesis.cancel();
  mudar(null);
}

function falar(dono: string, frases: readonly string[]) {
  const sintese = window.speechSynthesis;
  sintese.cancel();
  const voz = vozEmPortugues();
  if (!voz) return;
  // Uma fala por frase: no Chrome, uma fala longa às vezes para no meio (passa de ~15 s).
  const falas = frases.filter((f) => f.trim() !== "").map((frase) => {
    const fala = new SpeechSynthesisUtterance(frase);
    fala.lang = voz.lang;
    fala.voice = voz;
    fala.rate = 0.95;
    return fala;
  });
  const ultima = falas.at(-1);
  if (!ultima) return;
  ultima.onend = () => {
    if (quemFala === dono) mudar(null);
  };
  for (const fala of falas) {
    fala.onerror = () => {
      if (quemFala === dono) mudar(null);
    };
    sintese.speak(fala);
  }
  // Alguns Chrome deixam a síntese "pausada" depois de outra aba falar: sem isso, nada sai.
  sintese.resume();
  mudar(dono);
  contarUso("ouviu");
}

/**
 * `dono`: um nome fixo para este botão (ex.: "resumo", "dicas"). `frases` é chamado no toque, para ler a tela como está
 * agora. `disponivel` é falso no servidor e em navegador sem voz: aí o botão nem aparece.
 */
export function useOuvir(dono: string, frases: () => readonly string[]) {
  const disponivel = useSyncExternalStore(
    assinarVozes,
    temVoz,
    () => false,
  );
  const falando = useSyncExternalStore(
    (avisar) => {
      ouvintes.add(avisar);
      return () => ouvintes.delete(avisar);
    },
    () => quemFala === dono,
    () => false,
  );
  // Saiu da tela (outra página, folha fechada): a voz para junto.
  useEffect(
    () => () => {
      if (quemFala === dono) pararTudo();
    },
    [dono],
  );
  const alternar = useCallback(() => {
    if (!temVoz()) return;
    if (quemFala === dono) pararTudo();
    else falar(dono, frases());
  }, [dono, frases]);
  return { disponivel, falando, alternar };
}
