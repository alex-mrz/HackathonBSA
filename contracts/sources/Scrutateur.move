// sources/scrutateur.move
module vote_pkg::scrutateur {
    use sui::object::{Self, UID};
    use std::debug;

    /// L'objet du scrutateur reçoit les blobs (encodés pour le scrutateur par le croupier)
    struct ScrutateurStore has key {
        id: UID,
        admin: address,
        blobs: vector<vector<u8>>, // blobs destinés au scrutateur (chiffrés pour scrutateur)
        processed: vector<bool>,   // processed flags (same index)
    }

    public entry fun create_scrutateur(ctx: &mut TxContext) {
        let s = ScrutateurStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            blobs: vector::empty<vector<u8>>(),
            processed: vector::empty<bool>(),
        };
        transfer::public_transfer(s, tx_context::sender(ctx));
        debug::print(&b"ScrutateurStore created");
    }

    /// Reçoit un token (appelé par le worker/off-chain après déchiffrement par le croupier)
    /// Pour la démo on autorise que l'admin (worker) ajoute les blobs
    public entry fun receive_blob(s: &mut ScrutateurStore, blob: vector<u8>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 1);
        vector::push_back(&mut s.blobs, blob);
        vector::push_back(&mut s.processed, false);
        debug::print(&b"Blob received by scrutateur");
    }

    /// Marquer un blob comme traité (admin only)
    public entry fun mark_processed(s: &mut ScrutateurStore, index: u64, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 2);
        let mut flag_ref = vector::borrow_mut(&mut s.processed, index);
        *flag_ref = true;
        debug::print(&b"Blob marked processed");
    }

    /// remove / delete scrutateur store (admin only)
    public entry fun delete_all(s: ScrutateurStore, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 3);
        let ScrutateurStore { id, blobs: _, processed: _ } = s;
        object::delete(id);
    }
}