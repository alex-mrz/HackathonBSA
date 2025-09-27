// sources/scrutateur.move
module vote_pkg::scrutateur {
    use sui::object::{Self as object, UID};
    use std::debug;
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::transfer;
    use std::vector;

    /// L'objet du scrutateur reçoit les blobs (encodés pour le scrutateur par le croupier)
    public struct ScrutateurStore has key, store {
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
    public fun receive_blob(s: &mut ScrutateurStore, blob: vector<u8>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 1);
        vector::push_back(&mut s.blobs, blob);
        vector::push_back(&mut s.processed, false);
        debug::print(&b"Blob received by scrutateur");
    }

    /// Marquer un blob comme traité (admin only)
    public fun mark_processed(s: &mut ScrutateurStore, index: u64, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 2);
        let mut flag_ref = vector::borrow_mut(&mut s.processed, index);
        *flag_ref = true;
        debug::print(&b"Blob marked processed");
    }

    /// remove / delete scrutateur store (admin only)
    public fun delete_all(s: ScrutateurStore, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 3);
        let ScrutateurStore { id, admin: _, blobs: _, processed: _ } = s;
        object::delete(id);
    }
    // ============================
    // Tests (unit + negative cases)
    // ============================

    #[test]
    fun test_receive_blob_as_admin() {
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&ctx);
        let mut s = ScrutateurStore { id: object::new(&mut ctx), admin, blobs: vector::empty<vector<u8>>(), processed: vector::empty<bool>() };

        assert!(vector::length(&s.blobs) == 0, 100);
        receive_blob(&mut s, b"abc", &mut ctx);
        assert!(vector::length(&s.blobs) == 1, 101);
        assert!(vector::length(&s.processed) == 1, 102);
        assert!(*vector::borrow(&s.processed, 0) == false, 103);

        // cleanup
        delete_all(s, &mut ctx);
    }

    #[test]
    #[expected_failure(abort_code = 1, location = vote_pkg::scrutateur)]
    fun test_receive_blob_unauthorized_aborts() {
        let mut ctx = tx_context::dummy();
        let me = tx_context::sender(&ctx);
        // pick an address guaranteed different from `me`
        let other: address = if (me == @0x1) { @0x2 } else { @0x1 };
        let mut s = ScrutateurStore { id: object::new(&mut ctx), admin: other, blobs: vector::empty<vector<u8>>(), processed: vector::empty<bool>() };
        receive_blob(&mut s, b"zzz", &mut ctx); // should abort with code 1
        let ScrutateurStore { id, admin: _, blobs: _, processed: _ } = s; object::delete(id);
    }

    #[test]
    fun test_mark_processed_as_admin() {
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&ctx);
        let mut s = ScrutateurStore { id: object::new(&mut ctx), admin, blobs: vector::empty<vector<u8>>(), processed: vector::empty<bool>() };
        // seed one blob
        receive_blob(&mut s, b"blob", &mut ctx);
        assert!(vector::length(&s.processed) == 1, 110);
        assert!(*vector::borrow(&s.processed, 0) == false, 111);

        mark_processed(&mut s, 0, &mut ctx);
        assert!(*vector::borrow(&s.processed, 0) == true, 112);

        delete_all(s, &mut ctx);
    }

    #[test]
    #[expected_failure(abort_code = 2, location = vote_pkg::scrutateur)]
    fun test_mark_processed_unauthorized_aborts() {
        let mut ctx = tx_context::dummy();
        let me = tx_context::sender(&ctx);
        let other: address = if (me == @0x1) { @0x2 } else { @0x1 };
        let mut s = ScrutateurStore { id: object::new(&mut ctx), admin: other, blobs: vector::empty<vector<u8>>(), processed: vector::empty<bool>() };
        // prepare vectors so index 0 exists
        vector::push_back(&mut s.blobs, b"a");
        vector::push_back(&mut s.processed, false);
        mark_processed(&mut s, 0, &mut ctx); // should abort with code 2
        let ScrutateurStore { id, admin: _, blobs: _, processed: _ } = s; object::delete(id);
    }

    #[test]
    #[expected_failure]
    fun test_mark_processed_out_of_bounds_aborts() {
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&ctx);
        let mut s = ScrutateurStore { id: object::new(&mut ctx), admin, blobs: vector::empty<vector<u8>>(), processed: vector::empty<bool>() };
        // no items; index 0 is out-of-bounds for processed
        mark_processed(&mut s, 0, &mut ctx);
        let ScrutateurStore { id, admin: _, blobs: _, processed: _ } = s; object::delete(id);
    }

    #[test]
    fun test_delete_all_as_admin() {
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&ctx);
        let s = ScrutateurStore { id: object::new(&mut ctx), admin, blobs: vector::empty<vector<u8>>(), processed: vector::empty<bool>() };
        delete_all(s, &mut ctx); // succeeds
    }

    #[test]
    #[expected_failure(abort_code = 3, location = vote_pkg::scrutateur)]
    fun test_delete_all_unauthorized_aborts() {
        let mut ctx = tx_context::dummy();
        let me = tx_context::sender(&ctx);
        let other: address = if (me == @0x1) { @0x2 } else { @0x1 };
        let s = ScrutateurStore { id: object::new(&mut ctx), admin: other, blobs: vector::empty<vector<u8>>(), processed: vector::empty<bool>() };
        delete_all(s, &mut ctx); // should abort with code 3
    }
}