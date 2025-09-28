"use client";

import { useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNetworkVariable } from "../networkConfig";

type TxDetails = {
  digest: string;
  status: string;
  gasUsed?: string;
  objectChanges?: any[];
  events?: any[];
};

function explorerUrl(network: string, digest: string) {
  // ajuste selon tes réseaux actifs
  const net = network.includes("mainnet")
    ? "mainnet"
    : network.includes("testnet")
      ? "testnet"
      : "devnet";
  return `https://explorer.sui.io/txblock/${digest}?network=${net}`;
}

export default function TxInspector() {
  const client = useSuiClient();
  const votePackageId = useNetworkVariable("votePackageId"); // juste pour afficher le réseau
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<TxDetails | null>(null);
  const [error, setError] = useState<string>("");

  const onInspect = async () => {
    setLoading(true);
    setError("");
    setDetails(null);
    try {
      const txb = await client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showInput: false,
        },
      });

      const status =
        txb.effects?.status.status ??
        (txb.effects?.status.error ? "failure" : "unknown");

      const gasUsed = txb.effects?.gasUsed
        ? Object.entries(txb.effects.gasUsed)
            .map(([k, v]) => `${k}:${String(v)}`)
            .join(", ")
        : undefined;

      setDetails({
        digest,
        status,
        gasUsed,
        objectChanges: txb.objectChanges ?? [],
        events: txb.events ?? [],
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm text-slate-600 block mb-1">Digest</label>
          <Input
            placeholder="Ex: A5Yw...9h1"
            value={digest}
            onChange={(e) => setDigest(e.target.value.trim())}
          />
        </div>
        <Button onClick={onInspect} disabled={!digest || loading}>
          {loading ? "Lecture..." : "Inspecter"}
        </Button>
      </div>

      {error && <div className="text-red-600 text-sm">Erreur: {error}</div>}

      {details && (
        <div className="rounded-lg border p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-slate-600">
                Réseau (pkg): <span className="font-mono">{votePackageId}</span>
              </div>
              <div>
                <span className="text-sm text-slate-600">Digest: </span>
                <span className="font-mono text-sm">{details.digest}</span>
              </div>
              <div className="text-sm">
                Statut:{" "}
                <span
                  className={
                    details.status === "success"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }
                >
                  {details.status}
                </span>
              </div>
              {details.gasUsed && (
                <div className="text-xs text-slate-500">
                  Gas used: {details.gasUsed}
                </div>
              )}
            </div>
            <a
              className="text-blue-600 underline text-sm"
              href={explorerUrl(votePackageId, details.digest)}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir dans Sui Explorer ↗
            </a>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Object Changes</h3>
            <pre className="text-xs whitespace-pre-wrap break-all bg-slate-50 p-2 rounded">
              {JSON.stringify(details.objectChanges, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Events</h3>
            <pre className="text-xs whitespace-pre-wrap break-all bg-slate-50 p-2 rounded">
              {JSON.stringify(details.events, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
