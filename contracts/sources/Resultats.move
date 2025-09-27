// sources/vote_receiver.move
module vote_pkg::vote_receiver {
    use sui::object::{Self, UID};
    use std::debug;

    /// Objet qui stocke le tally (comptage) pour la démo
    struct VoteTally has key {
        id: UID,
        admin: address,
        yes: u64,
        no: u64,
        total: u64,
        // Optionnel : stocker preuves / hashes des jetons reçus si besoin
    }

    /// Crée la structure initiale (admin = creator)
    public entry fun create_tally(ctx: &mut TxContext) {
        let t = VoteTally {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            yes: 0,
            no: 0,
            total: 0,
        };
        transfer::public_transfer(t, tx_context::sender(ctx));
        debug::print(&b"VoteTally created");
    }

    /// Réception d'un choix (appelé par scrutateur/off-chain worker)
    /// choice: 1 => yes, 2 => no
    public entry fun receive_choice(v: &mut VoteTally, choice: u8, ctx: &mut TxContext) {
        // Only admin/scrutateur should be allowed to call this in the demo
        assert!(tx_context::sender(ctx) == v.admin, 1);
        if (choice == 1) {
            v.yes = v.yes + 1;
        } else {
            v.no = v.no + 1;
        }
        v.total = v.total + 1;
        debug::print(&b"Choice recorded");
    }

    /// Lecture du décompte (public)
    public fun read_counts(v: &VoteTally): (u64, u64, u64) {
        (v.yes, v.no, v.total)
    }

    /// Supprime le tally (admin only)
    public entry fun delete_all(v: VoteTally, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == v.admin, 2);
        let VoteTally { id, yes: _, no: _, total: _ } = v;
        object::delete(id);
    }
}


//results publisher

// sources/results_publisher.move
module vote_pkg::results_publisher {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use std::vector;
    use std::debug;

    /// Stocker le résultat publié (final)
    struct PublishedResult has key {
        id: UID,
        publisher: address,
        yes: u64,
        no: u64,
        total: u64,
        note: vector<u8>, // message optionnel
    }

    /// Publier le résultat final (seul le scrutateur/admin peut appeler)
    public entry fun publish_result(yes: u64, no: u64, total: u64, note: vector<u8>, ctx: &mut TxContext) {
        let r = PublishedResult {
            id: object::new(ctx),
            publisher: tx_context::sender(ctx),
            yes,
            no,
            total,
            note,
        };
        transfer::public_transfer(r, tx_context::sender(ctx));
        debug::print(&b"Result published");
    }

    /// Supprime le résultat (publisher only)
    public entry fun delete_result(r: PublishedResult, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == r.publisher, 1);
        let PublishedResult { id, yes: _, no: _, total: _, note: _ } = r;
        object::delete(id);
        debug::print(&b"PublishedResult deleted");
    }
}