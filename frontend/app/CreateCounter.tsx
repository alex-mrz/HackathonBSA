import Link from "next/link";

export default function CreateCounter({ onCreated, }: { onCreated: (id: string) => void; }) {
  return (
    <main>
      {/* Other content */}
      <Link href="/candidats">
        Je regarde les propositions de vote
      </Link>
      {/* Other content */}
    </main>
  );
}
