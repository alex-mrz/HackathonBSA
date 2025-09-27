"use client";
// frontend/app/page.tsx
import React, { useEffect, useState } from "react";
import App from "./App";
import Link from "next/link";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium bg-white/80 text-slate-700 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
      {children}
    </span>
  );
}

function StatCard({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow">{icon}</div>
      <div className="mt-4 text-2xl font-semibold">{value}</div>
      <div className="text-slate-500 text-sm">{title}</div>
    </div>
  );
}

function Feature({ emoji, title, points }: { emoji: string; title: string; points: string[] }) {
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow text-lg">{emoji}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <Link href="/candidats" className="mt-4 inline-flex items-center gap-2 text-blue-700 hover:underline text-sm">
        En savoir plus <span>→</span>
      </Link>
    </div>
  );
}

/**
 * NEW:
 * - showVotesOnly : si true affiche la "page" complète des votes en cours
 * - openVotes / closeVotes pour basculer
 * - le bouton "Commencer à voter" déclenche openVotes
 */
export default function Home() {
  const [showVotesOnly, setShowVotesOnly] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#resultats") {
      setShowVotesOnly(true);
    }
  }, []);

  const openVotes = () => {
    if (typeof window !== "undefined") {
      window.location.hash = "#resultats";
    }
    setShowVotesOnly(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeVotes = () => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    setShowVotesOnly(false);
  };

  const votesDemo = [
    {
      id: "v1",
      tag: "Environnement",
      title: "Projet Écologique Municipal",
      summary: "Installation de panneaux solaires sur les bâtiments publics.",
      pct: 31.6,
    },
    {
      id: "v2",
      tag: "Transport",
      title: "Rénovation des Transports",
      summary: "Modernisation du réseau et bus électriques.",
      pct: 22.6,
    },
    {
      id: "v3",
      tag: "Recherche",
      title: "Augmentation du budget Recherche",
      summary: "Augmenter les financements pour les universités et laboratoires.",
      pct: 44.0,
    },
  ];

  if (showVotesOnly) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Votes en cours</h1>
          <button onClick={closeVotes} className="btn-outline">← Retour</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {votesDemo.map((v) => (
            <article key={v.id} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="text-xs inline-flex px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{v.tag}</div>
                <div className="text-sm text-slate-500">{Math.round(Math.random() * 5000)} votes</div>
              </div>

              <h2 className="font-semibold text-xl mt-4">{v.title}</h2>
              <p className="mt-2 text-slate-600">{v.summary}</p>

              <div className="mt-4">
                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${v.pct}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500">{v.pct}% du total</div>
              </div>

              <div className="mt-4 flex gap-3">
                <Link href={`/votes/${v.id}`} className="btn-primary inline-block">Voter pour ce projet</Link>
                <Link href={`/votes/${v.id}/details`} className="btn-outline inline-block">En savoir plus</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* HERO */}
      <section className="py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>🔒 Cryptage AES-256</Badge>
            <Badge>🔍 Transparence Totale</Badge>
            <Badge>✅ Certifié ISO 27001</Badge>
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Votez en toute sécurité</h1>
          <p className="mt-4 text-lg text-slate-600">
            Participez à la démocratie numérique avec notre plateforme de vote sécurisée. Chaque vote compte et est protégé par un chiffrement de niveau militaire.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={openVotes} className="btn-primary">⚡ Commencer à voter</button>
            <Link href="/securite" className="btn-outline">◦ En savoir plus</Link>
          </div>

          <div className="mt-6 text-sm text-slate-500">⭐️⭐️⭐️⭐️⭐️ — Noté 4,9/5 par 5+ utilisateurs</div>
        </div>

        <div className="relative">
          <div className="glass p-3 rounded-2xl">
            <img
              src="data:image/jpeg;base64,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"
              alt="Votations et élections à Veyrier"
              className="rounded-xl object-cover w-full h-64 md:h-80"
            />
          </div>

          <div className="absolute -top-4 -right-4 bg-white rounded-full px-3 py-1 text-sm shadow">🟢 Vote en cours</div>
          <div className="absolute -bottom-4 left-4 glass px-3 py-1 rounded-full text-sm">🔐 100% sécurisé</div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon="👥" title="Citoyens inscrits" value="2.5M+" />
        <StatCard icon="🗳️" title="Votes organisés" value="15 000+" />
        <StatCard icon="🛡️" title="Sécurité garantie" value="99.9%" />
        <StatCard icon="🌍" title="Pays utilisateurs" value="45" />
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 grid md:grid-cols-3 gap-6">
        <Feature emoji="📱" title="Vote Mobile" points={["Interface intuitive", "Compatible iOS/Android", "Mode hors-ligne"]} />
        <Feature emoji="📊" title="Résultats en Temps Réel" points={["Graphiques animés", "Données vérifiées", "Export possible"]} />
        <Feature emoji="🧩" title="Vote Collectif" points={["Groupes & délégations", "Modération avancée", "Audit trail"]} />
      </section>

      {/* SÉCURITÉ */}
      <section id="securite" className="py-16">
        <h2 className="text-center text-2xl font-semibold">Sécurité maximale</h2>
        <p className="mt-2 text-center text-slate-600">Nous appliquons les meilleurs standards pour protéger l’intégrité de chaque vote.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["ISO 27001", "RGPD", "SOC 2", "SSL/TLS"].map((label) => (
            <div key={label} className="glass rounded-xl px-4 py-3 text-center text-sm">✅ {label}</div>
          ))}
        </div>
      </section>

      {/* VOTES EN COURS (démo statique) */}
      <section id="resultats" className="py-10">
        <h2 className="text-xl font-semibold mb-4">Votes en cours</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <div className="text-xs inline-flex px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 mb-3">Environnement</div>
            <h3 className="font-semibold text-lg">Projet Écologique Municipal</h3>
            <p className="mt-2 text-sm text-slate-600">Installation de panneaux solaires sur les bâtiments publics.</p>
            <div className="mt-4">
              <div className="h-2 bg-slate-200 rounded-full">
                <div className="h-2 bg-emerald-500 rounded-full" style={{ width: "32%" }} />
              </div>
              <div className="mt-2 text-xs text-slate-500">31.6% du total</div>
            </div>
            <Link href="/candidats" className="mt-4 inline-block btn-secondary">Voter pour ce projet</Link>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-xs inline-flex px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 mb-3">Transport</div>
            <h3 className="font-semibold text-lg">Rénovation des Transports</h3>
            <p className="mt-2 text-sm text-slate-600">Modernisation du réseau et bus électriques.</p>
            <div className="mt-4">
              <div className="h-2 bg-slate-200 rounded-full">
                <div className="h-2 bg-indigo-500 rounded-full" style={{ width: "22%" }} />
              </div>
              <div className="mt-2 text-xs text-slate-500">22.6% du total</div>
            </div>
            <Link href="/candidats" className="mt-4 inline-block btn-secondary">Voter pour ce projet</Link>
          </div>
        </div>
      </section>
    </div>
  );
}