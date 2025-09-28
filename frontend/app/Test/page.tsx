// app/test/page.tsx
import VerifiedAdminPanel from "../components/VerifiedAdminPanel";
import AuthDemo from "../components/AuthDemo";
import CroupierPanel from "../components/CroupierPanel";
import TxInspector from "../components/TxInspector";
import { useNetworkVariable } from "../networkConfig";

export const metadata = { title: "Test Playground" };

export default function TestPage() {
  return (
    <main className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Test Playground</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">
          1) Registre d’adresses vérifiées
        </h2>
        <VerifiedAdminPanel />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">
          2) Authentification (hash + inscription)
        </h2>
        <AuthDemo />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">
          3) Croupier (soumettre / forward)
        </h2>
        <CroupierPanel />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">4) Inspecteur de transaction</h2>
        <TxInspector />
      </section>
    </main>
  );
}
function PackageGuard() {
  const pkg = useNetworkVariable("votePackageId");
  if (!pkg?.startsWith("0x")) {
    return (
      <div className="text-red-600 text-sm">
        ⚠️ <b>votePackageId non configuré</b>. Renseigne un package id valide
        dans <code>app/networkConfig.ts</code>.
      </div>
    );
  }
  return null;
}
