#[test_only]
module vote_pkg::vote_scenario_tests {
    use std::vector;
    use sui::tx_context::{Self as tx_context, TxContext};

    // Your modules
    use vote_pkg::verified_addresses as va;
    use vote_pkg::scrutateur as sc;

    // If your verified_addresses.delete_all is entry-only, prefer this helper name:
    // use vote_pkg::verified_addresses::delete_all_for_test;

    // --- Hook points (uncomment/adjust when ready) ---
    // use vote_pkg::password_db as pwdb;
    // use vote_pkg::auth as auth;
    // use vote_pkg::croupier as cr;
    // use vote_pkg::resultats as res;

    /// End-to-end happy path:
    /// - create VerifiedAddrs as admin
    /// - register 3 voters
    /// - “vote” flow via Scrutateur: 3 blobs in, all processed
    /// - assert counts and flags
    /// - cleanup (delete resources)
    #[test]
    fun e2e_register_three_and_process_blobs() {
        // one scenario context is enough here
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&mut ctx);

        // 1) Verified registry (admin-owned)
        let mut reg = va::new_for_test(admin, &mut ctx); // admin == sender

        // 3 deterministic voter addresses
        let v1: address = @0x101;
        let v2: address = @0x102;
        let v3: address = @0x103;

        // register (no permission checks here because we call the internal helper)
         va::add_address(&mut reg, v1, &mut ctx);
         va::add_address(&mut reg, v2, &mut ctx);
         va::add_address(&mut reg, v3, &mut ctx);

        assert!(va::count(&reg) == 3, 1);
        assert!(va::is_verified(&reg, v1), 2);
        assert!(va::is_verified(&reg, v2), 3);
        assert!(va::is_verified(&reg, v3), 4);

        // 2) Scrutateur stores “votes” as blobs; worker/admin appends them
        let mut s = sc::new_for_test(admin, &mut ctx);

        sc::receive_blob(&mut s, b"vote_v1_yes", &mut ctx);
        sc::receive_blob(&mut s, b"vote_v2_no", &mut ctx);
        sc::receive_blob(&mut s, b"vote_v3_yes", &mut ctx);
        
        assert!(sc::blobs_len(&s) == 3, 10);
        assert!(sc::processed_len(&s) == 3, 11);
        assert!(!sc::processed_get(&s, 0), 12);
        assert!(!sc::processed_get(&s, 1), 13);
        assert!(!sc::processed_get(&s, 2), 14);

        // mark all processed
        sc::mark_processed(&mut s, 0, &mut ctx);
        sc::mark_processed(&mut s, 1, &mut ctx);
        sc::mark_processed(&mut s, 2, &mut ctx);
         
        assert!(sc::processed_get(&s, 0), 15);
        assert!(sc::processed_get(&s, 1), 16);
        assert!(sc::processed_get(&s, 2), 17);

        // CLEANUP resources (consume values)
        sc::delete_all(s, &mut ctx);

        // If you have entry-only delete_all, use test-only helper instead:
        // va::delete_all_for_test(reg, &mut ctx);
        // Otherwise, if delete_all is a normal public fun:
        va::delete_all(reg, &mut ctx);
    }

    // -----------------------------
    // Future hooks (uncomment later)
    // -----------------------------

    // #[test]
    // fun e2e_with_passwords_and_auth_and_results() {
    //     let mut ctx = tx_context::dummy();
    //     let admin = tx_context::sender(&ctx);

    //     // 0) Password DB created by emitter=admin (adjust to your API)
    //     // let mut db = pwdb::new_for_test(admin, &mut ctx);
    //     // pwdb::add_hash_internal(&mut db, b\"hash_v1\");
    //     // pwdb::add_hash_internal(&mut db, b\"hash_v2\");
    //     // pwdb::add_hash_internal(&mut db, b\"hash_v3\");

    //     // 1) Verified registry
    //     let mut reg = va::new_for_test(admin, &mut ctx);

    //     let v1: address = @0x101;
    //     let v2: address = @0x102;
    //     let v3: address = @0x103;

    //     // 2) Auth flow (caller/emitter == admin); adds verified addresses by checking db
    //     // auth::authenticate_and_register(&db, &mut reg, v1, &b\"hash_v1\", &mut ctx);
    //     // auth::authenticate_and_register(&db, &mut reg, v2, &b\"hash_v2\", &mut ctx);
    //     // auth::authenticate_and_register(&db, &mut reg, v3, &b\"hash_v3\", &mut ctx);

    //     assert!(va::count(&reg) == 3, 50);

    //     // 3) Voting via your Croupier/Resultats (adjust names):
    //     // let mut results = res::new_for_test(admin, &mut ctx);
    //     // res::vote(&mut results, v1, /* candidate */ 0, &mut ctx); // ok
    //     // #[expected_failure(abort_code = res::E_ALREADY_VOTED, location = vote_pkg::resultats)]
    //     // res::vote(&mut results, v1, 1, &mut ctx); // should abort
    //     // res::vote(&mut results, v2, 1, &mut ctx); // ok
    //     // res::vote(&mut results, v3, 0, &mut ctx); // ok
    //     // let (c0, c1) = res::tally(&results);
    //     // assert!(c0 == 2, 60);
    //     // assert!(c1 == 1, 61);

    //     // Cleanup:
    //     // res::delete_all_for_test(results, &mut ctx);
    //     va::delete_all(reg, &mut ctx);
    // }
}