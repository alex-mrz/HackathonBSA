// sources/cipher_box.move
module vote_pkg::cipher_box {
    use sui::object::{Self as object, UID};
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::transfer;
    use std::vector;

    /// On-chain envelope that holds encrypted data + routing info.
    /// Nothing here decrypts. We just store bytes and enforce access in policies.
    public struct CipherRecord has key, store {
        id: UID,

        /// Who sent the ciphertext (for auditing)
        sender: address,

        /// Who is authorized by policy to decrypt/operate
        recipient: address,

        /// Labels (IDs) your off-chain Seal code uses for key derivation
        outer_id: vector<u8>,
        inner_id: vector<u8>,

        /// Outer ciphertext bytes (could be large; keep under Sui object limits)
        outer_ct: vector<u8>,

        /// 32-byte hash of the original plaintext (e.g., blake2b)
        plain_hash: vector<u8>,
    }

    /// ============ CREATE / RECEIVE ============
    ///
    /// Off-chain code calls this to **store** a new ciphertext on chain
    /// and **send** the object to the intended `recipient`.
    public entry fun submit(
        outer_id: vector<u8>,
        outer_ct: vector<u8>,
        inner_id: vector<u8>,
        plain_hash: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let rec = CipherRecord {
            id: object::new(ctx),
            sender: tx_context::sender(ctx),
            recipient,
            outer_id,
            inner_id,
            outer_ct,
            plain_hash,
        };
        // Deliver the object to the recipient’s address.
        transfer::public_transfer(rec, recipient);
    }

    /// ============ READ HELPERS (no mutation) ============
    /// (Useful if another module wants to inspect the record.)

    public fun recipient(rec: &CipherRecord): address { rec.recipient }
    public fun sender(rec: &CipherRecord): address { rec.sender }
    public fun outer_id(rec: &CipherRecord): &vector<u8> { &rec.outer_id }
    public fun inner_id(rec: &CipherRecord): &vector<u8> { &rec.inner_id }
    public fun outer_ct(rec: &CipherRecord): &vector<u8> { &rec.outer_ct }
    public fun plain_hash(rec: &CipherRecord): &vector<u8> { &rec.plain_hash }

    /// Optional: let the **current owner** forward the record to someone else.
    public entry fun forward(rec: CipherRecord, to: address) {
        transfer::public_transfer(rec, to)
    }

    /// Optional: allow the **current owner** to consume the record and extract bytes
    /// for use within the same transaction by another module. This deletes the on-chain object.
    public fun into_payload(rec: CipherRecord): (vector<u8>, vector<u8>, vector<u8>, vector<u8>) {
        let CipherRecord { id, outer_id, inner_id, outer_ct, plain_hash, sender: _, recipient: _ } = rec;
        object::delete(id);
        (outer_id, inner_id, outer_ct, plain_hash)
    }

    /// ============ SEAL POLICY GATES (NO DECRYPTION) ============
    ///
    /// Key servers dry-run these functions off-chain; if they DON’T abort,
    /// the SDK releases a derived key to the client. We only assert access.

    /// Helper: byte-wise equality for vector<u8>
    fun eq_bytes(a: &vector<u8>, b: &vector<u8>): bool {
        let la = vector::length(a);
        if (la != vector::length(b)) return false;
        let mut i = 0;
        while (i < la) {
            if (*vector::borrow(a, i) != *vector::borrow(b, i)) return false;
            i = i + 1;
        };
        true
    }

    /// Policy for the OUTER layer. Anyone calling this must pass:
    ///  - the same `outer_id` used at encrypt time
    ///  - a reference to the on-chain record
    ///  - their address (`who`)
    /// If checks pass, key servers will release a derived key to that caller.
    public fun seal_approve_outer(outer_id: vector<u8>, rec: &CipherRecord, who: address) {
        // Must be the intended recipient
        assert!(who == rec.recipient, 1);
        // Must match the label this record was encrypted under
        assert!(eq_bytes(&outer_id, &rec.outer_id), 2);
        // No return data; absence of abort == approval.
    }

    /// Policy for the INNER layer. Same idea, separate label.
    public fun seal_approve_inner(inner_id: vector<u8>, rec: &CipherRecord, who: address) {
        assert!(who == rec.recipient, 3);
        assert!(eq_bytes(&inner_id, &rec.inner_id), 4);
    }
}