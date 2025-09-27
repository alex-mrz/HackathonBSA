import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";

import Link from "next/link";

export const metadata = {
  title: "VoteSecure",
  description: "Plateforme de vote numérique sécurisée (démo)",
};

// frontend/app/layout.tsx
import "./globals.css";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
        {/* Top bar */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/60 border-b border-slate-200/70">
          <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm">✓</span>
              <span>VoteSecure</span>
              <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">v2.0 Sécurisé</span>
            </Link>

            <div className="hidden sm:flex items-center gap-6 text-sm">
              <Link href="/" className="hover:text-blue-700">Accueil</Link>
              <Link href="/candidats" className="hover:text-blue-700">Votes</Link>
              <a href="#securite" className="hover:text-blue-700">Sécurité</a>
              <a href="#features" className="hover:text-blue-700">Fonctionnalités</a>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn-secondary">Se connecter</button>
              <button className="btn-primary">S’inscrire</button>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        {/* Footer */}
        <footer className="mt-24 border-t border-slate-200/70 bg-slate-900 text-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 font-semibold">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white text-sm">✓</span>
                <span>VoteSecure</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Participez à la démocratie numérique avec notre plateforme de vote sécurisée. Votre voix compte — nous la protégeons.
              </p>
              <div className="mt-4 space-y-1 text-sm">
                <div>📧 contact@votesecure.fr</div>
                <div>📞 +33 1 23 45 67 89</div>
                <div>📍 Paris, France</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Plateforme</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/candidats" className="hover:underline">Comment voter</Link></li>
                <li><Link href="/candidats" className="hover:underline">Créer un vote</Link></li>
                <li><a href="#resultats" className="hover:underline">Résultats</a></li>
                <li><a href="#features" className="hover:underline">Aide</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Sécurité</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>ISO 27001</li>
                <li>RGPD</li>
                <li>SOC 2</li>
                <li>SSL/TLS</li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}