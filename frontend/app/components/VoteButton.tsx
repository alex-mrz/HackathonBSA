"use client";

import { useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useCroupier } from "@/features/croupier/useCroupier";
import { useScrutateur } from "@/features/scrutateur/useScrutateur";

interface VoteButtonProps {
  voteValue: number;
  label: string;
  variant: "pour" | "contre";
}

type VoteApiResponse = {
  token: {
    person_id: string;
    token: string;
  };
  doubleSeal: {
    recordId?: string;
    innerIdBase64: string;
    outerIdBase64: string;
  };
};

const textEncoder = new TextEncoder();

export function VoteButton({ voteValue, label, variant }: VoteButtonProps) {
  const btnBase =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses =
    variant === "pour"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400"
      : "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-400";

  const account = useCurrentAccount();
  const client = useSuiClient();
  const { submitToken, shuffleTokens, forwardAll } = useCroupier();
  const { ensureStoreId: ensureScrutateurStoreId, receiveBlob, markProcessed } =
    useScrutateur();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifiedId = process.env.NEXT_PUBLIC_VERIFIED_ADDRS_ID;

  const handleClick = async () => {
    if (!account?.address) {
      setError("Connectez votre wallet avant de voter.");
      return;
    }
    if (!verifiedId) {
      setError("Configuration manquante: NEXT_PUBLIC_VERIFIED_ADDRS_ID");
      return;
    }

    const identifier = window.prompt("Identifiant électeur (digits uniquement) ?");
    if (!identifier) return;
    if (!/^\d+$/.test(identifier.trim())) {
      setError("L'identifiant doit contenir uniquement des chiffres.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus("Génération du token...");

    try {
      const voteRes = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voteValue,
          personId: identifier.trim(),
          walletAddress: account.address,
        }),
      });
      const payloadJson = (await voteRes.json().catch(() => null)) as
        | VoteApiResponse
        | (Record<string, any> & { error?: string })
        | null;
      if (!voteRes.ok || !payloadJson) {
        throw new Error(payloadJson?.error || "Échec de l'orchestration back-end");
      }

      const payload = payloadJson as VoteApiResponse;
      const { doubleSeal } = payload;
      if (!doubleSeal.recordId) {
        throw new Error("Impossible de récupérer l'identifiant de l'enveloppe chiffrée");
      }

      setStatus("Soumission au Croupier...");
      const tokenBytes = textEncoder.encode(payload.token.token);
      const submitResult = await submitToken(verifiedId, tokenBytes);

      // Récupère la taille actuelle pour dériver une permutation simple.
      let permutation: number[] = [];
      try {
        const storeId = submitResult.storeId;
        const storeObject = await client.getObject({
          id: storeId,
          options: { showContent: true },
        });
        const tokensField = (storeObject.data?.content as any)?.fields?.tokens;
        const length = Array.isArray(tokensField) ? tokensField.length : 0;
        permutation = Array.from({ length }, (_, i) => i);
        if (permutation.length > 1) {
          for (let i = permutation.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
          }
        }
        if (permutation.length > 0) {
          setStatus("Permutation des tokens...");
          await shuffleTokens(permutation);
        }
      } catch (permErr) {
        console.warn("Impossible de permuter les tokens", permErr);
      }

      setStatus("Peeling côté serveur...");
      const peelRes = await fetch("/api/bridge/peel-outer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: doubleSeal.recordId,
          outerIdBase64: doubleSeal.outerIdBase64,
        }),
      });
      const peelPayload = (await peelRes.json().catch(() => null)) as
        | { innerCiphertextBase64: string; error?: string }
        | null;
      if (!peelRes.ok || !peelPayload) {
        throw new Error(peelPayload?.error || "Échec du peel outer");
      }
      const { innerCiphertextBase64 } = peelPayload;

      setStatus("Forward vers le scrutateur...");
      await forwardAll(account.address);

      setStatus("Préparation du scrutateur...");
      await ensureScrutateurStoreId();

      setStatus("Déchiffrement final...");
      const decryptRes = await fetch("/api/bridge/decrypt-inner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: doubleSeal.recordId,
          innerIdBase64: doubleSeal.innerIdBase64,
          innerCiphertextBase64,
        }),
      });
      const decryptPayload = (await decryptRes.json().catch(() => null)) as
        | { plaintextUtf8: string; error?: string }
        | null;
      if (!decryptRes.ok || !decryptPayload) {
        throw new Error(decryptPayload?.error || "Échec du déchiffrement inner");
      }
      const { plaintextUtf8 } = decryptPayload;

      setStatus("Enregistrement côté scrutateur...");
      const plainBytes = textEncoder.encode(plaintextUtf8);
      const receiveRes = await receiveBlob(plainBytes);
      const scrutateurObj = await client.getObject({
        id: receiveRes.storeId,
        options: { showContent: true },
      });
      const processedField = (scrutateurObj.data?.content as any)?.fields?.processed;
      if (Array.isArray(processedField) && processedField.length > 0) {
        setStatus("Validation du traitement...");
        await markProcessed(processedField.length - 1);
      }

      setStatus("Vote traité avec succès.");
    } catch (err) {
      console.error("Vote pipeline error", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={`${btnBase} ${variantClasses}`}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? "Traitement..." : label}
      </button>
      {status && !error && (
        <span className="text-xs text-slate-600">{status}</span>
      )}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
