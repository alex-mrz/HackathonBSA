import Link from "next/link";

export default function CandidatsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Propositions de vote</h1>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Exemple pédagogique : débat autour de l’<span className="font-medium">augmentation du budget de la recherche</span>.
            Ci-dessous, deux encadrés présentent un résumé des positions POUR et CONTRE, avec des arguments clés.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* POUR */}
          <article className="rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-sm hover:shadow-md transition p-6">
            <h2 className="text-2xl font-bold text-emerald-900">POUR — Augmenter le budget de la recherche</h2>
            <p className="mt-4 leading-relaxed text-emerald-900/90">
              Renforcer l’investissement public dans la recherche permet d’accélérer l’innovation, de soutenir les
              universités et les laboratoires, et de créer un écosystème favorable aux découvertes à fort impact.
              À moyen terme, ces efforts se traduisent par des gains de productivité, des emplois qualifiés et des
              solutions concrètes face aux grands défis (santé, climat, technologies sûres). Un financement stable
              sécurise les carrières scientifiques, améliore l’attractivité internationale et multiplie les
              collaborations avec le secteur privé. Les retombées se diffusent dans tout le tissu économique via des
              startups, des transferts de technologies et des brevets. Investir aujourd’hui, c’est aussi réduire la
              dépendance à l’importation d’innovations étrangères et garder la maîtrise de nos infrastructures
              critiques. Enfin, un effort budgétaire clair donne de la visibilité aux jeunes chercheurs et encourage
              des vocations indispensables pour l’avenir.
            </p>
            <ul className="mt-5 space-y-2 text-emerald-900/90 list-disc list-inside">
              <li>Accélère l’innovation et la compétitivité internationale.</li>
              <li>Soutient l’emploi qualifié et l’attractivité des talents.</li>
              <li>Renforce les réponses aux défis climatiques et sanitaires.</li>
              <li>Favorise les partenariats publics‑privés et les startups.</li>
              <li>Réduit la dépendance technologique vis‑à‑vis de l’étranger.</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/candidats/recherche/oui"
                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                Je voudrais en savoir plus
              </Link>
            </div>
          </article>

          {/* CONTRE */}
          <article className="rounded-xl border border-rose-200 bg-rose-50/70 shadow-sm hover:shadow-md transition p-6">
            <h2 className="text-2xl font-bold text-rose-900">CONTRE — Ne pas augmenter le budget de la recherche</h2>
            <p className="mt-4 leading-relaxed text-rose-900/90">
              Augmenter les dépenses publiques n’est pas toujours la meilleure réponse : avant d’investir davantage,
              il faut s’assurer de l’efficacité de l’argent déjà engagé, évaluer les doublons et simplifier les
              procédures. Une hausse trop rapide peut créer des effets d’aubaine, disperser les priorités et gonfler la
              bureaucratie. Les ressources pourraient être mieux ciblées sur le transfert concret des résultats vers
              l’industrie et la société. Par ailleurs, il existe d’autres urgences budgétaires (énergie, logement,
              formation) qui réclament aussi des moyens. Maintenir le budget actuel incite à optimiser les programmes,
              renforcer l’évaluation indépendante et orienter les financements vers les projets à fort impact mesurable.
            </p>
            <ul className="mt-5 space-y-2 text-rose-900/90 list-disc list-inside">
              <li>Priorité à l’efficacité des fonds déjà alloués.</li>
              <li>Risque de bureaucratie et de dispersion des priorités.</li>
              <li>Arbitrages nécessaires avec d’autres urgences publiques.</li>
              <li>Mieux cibler le transfert vers l’industrie et la société.</li>
              <li>Renforcer l’évaluation indépendante avant d’augmenter.</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/candidats/recherche/non"
                className="inline-flex items-center rounded-md bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                Je voudrais en savoir plus
              </Link>
            </div>
          </article>
        </section>

        <footer className="mt-10 text-center">
          <Link href="/" className="text-slate-600 hover:text-slate-900 underline">
            ← Retour à l’accueil
          </Link>
        </footer>
      </div>
    </main>
  );
}