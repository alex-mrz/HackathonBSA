// app/components/VerifiedAdminPanel.tsx
"use client";
import { useState } from "react";
import { useVerified } from "../features/verified/useVerified";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function VerifiedAdminPanel() {
  const { addAddress, clearAll } = useVerified();
  const [addr, setAddr] = useState("");

  return (
    <div className="flex gap-2 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">Adresse à autoriser</label>
        <Input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="0x..."
        />
      </div>
      <Button onClick={() => addAddress(addr)}>Ajouter</Button>
      <Button variant="destructive" onClick={clearAll}>
        Tout supprimer
      </Button>
    </div>
  );
}
