#[test_only]
module vote_pkg::croupier_tests {
    use sui::tx_context;
    use vote_pkg::croupier;
    use vote_pkg::verified_addresses as va;

    // Contexte déterministe (permet de fixer le sender)
    fun new_ctx(sender: address, hint: u64): tx_context::TxContext {
        tx_context::new(sender, tx_context::dummy_tx_hash_with_hint(hint), 0, 0, 0)
    }

    // ================
    // Happy path: submit
    // ================
    #[test]
    fun submit_token_from_verified_adds_one() {
        let admin = @0xA11CE;
        let mut ctx = new_ctx(admin, 1);

        let mut reg = va::new_for_test(admin, &mut ctx);
        va::add_address(&mut reg, admin, &mut ctx);

        let mut s = croupier::new_for_test(admin, &mut ctx);

        croupier::submit_token(&mut s, &reg, b"t1", &mut ctx);

        assert!(croupier::tokens_len(&s) == 1, 10);
        assert!(croupier::submitters_len(&s) == 1, 11);
        assert!(croupier::submitter_at(&s, 0) == admin, 12);

        croupier::delete_all(s, &mut ctx);
        va::delete_all(reg, &mut ctx);
    }

    // Non vérifié → abort(1)
    #[test, expected_failure(abort_code = 1, location = vote_pkg::croupier)]
    fun submit_token_from_unverified_aborts() {
        let admin = @0xBEEF;
        let unverified = @0xBAD;

        let mut owner_ctx = new_ctx(admin, 2);
        let mut reg = va::new_for_test(admin, &mut owner_ctx);
        let mut s = croupier::new_for_test(admin, &mut owner_ctx);

        let mut attacker_ctx = new_ctx(unverified, 3);
        croupier::submit_token(&mut s, &reg, b"x", &mut attacker_ctx);

        // (non atteint)
        croupier::delete_all(s, &mut owner_ctx);
        va::delete_all(reg, &mut owner_ctx);
    }

    // Double soumission → abort(2)
    #[test, expected_failure(abort_code = 2, location = vote_pkg::croupier)]
    fun submit_token_twice_from_same_sender_aborts() {
        let voter = @0xC0FFEE;
        let mut ctx = new_ctx(voter, 4);

        let mut reg = va::new_for_test(voter, &mut ctx);
        va::add_address(&mut reg, voter, &mut ctx);

        let mut s = croupier::new_for_test(voter, &mut ctx);
        croupier::submit_token(&mut s, &reg, b"a", &mut ctx);
        croupier::submit_token(&mut s, &reg, b"b", &mut ctx); // abort attendu

        // (non atteint)
        croupier::delete_all(s, &mut ctx);
        va::delete_all(reg, &mut ctx);
    }

    // forward_all_to_scrutateur : admin only
    #[test]
    fun forward_sets_flag_as_admin() {
        let admin = @0xDAD;
        let mut ctx = new_ctx(admin, 5);

        let mut s = croupier::new_for_test(admin, &mut ctx);
        assert!(!croupier::forwarded_flag(&s), 20);

        croupier::forward_all_to_scrutateur(&mut s, @0x1, &mut ctx);
        assert!(croupier::forwarded_flag(&s), 21);

        croupier::delete_all(s, &mut ctx);
    }

    #[test, expected_failure(abort_code = 3, location = vote_pkg::croupier)]
    fun forward_rejected_for_non_admin() {
        let admin = @0xE1;
        let caller = @0xE2;

        let mut owner_ctx = new_ctx(admin, 6);
        let mut s = croupier::new_for_test(admin, &mut owner_ctx);

        let mut caller_ctx = new_ctx(caller, 7);
        croupier::forward_all_to_scrutateur(&mut s, @0x1, &mut caller_ctx);

        // (non atteint)
        croupier::delete_all(s, &mut owner_ctx);
    }

    // delete_all : admin only
    #[test]
    fun delete_all_as_admin_succeeds() {
        let admin = @0xF00D;
        let mut ctx = new_ctx(admin, 8);
        let s = croupier::new_for_test(admin, &mut ctx);
        croupier::delete_all(s, &mut ctx);
    }

    #[test, expected_failure(abort_code = 4, location = vote_pkg::croupier)]
    fun delete_all_rejected_for_non_admin() {
        let admin = @0xA0;
        let caller = @0xA1;

        let mut owner_ctx = new_ctx(admin, 9);
        let s = croupier::new_for_test(admin, &mut owner_ctx);

        let mut caller_ctx = new_ctx(caller, 10);
        croupier::delete_all(s, &mut caller_ctx); // abort attendu
    }

    // shuffle_store: cohérence tokens/submitters
    #[test]
    fun shuffle_keeps_pairing_between_arrays() {
        let admin = @0xABCD;
        let mut ctx = new_ctx(admin, 11);

        let mut s = croupier::new_for_test(admin, &mut ctx);

        // seed
        croupier::push_seed_for_test(&mut s, b"a", @0x1);
        croupier::push_seed_for_test(&mut s, b"b", @0x2);
        croupier::push_seed_for_test(&mut s, b"c", @0x3);

        // permutation: [2,0,1]
        let mut idx = vector::empty<u64>();
        vector::push_back(&mut idx, 2);
        vector::push_back(&mut idx, 0);
        vector::push_back(&mut idx, 1);

        croupier::shuffle_for_test(&mut s, idx);

        // ordre attendu: submitters = (@3,@1,@2) ; tokens = ("c","a","b")
        assert!(croupier::submitter_at(&s, 0) == @0x3, 30);
        assert!(croupier::submitter_at(&s, 1) == @0x1, 31);
        assert!(croupier::submitter_at(&s, 2) == @0x2, 32);

        // premier octet: 'c'==99, 'a'==97, 'b'==98
        assert!(croupier::token_first_byte(&s, 0) == 99, 33);
        assert!(croupier::token_first_byte(&s, 1) == 97, 34);
        assert!(croupier::token_first_byte(&s, 2) == 98, 35);

        croupier::delete_all(s, &mut ctx);
    }
}
