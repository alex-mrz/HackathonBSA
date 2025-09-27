import Link from "next/link";
export default function OuiPage() {
  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-6">
          Détails du OUI — Budget Recherche
        </h1>
        <p className="text-lg text-slate-700">
          Ici, détail en profondeur de ce que propose le camp du OUI :
          explications, chiffres, exemples, etc.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/candidats"
            className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
          >
            ← Retour aux propositions
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-md shadow hover:bg-gray-700 transition"
          >
            🏠 Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
