"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVerified } from "../features/verified/useVerified";
import { usePasswordDB } from "../features/password/usePasswordDB";
import { useAuth } from "../features/auth/useAuth";

async function sha256Bytes(s: string): Promise<Uint8Array> {
  const enc = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return new Uint8Array(digest);
}

export default function AuthDemo() {
  const [addr, setAddr] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState<"" | "addhash" | "auth">("");
  const { ensureVerifiedId } = useVerified();
  const { ensurePasswordDbId, addHash } = usePasswordDB();
  const { authenticateAndRegister } = useAuth();

  const onAddHash = async () => {
    setBusy("addhash");
    try {
      const hash = await sha256Bytes(pwd);
      const { passwordDbId } = await addHash(hash); // appelle password_db::add_password_hash (emitter = wallet courant)
      console.log("Hash ajouté dans DB:", passwordDbId);
      alert("Hash ajouté.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy("");
    }
  };

  const onAuthenticate = async () => {
    setBusy("auth");
    try {
      const [dbId, verId, hash] = await Promise.all([
        ensurePasswordDbId(),
        ensureVerifiedId(),
        sha256Bytes(pwd),
      ]);
      await authenticateAndRegister(dbId, verId, addr, hash);
      alert("Adresse authentifiée et ajoutée aux vérifiés.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">Adresse citoyen</label>
        <Input
          placeholder="0x..."
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">
          Mot de passe (sera hashé en SHA-256 côté client)
        </label>
        <Input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onAddHash} disabled={busy !== ""}>
          {busy === "addhash"
            ? "Ajout..."
            : "Ajouter le hash dans la DB (émetteur)"}
        </Button>
        <Button
          onClick={onAuthenticate}
          disabled={busy !== ""}
          variant="secondary"
        >
          {busy === "auth" ? "Vérif..." : "Authentifier + Ajouter à vérifiés"}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        ⚠️ Pour la démo, <b>le même wallet</b> joue l’émetteur (peut ajouter des
        hashes)
        <br />
        et l’admin du registre (peut ajouter des adresses). C’est ce qu’exige
        ton code Move actuel.
      </p>
    </div>
  );
}
