import type { Aparelho } from "@ee/core";

/** Aparelho em edição (no cadastro ainda não tem id definitivo). */
export type ItemComodo = Omit<Aparelho, "id" | "comodoId"> & { id: string };
