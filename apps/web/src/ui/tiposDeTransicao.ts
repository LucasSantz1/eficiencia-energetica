// Sem "use client" de propósito (HIS-002b, critério 8): um componente de servidor que importa um valor de um módulo
// "use client" recebe só uma referência de cliente, não o valor. Daqui, as constantes chegam inteiras às rotas.

/** Tipos de transição entre telas (usados em <Link transitionTypes> e router.push). */
export const IR_ADIANTE = ["nav-forward"];
export const VOLTAR = ["nav-back"];
export const ENTRAR_NO_PAINEL = ["entrar-painel"];
