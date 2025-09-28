// frontend/app/securite/page.tsx
import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";

export default function SecuritePage() {
  return (
    <main className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 text-center">
          Vote en Toute Sécurité
        </h1>
        <ConnectButton>oeoeos</ConnectButton>
        <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-12">
          Notre plateforme de vote numérique garantit un haut niveau de
          sécurité grâce à la blockchain. Chaque voix est protégée par un
          cryptage avancé et chaque citoyen peut vérifier que son vote a bien
          été pris en compte.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              🔒 Sécurité et Intégrité
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Une fois enregistré, aucun vote ne peut être modifié ou supprimé.
              La technologie blockchain garantit l’intégrité du registre
              électoral.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              👤 Anonymat garanti
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Les identités et les bulletins de vote sont dissociés et chiffrés
              pour assurer la confidentialité absolue des électeurs.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              📊 Transparence
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Les preuves de chaque vote sont publiques et vérifiables,
              garantissant un processus clair et ouvert.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              ✅ Vérifiabilité
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Chaque citoyen peut contrôler directement que son vote a bien été
              comptabilisé dans le registre blockchain.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 flex justify-center space-x-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold shadow hover:opacity-90 transition"
          >
            ← Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}