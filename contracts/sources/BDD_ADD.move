// sources/verified_addresses.move
module vote_pkg::verified_addresses {
    use sui::object::{Self as object, UID};
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::transfer;
    use std::vector;
    use std::debug;
    use std::string;

    /// Objet qui garde la liste des adresses "vérifiées" et un administrateur
    public struct VerifiedAddrs has key, store{
        id: UID,
        admin: address,
        addrs: vector<address>,
    }

    #[test_only]
    public fun new_for_test(admin: address, ctx: &mut TxContext): VerifiedAddrs {
        VerifiedAddrs { id: object::new(ctx), admin, addrs: vector::empty<address>() }
    }

    /// Crée l'objet VerifiedAddrs et le transfère à l'appelant (devient admin)
    public entry fun create_admin(ctx: &mut TxContext) {
        let obj = VerifiedAddrs {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            addrs: vector::empty<address>(),
        };
        transfer::public_transfer(obj, tx_context::sender(ctx));
        debug::print(&string::utf8(b"VerifiedAddrs created"));

    }

    /// Ajoute une adresse - seul l'admin peut appeler
    public fun add_address(v: &mut VerifiedAddrs, a: address, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == v.admin, 1);
        vector::push_back(&mut v.addrs, a);
        debug::print(&string::utf8(b"Address added"));
    }


    /// Vérifie si une adresse est présente (lecture seule)
    public fun is_verified(v: &VerifiedAddrs, a: address): bool {
        let len = vector::length(&v.addrs);
        let mut i = 0;
        while (i < len) {
            if (*vector::borrow(&v.addrs, i) == a) { return true; };
            i = i + 1;
        };
        false
    }

    /// Retourne le nombre d'adresses (utile pour debugging)
    public fun count(v: &VerifiedAddrs): u64 {
        vector::length(&v.addrs)
    }

    /// Supprime tout (consomme l'objet) - seul admin peut appeler
    public fun delete_all(v: VerifiedAddrs, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == v.admin, 3);
        let VerifiedAddrs { id, addrs: _, admin: _ } = v;
        object::delete(id);
        debug::print(&string::utf8(b"VerifiedAddrs deleted"));
    }
}
/*
#[test_only]
module vote_pkg::verified_addresses_tests {
    use std::vector;
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::object::{Self as object, UID};

    use vote_pkg::verified_addresses::{Self as verified_addresses, VerifiedAddrs};

    // Happy path: create a registry owned by `admin`, add an address, verify, count, delete.
    #[test]
    fun test_create_add_and_verify() {
        // Create a dummy TxContext for testing
        let mut ctx = tx_context::dummy();
        let admin = tx_context::sender(&mut ctx);

        // Construct an owned VerifiedAddrs instance via test-only helper
        let mut v = verified_addresses::new_for_test(admin, &mut ctx);

        // Add an address (here we just add the admin address for simplicity)
        let who = admin;
        verified_addresses::add_address(&mut v, who, &mut ctx);

        // Check membership and size
        assert!(verified_addresses::is_verified(&v, who), 100);
        assert!(verified_addresses::count(&v) == 1, 101);

        // Consume and delete the object to finish cleanly
        verified_addresses::delete_all(v, &mut ctx);
    }
}
*/