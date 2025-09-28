// sources/croupier.move
module vote_pkg::croupier {
    use std::debug;
    use std::string;
    use std::vector;
    use sui::object::{Self as object, UID};
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::transfer;

    use vote_pkg::verified_addresses;

    const E_NOT_VERIFIED : u64 = 1;
    const E_ALREADY_SUBMITTED: u64 = 2;
    /// Stocke blobs chiffrés (soumissions) et la liste des submitters.
    public struct CroupierStore has key, store {
        id: UID,
        admin: address,
        tokens: vector<vector<u8>>,    // blobs chiffrés tels qu'envoyés par les citoyens
        submitters: vector<address>,  // adresse de qui a soumis chaque token (même index)
        forwarded: bool,              // flag si déjà forwardé
    }

    /// Crée la structure Croupier et l'assigne à l'admin
    public entry fun create_store(ctx: &mut TxContext) {
        let s = CroupierStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            tokens: vector::empty<vector<u8>>(),
            submitters: vector::empty<address>(),
            forwarded: false,
        };
        transfer::public_transfer(s, tx_context::sender(ctx));
        debug::print(&string::utf8(b"CroupierStore created"));

    }

    /// Soumission d'un token chiffré par un citoyen
    /// - v_ref : référence à VerifiedAddrs pour vérifier l'éligibilité
    public entry fun submit_token(s: &mut CroupierStore, v_ref: &verified_addresses::VerifiedAddrs, token: vector<u8>, ctx: &mut TxContext) {
        // vérifie que sender est dans la liste verified
        let sender = tx_context::sender(ctx);
        let ok = verified_addresses::is_verified(v_ref, sender);
        assert!(ok, E_NOT_VERIFIED);

        // vérifie que sender n'a pas déjà soumis
        let n = vector::length(&s.submitters);
        let mut i = 0;
        while (i < n) {
            if (*vector::borrow(&s.submitters, i) == sender) {
                assert!(false, E_ALREADY_SUBMITTED);
            };
            i = i + 1;
        };

        // enregistre token et submitter
        vector::push_back(&mut s.tokens, token);
        vector::push_back(&mut s.submitters, sender);
        debug::print(&string::utf8(b"Token submitted to croupier"));

    }

    /// TESTER LES FONCTION SWAP ET SHUFFLE

    
fun shuffle_store(store: &mut CroupierStore, indices: vector<u64>) {
    let n = vector::length(&store.tokens);

    // 1) Copies des vecteurs pour appliquer une permutation "finale"
    let mut t_old = vector::empty<vector<u8>>();
    let mut s_old = vector::empty<address>();
    let mut i = 0;
    while (i < n) {
        let tok_ref = vector::borrow(&store.tokens, i);       // &vector<u8>
        let sub_ref = vector::borrow(&store.submitters, i);    // &address
        vector::push_back(&mut t_old, *tok_ref);               // copie (vector<u8> a ability copy)
        vector::push_back(&mut s_old, *sub_ref);               // copie (address a ability copy)
        i = i + 1;
    };

    // 2) Réécriture en appliquant la permutation: new[i] = old[indices[i]]
    i = 0;
    while (i < n) {
        let j = *vector::borrow(&indices, i);
        *vector::borrow_mut(&mut store.tokens, i) = *vector::borrow(&t_old, j);
        *vector::borrow_mut(&mut store.submitters, i) = *vector::borrow(&s_old, j);
        i = i + 1;
    };
}

    /// Permet au détenteur admin de mélanger les tokens selon une permutation donnée.
    public entry fun shuffle_tokens(store: &mut CroupierStore, indices: vector<u64>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == store.admin, 5);
        shuffle_store(store, indices);
    }

    /// Pour la démo, on envoie les blobs tels quels au scrutateur via un appel on-chain.
    public entry fun forward_all_to_scrutateur(s: &mut CroupierStore, scrutateur_addr: address, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 3);
        let _ = scrutateur_addr; // conserve le paramètre pour usage futur/off-chain
        // marquer forwarded pour éviter double forwarding
        s.forwarded = true;
        debug::print(&string::utf8(b"Tokens forwarded (admin should call external worker to actually send"));
        // NOTE: pour la démo on suppose un worker off-chain lit les tokens (en lecture) en appelant sui client object
        // et appelle scrutateur.receive_token pour chacun. Cette fonction on-chain ne fait pas directement l'envoi
        // automatique (car l'envoi/verif off-chain est attendu).
    }

    /// Supprime tout (consomme l'objet) - admin only
    public entry fun delete_all(s: CroupierStore, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == s.admin, 4);
        let CroupierStore { id, admin: _, tokens: _, submitters: _, forwarded: _ } = s;
        object::delete(id);
    }

    // Helpers visibles seulement en test
#[test_only]
public fun new_for_test(admin: address, ctx: &mut TxContext): CroupierStore {
    CroupierStore {
        id: object::new(ctx),
        admin,
        tokens: vector::empty<vector<u8>>(),
        submitters: vector::empty<address>(),
        forwarded: false,
    }
}

#[test_only]
public fun tokens_len(s: &CroupierStore): u64 {
    vector::length(&s.tokens)
}

#[test_only]
public fun submitters_len(s: &CroupierStore): u64 {
    vector::length(&s.submitters)
}

#[test_only]
public fun submitter_at(s: &CroupierStore, i: u64): address {
    *vector::borrow(&s.submitters, i)
}

#[test_only]
public fun forwarded_flag(s: &CroupierStore): bool {
    s.forwarded
}

// Pour ensemencer des paires (token, submitter) depuis les tests
#[test_only]
public fun push_seed_for_test(s: &mut CroupierStore, tok: vector<u8>, who: address) {
    vector::push_back(&mut s.tokens, tok);
    vector::push_back(&mut s.submitters, who);
}

// Lire le premier octet du i-ème token (utile pour des asserts simples)
#[test_only]
public fun token_first_byte(s: &CroupierStore, i: u64): u8 {
    *vector::borrow(vector::borrow(&s.tokens, i), 0)
}

// Wrapper pour tester la fonction interne
#[test_only]
public fun shuffle_for_test(store: &mut CroupierStore, indices: vector<u64>) {
    shuffle_store(store, indices)
}

}
