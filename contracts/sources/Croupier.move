// sources/croupier.move
module vote_pkg::croupier {
    use sui::object::{Self, UID};
    use std::debug;

    use vote_pkg::verified_addresses;

    /// Stocke blobs chiffrés (soumissions) et la liste des submitters.
    public struct CroupierStore has key {
        id: UID,
        admin: address,
        tokens: vector<vector<u8>>,    // blobs chiffrés tels qu'envoyés par les citoyens
        submitters: vector<address>,  // adresse de qui a soumis chaque token (même index)
        forwarded: bool,              // flag si déjà forwardé
    }

    /// Crée la structure Croupier et l'assigne à l'admin
    public fun create_store(ctx: &mut TxContext) {
        let s = CroupierStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            tokens: vector::empty<vector<u8>>(),
            submitters: vector::empty<address>(),
            forwarded: false,
        };
        transfer::public_transfer(s, tx_context::sender(ctx));
        debug::print(&b"CroupierStore created");
    }

    /// Soumission d'un token chiffré par un citoyen
    /// - v_ref : référence à VerifiedAddrs pour vérifier l'éligibilité
    public fun submit_token(s: &mut CroupierStore, v_ref: &verified_addresses::VerifiedAddrs, token: vector<u8>, ctx: &mut TxContext) {
        // vérifie que sender est dans la liste verified
        let sender = tx_context::sender(ctx);
        let ok = verified_addresses::is_verified(v_ref, sender);
        assert!(ok, 1);

        // vérifie que sender n'a pas déjà soumis
        let n = vector::length(&s.submitters);
        let mut i = 0;
        while (i < n) {
            if (vector::borrow(&s.submitters, i) == &sender) { assert!(false, 2); }
            i = i + 1;
        }

        // enregistre token et submitter
        vector::push_back(&mut s.tokens, token);
        vector::push_back(&mut s.submitters, sender);
        debug::print(&b"Token submitted to croupier");
    }

    /// Forward tokens vers le scrutateur (admin uniquement). Option: shuffle off-chain.
    /// Pour la démo, on envoie les blobs tels quels au scrutateur via un appel on-chain.
    public fun forward_all_to_scrutateur(s: &mut CroupierStore, scrutateur_addr: address, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 3);
        // marquer forwarded pour éviter double forwarding
        s.forwarded = true;
        debug::print(&b"Tokens forwarded (admin should call external worker to actually send)");
        // NOTE: pour la démo on suppose un worker off-chain lit les tokens (en lecture) en appelant sui client object
        // et appelle scrutateur.receive_token pour chacun. Cette fonction on-chain ne fait pas directement l'envoi
        // automatique (car l'envoi/verif off-chain est attendu).
    }

    /// Supprime tout (consomme l'objet) - admin only
    public fun delete_all(s: CroupierStore, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 4);
        let CroupierStore { id, tokens: _, submitters: _, forwarded: _ } = s;
        object::delete(id);
    }
}