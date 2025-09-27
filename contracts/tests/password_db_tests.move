#[test_only]
module vote_pkg::password_db_tests {
    use std::debug;
    use vote_pkg::password_db;

    /// Helper that creates a deterministic `TxContext` for tests.
    fun new_ctx(sender: address, hint: u64): sui::tx_context::TxContext {
        sui::tx_context::new(sender, sui::tx_context::dummy_tx_hash_with_hint(hint), 0, 0, 0)
    }

    /// Helper that constructs an empty `PasswordDB` owned by `sender`.
    fun new_db(sender: address, hint: u64): (password_db::PasswordDB, sui::tx_context::TxContext) {
        let mut ctx = new_ctx(sender, hint);
        let db = password_db::new_for_testing(sender, &mut ctx);
        (db, ctx)
    }

    #[test]
    fun create_db_increments_ids_created() {
        let sender = @0xA;
        let mut ctx = new_ctx(sender, 1);
        let before = sui::tx_context::get_ids_created(&ctx);
        debug::print(&b"create_db: before increment");
        password_db::create_db(&mut ctx);
        let after = sui::tx_context::get_ids_created(&ctx);
        assert!(after == before + 1, 0);
        debug::print(&b"create_db: after increment");
    }

    #[test]
    fun add_password_hash_stores_value() {
        let sender = @0xB;
        let (mut db, mut ctx) = new_db(sender, 2);
        debug::print(&b"add_password_hash: inserting hash-1");
        password_db::add_password_hash(&mut db, b"hash-1", &mut ctx);
        let query = b"hash-1";
        debug::print(&b"add_password_hash: verifying presence");
        assert!(password_db::password_hash_exists(&db, &query), 0);
        debug::print(&b"add_password_hash: cleaning up");
        password_db::delete_all(db, &mut ctx);
    }

    #[test]
    fun password_hash_exists_returns_false_for_missing_hash() {
        let sender = @0xC;
        let (mut db, mut ctx) = new_db(sender, 3);
        debug::print(&b"password_hash_exists: inserting known hash");
        password_db::add_password_hash(&mut db, b"known", &mut ctx);
        let missing = b"unknown";
        debug::print(&b"password_hash_exists: lookup for missing hash");
        assert!(!password_db::password_hash_exists(&db, &missing), 0);
        debug::print(&b"password_hash_exists: cleaning up");
        password_db::delete_all(db, &mut ctx);
    }

    #[test, expected_failure(abort_code = 1, location = 0x0::password_db)]
    fun add_password_hash_rejects_non_emitter() {
        let sender = @0xD;
        let (mut db, mut owner_ctx) = new_db(sender, 4);
        let mut attacker_ctx = new_ctx(@0xE, 5);
        debug::print(&b"add_password_hash: attacker attempting insert");
        password_db::add_password_hash(&mut db, b"forbidden", &mut attacker_ctx);
        password_db::delete_all(db, &mut owner_ctx);
    }

    #[test]
    fun delete_all_succeeds_for_emitter() {
        let sender = @0xF;
        let (db, mut ctx) = new_db(sender, 6);
        debug::print(&b"delete_all: emitter deleting");
        password_db::delete_all(db, &mut ctx);
    }

    #[test, expected_failure(abort_code = 2, location = 0x0::password_db)]
    fun delete_all_rejects_non_emitter() {
        let sender = @0x10;
        let (db, _) = new_db(sender, 7);
        let mut attacker_ctx = new_ctx(@0x11, 8);
        debug::print(&b"delete_all: attacker attempting delete");
        password_db::delete_all(db, &mut attacker_ctx);
    }

    #[test]
    fun get_emitter_returns_configured_address() {
        let sender = @0x12;
        let (db, mut ctx) = new_db(sender, 9);
        debug::print(&b"get_emitter: verifying address");
        assert!(password_db::get_emitter(&db) == sender, 0);
        debug::print(&b"get_emitter: cleaning up");
        password_db::delete_all(db, &mut ctx);
    }
}
