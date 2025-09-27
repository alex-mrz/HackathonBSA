// sources/verified_addresses.move
module vote_pkg::verified_addresses {
    use sui::object::{Self, UID};
    use std::debug;

    /// Objet qui garde la liste des adresses "vérifiées" et un administrateur
    public struct VerifiedAddrs has key, store {
        id: UID,
        admin: address,
        addrs: vector<address>,
    }

    /// Crée l'objet VerifiedAddrs et le transfère à l'appelant (devient admin)
    public fun create_admin(ctx: &mut TxContext) {
        let obj = VerifiedAddrs {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            addrs: vector::empty<address>(),
        };
        transfer::public_transfer(obj, tx_context::sender(ctx));
        debug::print(&b"VerifiedAddrs created");
    }

    /// Ajoute une adresse - seul l'admin peut appeler
    public fun add_address(mut v: VerifiedAddrs, a: address, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == v.admin, 1);
        vector::push_back(&mut v.addrs, a);
        transfer::public_transfer(v, v.admin);
        debug::print(&b"Address added");
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
        debug::print(&b"VerifiedAddrs deleted");
    }
}