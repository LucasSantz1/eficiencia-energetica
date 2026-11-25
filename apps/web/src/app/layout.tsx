import type { Metadata, Viewport } from "next";
import { SCRIPT_DA_PRIMEIRA_PINTURA } from "@/aplicacao/leitura";
import { LigarOffline } from "@/funcionalidades/offline/LigarOffline";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Eficiência Energética — quanto cada aparelho custa na sua conta de luz",
    template: "%s · Eficiência Energética",
  },
  description:
    "Descubra quanto cada aparelho da sua casa gasta por mês, com a tarifa da sua cidade e a bandeira do mês, e veja dicas para pagar menos na conta de luz. Grátis e sem cadastro.",
  applicationName: "Eficiência Energética",
  appleWebApp: { capable: true, title: "Eficiência Energética", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a7356",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-scroll-behavior: o Next tira a rolagem suave ao trocar de página (essa troca já tem a transição própria) e
    // deixa a rolagem suave só para os links de seção dentro da mesma página.
    // suppressHydrationWarning: o script abaixo pode marcar o <html> (data-letra, data-contraste) antes do React.
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Letra maior e mais contraste já na primeira pintura, sem piscar (HIS-102). Texto filho, sem
            dangerouslySetInnerHTML; a CSP da HIS-003a permite script inline. */}
        <script>{SCRIPT_DA_PRIMEIRA_PINTURA}</script>
      </head>
      <body className="min-h-dvh">
        {children}
        <LigarOffline />
      </body>
    </html>
  );
}
