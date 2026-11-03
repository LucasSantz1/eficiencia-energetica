// Casos negativos (e controles) das barreiras de camadas e de segurança: HIS-002b, critério 7 e D6.
// Só dados: quem roda é camadas.test.mjs. Cada caso diz quem deve acusar ("eslint" ou "script"), em que arquivo e
// com que regra/mensagem. `espera: null` é um controle (nada pode ser acusado).
//
// Mudar ou apagar um caso exige mudar também OBRIGATORIOS (no fim do arquivo), de propósito: a falta de um id é erro
// no teste (Ab10 da seguranca, P-qa-b1 do qa). Mudanças aqui passam pela seguranca até existir CODEOWNERS (HIS-003).

const SITE = "apps/web/src";

/** Destino `.servidor` usado pelos casos do script (precisa existir na árvore do `mkdtemp`). */
const SERVIDOR_DE_EXEMPLO = {
  [`${SITE}/aplicacao/numeros-do-inicio.servidor.ts`]:
    'import "server-only";\nexport type Numeros = { total: number };\nexport const carregarNumerosDoInicio = () => 1;\n',
};

const eslint = (id, origem, arquivo, codigo, regra, mensagem) => ({
  id,
  origem,
  verificador: "eslint",
  arquivos: { [arquivo]: codigo },
  links: [],
  espera: regra === null ? null : { regra, mensagem },
});

const script = (id, origem, arquivos, mensagem, extras = {}) => ({
  id,
  origem,
  verificador: "script",
  arquivos,
  links: [],
  espera: mensagem === null ? null : { mensagem },
  ...extras,
});

const UI = `${SITE}/ui/Exemplo.ts`;
const UI_TSX = `${SITE}/ui/Exemplo.tsx`;
const T = `${SITE}/ui/T.ts`;
const CADASTRO = `${SITE}/funcionalidades/cadastro/Exemplo.tsx`;
const INFRA = `${SITE}/infraestrutura/Exemplo.ts`;
const APLICACAO = `${SITE}/aplicacao/Exemplo.ts`;
const DOMINIO = "packages/core/src/exemplo.ts";

const SO_UI = "ui só importa";
const IMPORT_DINAMICO = "import() dinâmico ainda não é permitido";
const NODE = "Módulo do Node só em infraestrutura/**/*.servidor.ts";
const SEM_PONTOS = "Sem '..' no caminho";
const DOMINIO_SO = "O domínio (@ee/core) só importa arquivos dele mesmo";
const USE_CLIENT_SERVIDOR = 'arquivo com "use client" não pode importar código só de servidor';

/** HIS-001 §10 item 7 e R13 (ids do plano de testes do qa). */
const ITEM_7_E_R13 = [
  eslint("I7-01", "HIS-001 §10 item 7", UI, 'import { useCasa } from "@/aplicacao/casa";\nexport const usar = useCasa;\n', "no-restricted-imports", SO_UI),
  eslint("I7-02", "HIS-001 §10 item 7", CADASTRO, 'import { TelaComodos } from "@/funcionalidades/comodos/TelaComodos";\nexport const a = TelaComodos;\n', "no-restricted-imports", "funcionalidades/cadastro só importa"),
  eslint("I7-03", "HIS-001 §10 item 7", CADASTRO, 'import { TelaComodos } from "../comodos/TelaComodos";\nexport const a = TelaComodos;\n', "no-restricted-imports", SEM_PONTOS),
  eslint("I7-04", "HIS-001 §10 item 7", CADASTRO, 'import { useCasa } from "@/infraestrutura/armazenamento/casa";\nexport const a = useCasa;\n', "no-restricted-imports", "funcionalidades/cadastro só importa"),
  eslint("I7-05", "HIS-001 §10 item 7", UI, 'const x = require("x");\nexport const a = x;\n', "no-restricted-syntax", "O projeto é ESM"),
  eslint("I7-06", "HIS-001 §10 item 7", UI, 'const x = "ui/Botao";\nexport const m = () => import(`@/${x}`);\n', "no-restricted-syntax", IMPORT_DINAMICO),
  script("I7-07", "HIS-001 §10 item 7", {
    ...SERVIDOR_DE_EXEMPLO,
    [`${SITE}/funcionalidades/exemplo/Cliente.tsx`]:
      '// comentário antes da diretiva\n\'use client\';\nimport { carregarNumerosDoInicio } from "@/aplicacao/numeros-do-inicio.servidor";\nexport const a = carregarNumerosDoInicio;\n',
  }, USE_CLIENT_SERVIDOR),
  eslint("I7-08", "HIS-001 §10 item 7", UI, 'import fs from "fs";\nexport const a = fs;\n', "no-restricted-imports", NODE),
  eslint("I7-09", "HIS-001 §10 item 7", UI, 'import fs from "node:fs";\nexport const a = fs;\n', "no-restricted-imports", NODE),
  eslint("I7-10", "HIS-001 §10 item 7", INFRA, 'import { execFile } from "child_process";\nexport const a = execFile;\n', "no-restricted-imports", NODE),
  script("I7-11", "HIS-001 §10 item 7", {
    [`${SITE}/infraestrutura/dados.servidor.ts`]: "export const ler = () => 1;\n",
  }, 'todo *.servidor.ts começa com import "server-only";'),
  eslint("I7-12", "HIS-001 §10 item 7", APLICACAO, 'import { create } from "zustand";\nexport const a = create;\n', "no-restricted-imports", "zustand só em infraestrutura"),
  eslint("I7-13", "HIS-001 §10 item 7", INFRA, 'import tarifas from "../../public/dados/tarifas.json";\nexport const a = tarifas;\n', "no-restricted-imports", SEM_PONTOS),
  script("I7-14", "HIS-001 §10 item 7", { [`${SITE}/lib/util.ts`]: "export const a = 1;\n" }, "pasta antiga ainda existe"),
  eslint("I7-15", "HIS-001 §10 item 7", DOMINIO, 'import { useState } from "react";\nexport const a = useState;\n', "no-restricted-imports", DOMINIO_SO),
  eslint("R13-01", "R13", UI, 'import type {\n  Casa,\n} from "@/aplicacao/casa";\nexport type A = Casa;\n', "no-restricted-imports", SO_UI),
  eslint("R13-02", "R13", UI, 'export { useCasa } from "@/aplicacao/casa";\n', "no-restricted-imports", SO_UI),
  eslint("R13-03", "R13", UI, 'export const m = () => import("@/infraestrutura/armazenamento/casa");\n', "no-restricted-syntax", IMPORT_DINAMICO),
];

/** Lacunas da S1 (seguranca, HIS-001), ao menos um caso por letra. */
const S1 = [
  eslint("S1-a", "S1 (seguranca, HIS-001)", UI, 'import{useCasa}from"@/aplicacao/casa";\nexport const usar = useCasa;\n', "no-restricted-imports", SO_UI),
  eslint("S1-a-import-sem-espaco", "S1 (seguranca, HIS-001)", APLICACAO, 'import"zustand";\nexport const a = 1;\n', "no-restricted-imports", "zustand só em infraestrutura"),
  eslint("S1-b", "S1 (seguranca, HIS-001)", UI, 'export const m = () => import /* c */ ("@/infraestrutura/armazenamento/casa");\n', "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("S1-c", "S1 (seguranca, HIS-001)", `${SITE}/ui/Exemplo.jsx`, 'import { useCasa } from "@/aplicacao/casa";\nexport const a = useCasa;\n', "no-restricted-imports", SO_UI),
  eslint("S1-c-cjs", "S1 (seguranca, HIS-001)", `${SITE}/ui/Exemplo.cjs`, 'const casa = require("@/aplicacao/casa");\nmodule.exports = casa;\n', "no-restricted-syntax", "O projeto é ESM"),
  eslint("S1-c-dominio-cts", "S1 (seguranca, HIS-001)", "packages/core/src/exemplo.cts", 'import { useState } from "react";\nexport const a = useState;\n', "no-restricted-imports", DOMINIO_SO),
  eslint("S1-e", "S1 (seguranca, HIS-001)", UI, 'import { useCasa } from "/abs/apps/web/src/aplicacao/casa";\nexport const a = useCasa;\n', "no-restricted-imports", "Sem caminho absoluto no import"),
  eslint("S1-e-sufixo", "S1 (seguranca, HIS-001)", UI, 'import texto from "@/ui/Botao?raw";\nexport const a = texto;\n', "no-restricted-imports", "Sem sufixo ? ou #"),
  eslint("S1-f", "S1 (seguranca, HIS-001)", UI, 'export const ler = () => process.getBuiltinModule("node:fs");\n', "no-restricted-syntax", "process.getBuiltinModule fura a regra"),
  eslint("S1-f-colchetes", "S1 (seguranca, HIS-001)", UI, 'export const ler = () => process["getBuiltinModule"]("node:fs");\n', "no-restricted-syntax", "process.getBuiltinModule fura a regra"),
  eslint("S1-g", "S1 (seguranca, HIS-001)", `${SITE}/funcionalidades/dicas/acoes.ts`, '"use server";\nexport async function salvar() {}\n', "no-restricted-syntax", '"use server" cria um endpoint POST público'),
  eslint("S1-g-funcao", "S1 (seguranca, HIS-001)", `${SITE}/funcionalidades/dicas/acoes.ts`, 'export async function salvar() {\n  "use server";\n}\n', "no-restricted-syntax", '"use server" cria um endpoint POST público'),
];

/** Os 21 casos da seguranca (HIS-002b, "Ameaças"), mais o controle que substitui o antigo seguranca-01. */
const SEGURANCA = [
  eslint("seguranca-01", "seguranca-01", T, 'export const m = () => import( "@/ui/Botao" );\n', "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-02", "seguranca-02", T, 'export const m = () => import(\n  "@/infraestrutura/armazenamento/casa"\n);\n', "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-03", "seguranca-03", T, 'const x = "b";\nexport const m = () => import("@/ui/" + x);\n', "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-04", "seguranca-04", T, "export const m = () => import(`@/infraestrutura/armazenamento/casa`);\n", "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-05", "seguranca-05", T, "export const m = () => import('@/ui/' + \"x\");\n", "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-06", "seguranca-06", T, "const x = 'a';\nexport const m = () => import  (x);\n", "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-07", "seguranca-07", T, "const x = 'a';\nexport const m = () => import(/* c */ x);\n", "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-08", "seguranca-08", T, 'export const m = () => import /* c */ ("@/infraestrutura/armazenamento/casa");\n', "no-restricted-syntax", IMPORT_DINAMICO),
  eslint("seguranca-09", "seguranca-09", T, 'export * from "@/aplicacao/casa";\n', "no-restricted-imports", "ui só importa @/ui, @/config e @ee/core"),
  eslint("seguranca-10", "seguranca-10", T, 'import {useCasa} from"@/aplicacao/casa";\nexport const a = useCasa;\n', "no-restricted-imports", SO_UI),
  eslint("seguranca-11", "seguranca-11", T, 'import"@/aplicacao/casa";\n', "no-restricted-imports", SO_UI),
  eslint("seguranca-12", "seguranca-12", T, 'import x = require("@/aplicacao/casa");\nexport const a = x;\n', "no-restricted-syntax", "Use import ... from"),
  eslint("seguranca-13", "seguranca-13", `${SITE}/funcionalidades/dicas/T.ts`, 'import { useCasa } from "@/aplicacao/../infraestrutura/armazenamento/casa";\nexport const a = useCasa;\n', "no-restricted-imports", SEM_PONTOS),
  eslint("seguranca-14", "seguranca-14", `${SITE}/funcionalidades/dicas/T.tsx`, '"use client";\nimport { carregarNumerosDoInicio } from "@/aplicacao/numeros-do-inicio.servidor?x";\nexport const a = carregarNumerosDoInicio;\n', "no-restricted-imports", "Sem sufixo ? ou #"),
  script("seguranca-15", "seguranca-15", {
    ...SERVIDOR_DE_EXEMPLO,
    [`${SITE}/aplicacao/T.ts`]: '"use client";\nexport { carregarNumerosDoInicio } from "./numeros-do-inicio.servidor";\n',
  }, USE_CLIENT_SERVIDOR),
  eslint("seguranca-16", "seguranca-16", T, 'export const ler = () => process.getBuiltinModule("node:fs").readFileSync("/etc/passwd", "utf8");\n', "no-restricted-syntax", "process.getBuiltinModule fura a regra dos módulos do Node"),
  eslint("seguranca-17", "seguranca-17", `${SITE}/ui/T.js`, 'import { useCasa } from "@/aplicacao/casa";\nexport const a = useCasa;\n', "no-restricted-imports", SO_UI),
  eslint("seguranca-18", "seguranca-18", `${SITE}/funcionalidades/dicas/T.jsx`, 'import fs from "node:fs";\nexport const a = fs;\n', "no-restricted-imports", NODE),
  eslint("seguranca-19", "seguranca-19", "packages/core/src/ruim.tsx", 'import { useState } from "react";\nexport const a = useState;\n', "no-restricted-imports", DOMINIO_SO),
  eslint("seguranca-20", "seguranca-20", T, 'import { useCasa } from "/home/exemplo/apps/web/src/infraestrutura/armazenamento/casa";\nexport const a = useCasa;\n', "no-restricted-imports", "Sem caminho absoluto no import"),
  eslint("seguranca-21", "seguranca-21", `${SITE}/funcionalidades/dicas/acoes.ts`, '"use server";\nexport async function salvar() {}\n', "no-restricted-syntax", '"use server" cria um endpoint POST público'),
  eslint("controle-seguranca-01", "controle", T, 'import { Botao } from "@/ui/Botao";\nexport const a = Botao;\n', null),
  eslint("seguranca-27", "seguranca-27", `${SITE}/ui/out/T.ts`, 'import { useCasa } from "@/infraestrutura/armazenamento/casa";\nexport const a = useCasa;\n', "no-restricted-imports", SO_UI),
  eslint("seguranca-28", "seguranca-28", T, "export function f(e: Element, t: string) { e.setHTMLUnsafe(t); }\n", "no-restricted-syntax", "Proibido inserir HTML a partir de texto"),
  eslint("seguranca-28b", "seguranca-28", T, "export const f = (t: string) => document.createRange().createContextualFragment(t);\n", "no-restricted-syntax", "Proibido inserir HTML a partir de texto"),
  eslint("seguranca-29", "seguranca-29", `${SITE}/ui/T.tsx`, 'export function F({ t }: { t: string }) { return <iframe title="x" srcDoc={t} />; }\n', "no-restricted-syntax", "Proibido srcDoc"),
  eslint("seguranca-29b", "seguranca-29", T, "export function f(e: HTMLIFrameElement, t: string) { e.srcdoc = t; }\n", "no-restricted-syntax", "Proibido srcdoc"),
  script("seguranca-30", "seguranca-30", { [`${SITE}/T.ts`]: "export const a = 1;\n" }, "arquivo fora das camadas"),
  script("seguranca-30b", "seguranca-30", { [`${SITE}/funcionalidades/T.ts`]: "export const a = 1;\n" }, "arquivo fora das camadas"),
  script("seguranca-30c", "seguranca-30", { [`${SITE}/lib/T.ts`]: "export const a = 1;\n" }, "pasta antiga ainda existe"),
];

/** Critério 5, T1 (critério 10), diretiva sem uso (critério 11) e arquivo que não faz parse (Ab12). */
const QUALIDADE = [
  eslint("C5-any", "critério 5", UI, "export const a: any = 1;\n", "@typescript-eslint/no-explicit-any", "Unexpected any"),
  eslint("C5-ts-ignore", "critério 5", UI, "// @ts-ignore\nexport const a: number = 1;\n", "@typescript-eslint/ban-ts-comment", "@ts-ignore"),
  eslint("C5-dangerously", "critério 5", UI_TSX, "export function F({ t }: { t: string }) { return <div dangerouslySetInnerHTML={{ __html: t }} />; }\n", "react/no-danger", "dangerouslySetInnerHTML"),
  eslint("C5-innerHTML", "critério 5", UI, "export function f(e: HTMLElement, t: string) { e.innerHTML = t; }\n", "no-restricted-syntax", "Proibido innerHTML"),
  eslint("C5-eval", "critério 5", UI, "export const f = (t: string) => eval(t);\n", "no-eval", "eval"),
  eslint("C5-new-function", "critério 5", UI, 'export const f = () => new Function("return 1");\n', "no-new-func", "Function"),
  eslint("C5-script-url", "Ab6 (seguranca)", UI_TSX, 'export function F() { return <a href="javascript:void(0)">x</a>; }\n', "react/jsx-no-script-url", "javascript"),
  eslint("C5-target-blank", "Ab6 (seguranca)", UI_TSX, 'export function F() { return <a href="https://exemplo.org" target="_blank">x</a>; }\n', "react/jsx-no-target-blank", "noreferrer"),
  eslint("T1-ordem", "critério 10", UI_TSX, 'import { Botao } from "@/ui/Botao";\nimport { useState } from "react";\nexport const a = [Botao, useState];\n', "import-x/order", "should occur before"),
  eslint("D-sem-uso", "critério 11", UI, "// eslint-disable-next-line no-console\nexport const a = 1;\n", "(diretiva)", "Unused eslint-disable directive"),
  eslint("Ab12-parse", "Ab12 (seguranca)", UI, "export const a = ;\n", "(parse)", "Parsing error"),
];

/** Estrutura e diretivas, que só o script vê (D5). */
const ESTRUTURA = [
  script("C1", "C1", { [`${SITE}/components/Botao.tsx`]: "export const a = 1;\n" }, "pasta antiga ainda existe"),
  script("C2", "C2", { [`${SITE}/Solto.ts`]: "export const a = 1;\n" }, "arquivo fora das camadas"),
  script("C3", "C3", { "packages/core/src/index.ts": "export const a = 1;\n" }, "nenhum arquivo lido em apps/web/src", { arvoreMinima: false, pastas: [SITE] }),
  script("C6", "C6", {
    [`${SITE}/infraestrutura/arquivos.servidor.ts`]: 'import { readFileSync } from "node:fs";\nimport "server-only";\nexport const ler = readFileSync;\n',
  }, 'todo *.servidor.ts começa com import "server-only";'),
  script("C7", "C7", {
    ...SERVIDOR_DE_EXEMPLO,
    [`${SITE}/funcionalidades/exemplo/Cliente.tsx`]:
      '"use client";\nimport type { Numeros } from "@/aplicacao/numeros-do-inicio.servidor";\nexport type A = Numeros;\n',
  }, USE_CLIENT_SERVIDOR),
];

/**
 * Gêmeos permitidos da matriz (observação do qa): a matriz é "lista do que pode", então um regex que proibisse tudo
 * passaria em todos os negativos. Cada permissão tem um caso que precisa passar limpo, e cada camada um arquivo limpo.
 */
const usa = (especificador, nome = "a") => `import { ${nome} } from "${especificador}";\nexport const b = ${nome};\n`;
const MATRIZ = [
  eslint("controle-camada-app", "controle", `${SITE}/app/exemplo/page.tsx`, "export default function Pagina() { return null; }\n", null),
  eslint("controle-camada-funcionalidades", "controle", CADASTRO, "export const a = 1;\n", null),
  eslint("controle-camada-ui", "controle", UI, "export const a = 1;\n", null),
  eslint("controle-camada-aplicacao", "controle", APLICACAO, "export const a = 1;\n", null),
  eslint("controle-camada-infraestrutura", "controle", INFRA, "export const a = 1;\n", null),
  eslint("controle-camada-config", "controle", `${SITE}/config/exemplo.ts`, "export const a = 1;\n", null),
  eslint("controle-camada-dominio", "controle", DOMINIO, "export const a = 1;\n", null),
  eslint("permite-app-app", "controle", `${SITE}/app/exemplo/page.tsx`, usa("@/app/outra/x"), null),
  eslint("permite-app-funcionalidades", "controle", `${SITE}/app/exemplo/page.tsx`, usa("@/funcionalidades/inicio/PaginaInicial"), null),
  eslint("permite-app-ui", "controle", `${SITE}/app/exemplo/page.tsx`, usa("@/ui/Botao"), null),
  eslint("permite-app-aplicacao", "controle", `${SITE}/app/exemplo/page.tsx`, usa("@/aplicacao/casa"), null),
  eslint("permite-app-config", "controle", `${SITE}/app/exemplo/page.tsx`, usa("@/config/recursos"), null),
  eslint("nega-app-core", "ADR-001 regra 1", `${SITE}/app/exemplo/page.tsx`, usa("@ee/core"), "no-restricted-imports", "app não importa @ee/core"),
  eslint("permite-funcionalidades-mesma", "controle", CADASTRO, usa("@/funcionalidades/cadastro/rascunho"), null),
  eslint("permite-funcionalidades-ui", "controle", CADASTRO, usa("@/ui/Botao"), null),
  eslint("permite-funcionalidades-aplicacao", "controle", CADASTRO, usa("@/aplicacao/casa"), null),
  eslint("permite-funcionalidades-config", "controle", CADASTRO, usa("@/config/recursos"), null),
  eslint("permite-funcionalidades-core", "controle", CADASTRO, usa("@ee/core"), null),
  eslint("permite-ui-ui", "controle", UI, usa("@/ui/Botao"), null),
  eslint("permite-ui-config", "controle", UI, usa("@/config/recursos"), null),
  eslint("permite-ui-core", "controle", UI, usa("@ee/core"), null),
  eslint("permite-aplicacao-aplicacao", "controle", APLICACAO, usa("@/aplicacao/casa"), null),
  eslint("permite-aplicacao-infraestrutura", "controle", APLICACAO, usa("@/infraestrutura/armazenamento/casa"), null),
  eslint("permite-aplicacao-config", "controle", APLICACAO, usa("@/config/recursos"), null),
  eslint("permite-aplicacao-core", "controle", APLICACAO, usa("@ee/core"), null),
  eslint("permite-infraestrutura-infraestrutura", "controle", INFRA, usa("@/infraestrutura/identificador"), null),
  eslint("permite-infraestrutura-config", "controle", INFRA, usa("@/config/recursos"), null),
  eslint("permite-infraestrutura-core", "controle", INFRA, usa("@ee/core"), null),
  eslint("permite-infraestrutura-zustand", "controle", INFRA, usa("zustand", "create"), null),
  eslint("permite-infraestrutura-node-no-servidor", "controle", `${SITE}/infraestrutura/x.servidor.ts`, `import "server-only";\n${usa("node:fs", "readFileSync")}`, null),
  eslint("permite-servidor-server-only", "controle", `${SITE}/aplicacao/x.servidor.ts`, 'import "server-only";\nexport const a = 1;\n', null),
  eslint("permite-config-config", "controle", `${SITE}/config/exemplo.ts`, usa("@/config/recursos"), null),
  eslint("permite-dominio-relativo", "controle", DOMINIO, usa("./tipos"), null),
  eslint("nega-ui-servidor-node", "ADR-001", `${SITE}/ui/x.servidor.ts`, `import "server-only";\n${usa("node:fs", "readFileSync")}`, "no-restricted-imports", NODE),
  eslint("nega-server-only-fora", "ADR-001", APLICACAO, 'import "server-only";\nexport const a = 1;\n', "no-restricted-imports", 'import "server-only" só em arquivos *.servidor.ts'),
  eslint("nega-config-ui", "ADR-001", `${SITE}/config/exemplo.ts`, usa("@/ui/Botao"), "no-restricted-imports", "config só importa @/config"),
  eslint("nega-config-core", "ADR-001", `${SITE}/config/exemplo.ts`, usa("@ee/core"), "no-restricted-imports", "config não importa @ee/core"),
  eslint("nega-core-caminho-interno", "ADR-001", UI, usa("@ee/core/src/calculos"), "no-restricted-imports", "só o pacote @ee/core inteiro"),
  eslint("nega-infraestrutura-aplicacao", "ADR-001 regra 5", INFRA, usa("@/aplicacao/casa"), "no-restricted-imports", "infraestrutura só importa"),
  eslint("nega-pasta-antiga", "ADR-001", `${SITE}/app/exemplo/page.tsx`, usa("@/components/Botao"), "no-restricted-imports", "app só importa"),
];

export const CASOS = [...ITEM_7_E_R13, ...S1, ...SEGURANCA, ...QUALIDADE, ...ESTRUTURA, ...MATRIZ];

/** Controles que não cabem no formato de caso; cada um é um teste com o mesmo nome em camadas.test.mjs. */
export const CONTROLES = ["controle-repositorio", "controle-arvore-minima", "controle-outra-pasta", "controle-linha-de-comando"];

/** Lista fixa: apagar um caso sem apagar daqui (e o contrário) faz o teste falhar com o id (Ab10, P-qa-b1). */
export const OBRIGATORIOS = [
  "I7-01", "I7-02", "I7-03", "I7-04", "I7-05", "I7-06", "I7-07", "I7-08", "I7-09", "I7-10", "I7-11", "I7-12", "I7-13", "I7-14", "I7-15",
  "R13-01", "R13-02", "R13-03",
  "S1-a", "S1-a-import-sem-espaco", "S1-b", "S1-c", "S1-c-cjs", "S1-c-dominio-cts", "S1-e", "S1-e-sufixo", "S1-f", "S1-f-colchetes", "S1-g", "S1-g-funcao",
  "seguranca-01", "seguranca-02", "seguranca-03", "seguranca-04", "seguranca-05", "seguranca-06", "seguranca-07", "seguranca-08", "seguranca-09", "seguranca-10",
  "seguranca-11", "seguranca-12", "seguranca-13", "seguranca-14", "seguranca-15", "seguranca-16", "seguranca-17", "seguranca-18", "seguranca-19", "seguranca-20",
  "seguranca-21", "controle-seguranca-01", "seguranca-27", "seguranca-28", "seguranca-28b", "seguranca-29", "seguranca-29b", "seguranca-30", "seguranca-30b", "seguranca-30c",
  "C5-any", "C5-ts-ignore", "C5-dangerously", "C5-innerHTML", "C5-eval", "C5-new-function", "C5-script-url", "C5-target-blank", "T1-ordem", "D-sem-uso", "Ab12-parse",
  "C1", "C2", "C3", "C6", "C7",
  "controle-camada-app", "controle-camada-funcionalidades", "controle-camada-ui", "controle-camada-aplicacao", "controle-camada-infraestrutura", "controle-camada-config", "controle-camada-dominio",
  "permite-app-app", "permite-app-funcionalidades", "permite-app-ui", "permite-app-aplicacao", "permite-app-config", "nega-app-core",
  "permite-funcionalidades-mesma", "permite-funcionalidades-ui", "permite-funcionalidades-aplicacao", "permite-funcionalidades-config", "permite-funcionalidades-core",
  "permite-ui-ui", "permite-ui-config", "permite-ui-core",
  "permite-aplicacao-aplicacao", "permite-aplicacao-infraestrutura", "permite-aplicacao-config", "permite-aplicacao-core",
  "permite-infraestrutura-infraestrutura", "permite-infraestrutura-config", "permite-infraestrutura-core", "permite-infraestrutura-zustand", "permite-infraestrutura-node-no-servidor",
  "permite-servidor-server-only", "permite-config-config", "permite-dominio-relativo",
  "nega-ui-servidor-node", "nega-server-only-fora", "nega-config-ui", "nega-config-core", "nega-core-caminho-interno", "nega-infraestrutura-aplicacao", "nega-pasta-antiga",
  "controle-repositorio", "controle-arvore-minima", "controle-outra-pasta", "controle-linha-de-comando",
];
