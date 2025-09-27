#[test_only]
module vote_pkg::verified_addresses_tests {
    use std::vector;
    use std::string;
    use sui::tx_context::{Self as tx_context, TxContext};
    use vote_pkg::verified_addresses::{Self as verified_addresses, VerifiedAddrs};

    // Happy path: create a registry owned by `admin`, add an address, verify, count, delete.
    #[test]
    fun test_create_add_and_verify() {
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&mut ctx);

        let mut v = verified_addresses::new_for_test(admin, &mut ctx);

        let who = admin;
        verified_addresses::add_address(&mut v, who, &mut ctx);

        assert!(verified_addresses::is_verified(&v, who), 100);
        assert!(verified_addresses::count(&v) == 1, 101);

        verified_addresses::delete_all(v, &mut ctx);
    }

    // Address absente : is_verified doit renvoyer false et count rester à 0.
    #[test]
    fun test_is_verified_false_when_absent() {
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&mut ctx);

        let v = verified_addresses::new_for_test(admin, &mut ctx);

        let someone: address = @0xBEEF;
        assert!(!verified_addresses::is_verified(&v, someone), 200);
        assert!(verified_addresses::count(&v) == 0, 201);
        verified_addresses::delete_all(v, &mut ctx);
    }

    // Ajouts multiples (y compris doublon) et vérification du count.
    #[test]
    fun test_multiple_adds_and_count_with_duplicates() {
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&mut ctx);

        let mut v = verified_addresses::new_for_test(admin, &mut ctx);

        let a1: address = @0x1;
        let a2: address = @0x2;

        verified_addresses::add_address(&mut v, a1, &mut ctx);
        verified_addresses::add_address(&mut v, a2, &mut ctx);
        // doublon volontaire
        verified_addresses::add_address(&mut v, a1, &mut ctx);

        assert!(verified_addresses::is_verified(&v, a1), 300);
        assert!(verified_addresses::is_verified(&v, a2), 301);
        // l’implémentation autorise les doublons => count == 3
        assert!(verified_addresses::count(&v) == 3, 302);

        verified_addresses::delete_all(v, &mut ctx);
    }

    // Sécurité : seul l’admin peut ajouter. Ici on crée un registre dont l’admin
    // N’EST PAS le sender courant, donc add_address doit abort avec code 1.
    #[test]
#[expected_failure(abort_code = 1, location = vote_pkg::verified_addresses)]
    fun test_add_address_requires_admin() {
        let mut ctx = tx_context::dummy();
        let not_sender_admin: address = @0xA11CE; // différent de tx_context::sender(&mut ctx)

        let mut v = verified_addresses::new_for_test(not_sender_admin, &mut ctx);

        let who: address = @0xCAFE;
        // doit échouer car sender(ctx) != v.admin
        verified_addresses::add_address(&mut v, who, &mut ctx);
        verified_addresses::delete_all(v, &mut ctx);
    }

    // Sécurité : seul l’admin peut delete_all. Même technique : admin ≠ sender.
    #[test]
#[expected_failure(abort_code = 3, location = vote_pkg::verified_addresses)]
    fun test_delete_all_requires_admin() {
        let mut ctx = tx_context::dummy();
        let not_sender_admin: address = @0xDAD;

        let mut v = verified_addresses::new_for_test(not_sender_admin, &mut ctx);
        // même sans ajout, l’appel doit abort sur le contrôle d’accès
        verified_addresses::delete_all(v, &mut ctx);
    }
}
