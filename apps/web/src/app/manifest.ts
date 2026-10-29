import type { MetadataRoute } from "next";

/** Permite instalar o site no celular como se fosse um aplicativo. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eficiência Energética",
    short_name: "Conta de luz",
    description: "Descubra quanto cada aparelho custa na sua conta de luz e como pagar menos.",
    lang: "pt-BR",
    start_url: "/casa",
    display: "standalone",
    background_color: "#eef3f0",
    theme_color: "#0a7356",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
