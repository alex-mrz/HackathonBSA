#[test_only]
module vote_pkg::auth_tests {
    use std::debug;
    use std::string;
    use sui::tx_context::{Self as tx_context, TxContext};

    use vote_pkg::password_db as pwdb;
    use vote_pkg::verified_addresses as va;
    use vote_pkg::auth as auth;

    /// Petit utilitaire pour un TxContext déterministe (même style que vos autres tests)
    fun new_ctx(sender: address, hint: u64): TxContext {
        tx_context::new(sender, tx_context::dummy_tx_hash_with_hint(hint), 0, 0, 0)
    }

    /// Construit une PasswordDB vide, détenue par `sender`.
    fun new_db(sender: address, hint: u64): (pwdb::PasswordDB, TxContext) {
        let mut ctx = new_ctx(sender, hint);
        let db = pwdb::new_for_testing(sender, &mut ctx);
        (db, ctx)
    }

    // --- HAPPY PATH ---
    // - sender == emitter
    // - hash présent
    // - sender est aussi admin du VerifiedAddrs
    // => l'adresse est ajoutée
    #[test]
    fun authenticate_and_register_happy_path() {
        let admin = @0xA1;
        let mut ctx = new_ctx(admin, 1);

        // DB de mots de passe détenue par admin
        let (mut db, _) = new_db(admin, 2);
        pwdb::add_password_hash(&mut db, b"pw-hash-ok", &mut ctx);

        // Registre vérifié détenu par admin
        let mut reg = va::new_for_test(admin, &mut ctx);

        // Adresse citoyen à inscrire (pour le test : @0x777)
        let voter: address = @0x777;

        // Appel principal
        auth::authenticate_and_register(&mut db, &mut reg, voter, b"pw-hash-ok", &mut ctx);

        // Vérifications
        assert!(va::is_verified(&reg, voter), 10);
        assert!(va::count(&reg) == 1, 11);

        // Nettoyage explicite (consommation)
        va::delete_all(reg, &mut ctx);
        pwdb::delete_all(db, &mut ctx);
    }

   // --- SÉCURITÉ : mauvais émetteur (caller != emitter) ---
// Doit échouer dans vote_pkg::auth avec abort_code = 1.
#[test, expected_failure(abort_code = 1, location = vote_pkg::auth)]
fun authenticate_requires_emitter() {
    let emitter = @0xB2;
    let caller  = @0xB3;

    // DB créée pour emitter
    let (mut db, _) = new_db(emitter, 3);

    // Contexte "owner" où le sender == emitter pour insérer le hash
    let mut owner_ctx = new_ctx(emitter, 4);
    pwdb::add_password_hash(&mut db, b"pw-hash", &mut owner_ctx);

    // Contexte de l'attaquant (sender != emitter)
    let mut attacker_ctx = new_ctx(caller, 5);

    // Registre vérifié détenu par l'attaquant (peu importe ici)
    let mut reg = va::new_for_test(caller, &mut attacker_ctx);

    let who: address = @0xDEAD;

    // Cette fois, l'assert d'auth échoue (caller != emitter) -> abort dans vote_pkg::auth
    auth::authenticate_and_register(&mut db, &mut reg, who, b"pw-hash", &mut attacker_ctx);

    // (non atteint)
    va::delete_all(reg, &mut attacker_ctx);
    pwdb::delete_all(db, &mut attacker_ctx);
}


    // --- SÉCURITÉ : hash manquant ---
    // Doit échouer dans vote_pkg::auth avec abort_code = 2.
    #[test, expected_failure(abort_code = 2, location = vote_pkg::auth)]
    fun authenticate_requires_existing_hash() {
        let admin = @0xC4;
        let mut ctx = new_ctx(admin, 5);

        let (mut db, _) = new_db(admin, 6);        // DB vide (aucun hash)
        let mut reg = va::new_for_test(admin, &mut ctx);

        let voter: address = @0xBEEF;
        // Échec attendu car "pw-hash-missing" n'existe pas dans la DB
        auth::authenticate_and_register(&mut db, &mut reg, voter, b"pw-hash-missing", &mut ctx);

        // (pas atteint)
        va::delete_all(reg, &mut ctx);
        pwdb::delete_all(db, &mut ctx);
    }

    // --- SÉCURITÉ : caller n'est pas admin de VerifiedAddrs ---
    // L'assert échoue à l'intérieur de verified_addresses::add_address
    // => abort_code = 1, location = vote_pkg::verified_addresses
    #[test, expected_failure(abort_code = 1, location = vote_pkg::verified_addresses)]
    fun authenticate_requires_verified_admin() {
        let emitter_and_caller = @0xD5;
        let registry_admin     = @0xD6; // différent -> provoque l'échec dans add_address

        // Contexte où le sender == emitter
        let mut ctx = new_ctx(emitter_and_caller, 7);

        // DB détenue par sender/emitter avec un hash valable
        let (mut db, _) = new_db(emitter_and_caller, 8);
        pwdb::add_password_hash(&mut db, b"pw-ok", &mut ctx);

        // Registre dont l'admin est quelqu'un d'autre (≠ sender)
        let mut reg = va::new_for_test(registry_admin, &mut ctx);

        let voter: address = @0x123;
        // L'assert d'emitter passe (caller == emitter), le hash existe,
        // mais add_address échoue car sender != reg.admin.
        auth::authenticate_and_register(&mut db, &mut reg, voter, b"pw-ok", &mut ctx);

        // (pas atteint)
        va::delete_all(reg, &mut ctx);
        pwdb::delete_all(db, &mut ctx);
    }
}
