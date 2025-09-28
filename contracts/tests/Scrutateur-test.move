// sources/scrutateur_tests.move
#[test_only]
module vote_pkg::scrutateur_tests {
    use std::vector;
    use sui::tx_context::{Self as tx_context, TxContext};

    // Module sous test
    use vote_pkg::scrutateur as sc;

    /// Contexte déterministe pratique pour fixer le sender.
    fun new_ctx(sender: address, hint: u64): TxContext {
        tx_context::new(sender, tx_context::dummy_tx_hash_with_hint(hint), 0, 0, 0)
    }

    // -----------------------
    // Chemin heureux (admin)
    // -----------------------

    #[test]
    fun receive_blob_as_admin_updates_lengths_and_flags() {
        let admin = @0xA11CE;
        let mut ctx = new_ctx(admin, 1);

        // store possédé par l'admin
        let mut s = sc::new_for_test(admin, &mut ctx);

        assert!(sc::blobs_len(&s) == 0, 100);
        assert!(sc::processed_len(&s) == 0, 101);

        sc::receive_blob(&mut s, b"blob-1", &mut ctx);

        assert!(sc::blobs_len(&s) == 1, 102);
        assert!(sc::processed_len(&s) == 1, 103);
        assert!(!sc::processed_get(&s, 0), 104);

        // Nettoyage
        sc::delete_all(s, &mut ctx);
    }

    #[test]
    fun mark_processed_sets_flag_true_for_admin() {
        let admin = @0xBEEF;
        let mut ctx = new_ctx(admin, 2);

        let mut s = sc::new_for_test(admin, &mut ctx);
        sc::receive_blob(&mut s, b"x", &mut ctx);

        assert!(!sc::processed_get(&s, 0), 110);

        sc::mark_processed(&mut s, 0, &mut ctx);
        assert!(sc::processed_get(&s, 0), 111);

        sc::delete_all(s, &mut ctx);
    }

    #[test]
    fun delete_all_succeeds_for_admin() {
        let admin = @0xC0FFEE;
        let mut ctx = new_ctx(admin, 3);

        let s = sc::new_for_test(admin, &mut ctx);
        sc::delete_all(s, &mut ctx); // pas d’assert : succès si pas d’abort
    }

    // -----------------------
    // Cas d’échec (sécurité)
    // -----------------------

    // receive_blob : rejet si caller != admin
    #[test, expected_failure(abort_code = 1, location = vote_pkg::scrutateur)]
    fun receive_blob_rejects_non_admin() {
        let admin = @0x1;
        let caller = @0x2;

        let mut owner_ctx = new_ctx(admin, 4);
        let mut s = sc::new_for_test(admin, &mut owner_ctx);

        let mut caller_ctx = new_ctx(caller, 5);
        sc::receive_blob(&mut s, b"forbidden", &mut caller_ctx);

        // (non atteint)
        sc::delete_all(s, &mut owner_ctx);
    }

    // mark_processed : rejet si caller != admin
    #[test, expected_failure(abort_code = 2, location = vote_pkg::scrutateur)]
    fun mark_processed_rejects_non_admin() {
        let admin = @0x3;
        let caller = @0x4;

        let mut owner_ctx = new_ctx(admin, 6);
        let mut s = sc::new_for_test(admin, &mut owner_ctx);
        // préparer l’index 0
        sc::receive_blob(&mut s, b"x", &mut owner_ctx);

        let mut caller_ctx = new_ctx(caller, 7);
        sc::mark_processed(&mut s, 0, &mut caller_ctx);

        // (non atteint)
        sc::delete_all(s, &mut owner_ctx);
    }

    // delete_all : rejet si caller != admin
    #[test, expected_failure(abort_code = 3, location = vote_pkg::scrutateur)]
    fun delete_all_rejects_non_admin() {
        let admin = @0x5;
        let caller = @0x6;

        let mut owner_ctx = new_ctx(admin, 8);
        let s = sc::new_for_test(admin, &mut owner_ctx);

        let mut caller_ctx = new_ctx(caller, 9);
        sc::delete_all(s, &mut caller_ctx);
    }

    // -----------------------
    // Cas d’échec (bornes)
    // -----------------------

    // mark_processed : index hors bornes => échec (vector borrow out-of-bounds)
    #[test, expected_failure]
    fun mark_processed_out_of_bounds_aborts() {
        let admin = @0x7;
        let mut ctx = new_ctx(admin, 10);

        let mut s = sc::new_for_test(admin, &mut ctx);
        // aucun élément -> index 0 invalide
        sc::mark_processed(&mut s, 0, &mut ctx);

        // (non atteint)
        sc::delete_all(s, &mut ctx);
    }
}
