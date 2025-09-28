"""Simple vote token generator.

Token layout: `<vote><hash(person_id||random_suffix)>`.
We first hash the identifier concatenated with a random suffix, then we prepend
the two-digit vote value. This hides the identifier while keeping a
deterministic check value for off-chain workflows.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
from dataclasses import dataclass
from pathlib import Path
from secrets import token_hex


@dataclass(frozen=True)
class Person:
    identifier: str
    name: str


def _hash_identifier_with_nonce(identifier: str, nonce: str) -> str:
    """Return the BLAKE2b-256 hash (hex) of `<identifier>-<nonce>`."""
    payload = f"{identifier}-{nonce}".encode("utf-8")
    return hashlib.blake2b(payload, digest_size=32).hexdigest()


def create_vote_token(
    vote_value: int,
    person: Person,
    *,
    random_bytes: int = 6,
) -> tuple[str, str, str]:
    """Return (token, payload_hash, nonce) for the provided vote and person.

    - The token is `<vote><payload_hash>` where `payload_hash` = hash(identifier||nonce).
    - `payload_hash` is returned separately for convenience.
    - `nonce` is the random suffix (hex) used in the hash computation.
    """
    if not 0 <= vote_value <= 99:
        raise ValueError("vote_value must be between 0 and 99")
    if not person.identifier.isdigit():
        raise ValueError("person identifier must contain digits only")
    if random_bytes <= 0:
        raise ValueError("random_bytes must be a positive integer")
    random_suffix = token_hex(random_bytes)
    payload_hash = _hash_identifier_with_nonce(person.identifier, random_suffix)
    vote_prefix = f"{vote_value:02d}"
    token = f"{vote_prefix}{payload_hash}"
    return token, payload_hash, random_suffix


def _demo() -> None:
    output_records: list[dict[str, str | int]] = []

    persons = {
        "846392134567": Person(identifier="846392134567", name="Alice Durand"),
        "932145678903": Person(identifier="932145678903", name="Bilal Moreau"),
        "785430129876": Person(identifier="785430129876", name="Chloe Martin"),
    }

    # Votes keyed by person identifier, value is the two-digit vote code to embed.
    votes = {
        "846392134567": 1,  # Alice votes "1" (e.g. yes)
        "932145678903": 2,  # Bilal votes "2" (e.g. abstain)
        "785430129876": 0,  # Chloe votes "0" (e.g. no)
    }

    tokens_per_person = 3

    for identifier, vote_value in votes.items():
        person = persons[identifier]
        print(f"{person.name}:")
        for _ in range(tokens_per_person):
            token, payload_hash, nonce = create_vote_token(vote_value, person)
            print(
                f"  token={token}\n"
                f"    payload_hash={payload_hash}\n"
                f"    nonce={nonce}"
            )
            output_records.append(
                {
                    "person_id": person.identifier,
                    "person_name": person.name,
                    "vote": vote_value,
                    "token": token,
                    "payload_hash": payload_hash,
                    "nonce": nonce,
                    "source": "declared_vote",
                }
            )

    print("\nTest aléatoire (2 tokens par personne):")
    for person in persons.values():
        print(f"{person.name}:")
        for _ in range(2):
            vote = random.randint(0, 99)
            token, payload_hash, nonce = create_vote_token(vote, person)
            print(
                f"  vote {vote:02d} -> token={token}"
                f" | payload_hash={payload_hash}"
                f" | nonce={nonce}"
            )
            output_records.append(
                {
                    "person_id": person.identifier,
                    "person_name": person.name,
                    "vote": vote,
                    "token": token,
                    "payload_hash": payload_hash,
                    "nonce": nonce,
                    "source": "random_test",
                }
            )

    output_path = Path(__file__).with_name("tokens.json")
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump({"tokens": output_records}, fh, ensure_ascii=False, indent=2)
    print(f"\nTokens enregistrés dans {output_path.resolve()}")

def _run_cli() -> None:
    parser = argparse.ArgumentParser(description="Vote token generator")
    parser.add_argument("--identifier", help="Identifiant de la personne (digits only)")
    parser.add_argument("--name", help="Nom complet optionnel de la personne")
    parser.add_argument("--vote", type=int, help="Valeur du vote entre 0 et 99")
    parser.add_argument(
        "--random-bytes",
        type=int,
        default=6,
        help="Nombre d'octets aléatoires utilisés pour le nonce (défaut: 6)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Retourne le résultat en JSON sur stdout",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Lance le scénario de démonstration intégré",
    )

    args = parser.parse_args()

    # Mode démo explicite ou absence de paramètres obligatoires -> démo.
    if args.demo or not (args.identifier and args.vote is not None):
        _demo()
        return

    person = Person(identifier=args.identifier, name=args.name or "")
    token, payload_hash, nonce = create_vote_token(
        args.vote,
        person,
        random_bytes=args.random_bytes,
    )

    output = {
        "person_id": person.identifier,
        "person_name": person.name,
        "vote": args.vote,
        "token": token,
        "payload_hash": payload_hash,
        "nonce": nonce,
    }

    if args.json:
        print(json.dumps(output, ensure_ascii=False))
    else:
        print(
            f"Token généré pour {person.identifier}:\n"
            f"  vote={args.vote:02d}\n"
            f"  token={token}\n"
            f"  payload_hash={payload_hash}\n"
            f"  nonce={nonce}"
        )


if __name__ == "__main__":
    _run_cli()
