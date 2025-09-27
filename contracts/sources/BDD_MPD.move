// sources/password_db.move
module vote_pkg::password_db {
    use sui::object::{Self, UID};
    use std::debug;

    /// Stocke des hash de mots de passe (vector<u8> par hash)
    /// NOTE: pour la démo nous stockons des hash (SHA256) ; NE PAS stocker
    /// de mots de passe en clair en production.
    public struct PasswordDB has key, store {
        id: UID,
        emitter: address,            // entité qui a le droit d'ajouter des hashes
        hashes: vector<vector<u8>>,  // chaque élément est un hash (vector<u8>)
    }

    /// Crée la DB et la transfère à l'émetteur (caller)
    public entry fun create_db(ctx: &mut TxContext) {
        let db = PasswordDB {
            id: object::new(ctx),
            emitter: tx_context::sender(ctx),
            hashes: vector::empty<vector<u8>>(),
        };
        transfer::public_transfer(db, tx_context::sender(ctx));
        debug::print(&b"PasswordDB created");
    }

    /// Ajoute un hash (seul emitter peut ajouter)
    public entry fun add_password_hash(db: &mut PasswordDB, h: vector<u8>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == db.emitter, 1);
        vector::push_back(&mut db.hashes, h);
        debug::print(&b"Password hash added");
    }

   /// Vérifie si un hash existe
    public fun password_hash_exists(db: &PasswordDB, h: &vector<u8>): bool {
        let n = vector::length(&db.hashes);
        let mut i = 0;
        while (i < n) {
            let cur = vector::borrow(&db.hashes, i); // &vector<u8>
            if (eq_bytes(cur, h)) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// Égalité structurelle de deux `vector<u8>`
    fun eq_bytes(a: &vector<u8>, b: &vector<u8>): bool {
        let la = vector::length(a);
        let lb = vector::length(b);
        if (la != lb) return false;

        let mut i = 0;
        while (i < la) {
            if (*vector::borrow(a, i) != *vector::borrow(b, i)) {
                return false
            };
            i = i + 1;
        };
        true
    }    

    /// Supprime toute la DB (consomme l'objet) - seul emitter peut appeler
    public entry fun delete_all(db: PasswordDB, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == db.emitter, 2);
        let PasswordDB { id, emitter: _, hashes: _ } = db;
        object::delete(id);
        debug::print(&b"PasswordDB deleted");
    }
}