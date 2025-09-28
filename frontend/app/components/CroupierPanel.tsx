"use client";
import { useState } from "react";
import { useVerified } from "../features/verified/useVerified"; // réutilise le hook verified qu’on a fait
import { useCroupier } from "../features/croupier/useCroupier";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea"; // si tu n’as pas ce composant, remplace par <textarea>

function parseBytes(s: string): Uint8Array {
  const str = s.trim();
  if (!str) return new Uint8Array();
  // auto: base64 si contient = ou /+, sinon hex si 0x... ou [0-9a-f]
  const isProbablyBase64 = /[A-Za-z0-9+/=]/.test(str) && !/^0x/i.test(str);
  if (isProbablyBase64) {
    const bin = atob(str.replace(/\s+/g, ""));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } else {
    const hex = str.replace(/^0x/i, "").replace(/\s+/g, "");
    if (hex.length % 2 !== 0) throw new Error("Hex invalide");
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++)
      out[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
    return out;
  }
}

export default function CroupierPanel() {
  const { ensureVerifiedId } = useVerified();
  const { submitToken, forwardAll } = useCroupier();
  const [cipher, setCipher] = useState("");
  const [scrutAddr, setScrutAddr] = useState("");
  const [busy, setBusy] = useState<"" | "submit" | "forward">("");

  const onSubmit = async () => {
    setBusy("submit");
    try {
      const [verifiedId, bytes] = await Promise.all([
        ensureVerifiedId(),
        Promise.resolve(parseBytes(cipher)),
      ]);
      const { digest } = await submitToken(verifiedId, bytes);
      alert("Token soumis ✅\nDigest: " + digest);
      setCipher("");
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (/abort code: 1/.test(msg)) alert("❌ Adresse non vérifiée.");
      else if (/abort code: 2/.test(msg))
        alert("❌ Vote déjà soumis (double vote).");
      else alert(msg);
    } finally {
      setBusy("");
    }
  };

  const onForward = async () => {
    setBusy("forward");
    try {
      const { digest } = await forwardAll(scrutAddr);
      alert("Forward demandé ✅\nDigest: " + digest);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (/abort code: 3/.test(msg))
        alert("❌ Seul l’admin du Croupier peut forward.");
      else alert(msg);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">
          Jeton chiffré (hex ou base64)
        </label>
        {/* remplace Textarea par un <textarea className="border rounded p-2 min-h-24" ...> si besoin */}
        <Textarea
          value={cipher}
          onChange={(e) => setCipher(e.target.value)}
          placeholder="0x..."
        />
      </div>
      <Button onClick={onSubmit} disabled={busy !== ""}>
        {busy === "submit" ? "Envoi..." : "Soumettre au Croupier"}
      </Button>
      <div className="mt-4 flex items-end gap-2">
        <div className="flex flex-col gap-1 grow">
          <label className="text-sm text-slate-600">
            Adresse du Scrutateur (optionnel pour forward)
          </label>
          <Input
            value={scrutAddr}
            onChange={(e) => setScrutAddr(e.target.value)}
            placeholder="0xSCRUT..."
          />
        </div>
        <Button
          variant="secondary"
          onClick={onForward}
          disabled={busy !== "" || !scrutAddr}
        >
          {busy === "forward" ? "Forward..." : "Forward → Scrutateur"}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        ℹ️ Le croupier vérifie on-chain que l’adresse est vérifiée (via{" "}
        <code>VerifiedAddrs</code>) et que l’unicité est respectée. Les
        decrypt/shuffle se font off-chain (comme prévu).
      </p>
    </div>
  );
}
