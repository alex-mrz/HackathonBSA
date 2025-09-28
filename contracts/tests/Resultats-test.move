// sources/vote_receiver_tests.move
#[test_only]
module vote_pkg::vote_receiver_tests {
    use sui::tx_context::{Self as tx_context, TxContext};
    use vote_pkg::vote_receiver as vr;

    /// Petit helper pour un TxContext déterministe (fixe le sender).
    fun new_ctx(sender: address, hint: u64): TxContext {
        tx_context::new(sender, tx_context::dummy_tx_hash_with_hint(hint), 0, 0, 0)
    }

    // -----------------------
    // Chemins heureux
    // -----------------------

    /// Création + lecture initiale.
    #[test]
    fun create_and_read_initial_counts() {
        let admin = @0xA11CE;
        let mut ctx = new_ctx(admin, 1);

        let t = vr::new_for_test(admin, &mut ctx);

        let (y, n, tot) = vr::read_counts(&t);
        assert!(y == 0, 100);
        assert!(n == 0, 101);
        assert!(tot == 0, 102);

        vr::delete_all(t, &mut ctx);
    }

    /// Enregistre 2 "yes" (1) et 1 "no" (2), puis vérifie les compteurs.
    #[test]
    fun receive_choices_and_check_counts() {
        let admin = @0xBEEF;
        let mut ctx = new_ctx(admin, 2);

        let mut t = vr::new_for_test(admin, &mut ctx);

        vr::receive_choice(&mut t, 1, &mut ctx); // yes
        vr::receive_choice(&mut t, 2, &mut ctx); // no
        vr::receive_choice(&mut t, 1, &mut ctx); // yes

        let (y, n, tot) = vr::read_counts(&t);
        assert!(y == 2, 110);
        assert!(n == 1, 111);
        assert!(tot == 3, 112);

        vr::delete_all(t, &mut ctx);
    }

    /// Toute valeur != 1 est comptée comme "no" par l’implémentation.
    #[test]
    fun non_one_choice_is_counted_as_no() {
        let admin = @0xC0FFEE;
        let mut ctx = new_ctx(admin, 3);

        let mut t = vr::new_for_test(admin, &mut ctx);

        vr::receive_choice(&mut t, 0, &mut ctx); // traité comme "no"
        vr::receive_choice(&mut t, 3, &mut ctx); // traité comme "no"

        let (y, n, tot) = vr::read_counts(&t);
        assert!(y == 0, 120);
        assert!(n == 2, 121);
        assert!(tot == 2, 122);

        vr::delete_all(t, &mut ctx);
    }

    /// delete_all réussit pour l’admin.
    #[test]
    fun delete_all_succeeds_for_admin() {
        let admin = @0xDAD;
        let mut ctx = new_ctx(admin, 4);

        let t = vr::new_for_test(admin, &mut ctx);
        vr::delete_all(t, &mut ctx);
    }

    // -----------------------
    // Cas d’échec (sécurité)
    // -----------------------

    /// receive_choice doit échouer si caller != admin (abort code 1).
    #[test, expected_failure(abort_code = 1, location = vote_pkg::vote_receiver)]
    fun receive_choice_rejects_non_admin() {
        let admin = @0x1;
        let caller = @0x2;

        let mut owner_ctx = new_ctx(admin, 5);
        let mut t = vr::new_for_test(admin, &mut owner_ctx);

        let mut attacker_ctx = new_ctx(caller, 6);
        vr::receive_choice(&mut t, 1, &mut attacker_ctx);

        // (non atteint)
        vr::delete_all(t, &mut owner_ctx);
    }

    /// delete_all doit échouer si caller != admin (abort code 2).
    #[test, expected_failure(abort_code = 2, location = vote_pkg::vote_receiver)]
    fun delete_all_rejects_non_admin() {
        let admin = @0x3;
        let caller = @0x4;

        let mut owner_ctx = new_ctx(admin, 7);
        let t = vr::new_for_test(admin, &mut owner_ctx);

        let mut attacker_ctx = new_ctx(caller, 8);
        vr::delete_all(t, &mut attacker_ctx);
    }
}
