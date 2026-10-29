import type { NextConfig } from "next";

const config: NextConfig = {
  // O pacote @ee/core é TypeScript puro dentro do monorepo; o Next compila junto.
  transpilePackages: ["@ee/core"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Os dados da ANEEL mudam no máximo uma vez por dia.
        source: "/dados/:caminho*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default config;
