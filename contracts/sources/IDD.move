// sources/auth.move
module vote_pkg::auth {
    use std::debug;

    // Importer nos modules de DB
    use vote_pkg::password_db;
    use vote_pkg::verified_addresses::{Self as verified_addresses, VerifiedAddrs};
    

    /// Authenticate : l'entité appelante (ex: "émetteur d'identité") fournit
    /// l'adresse du citoyen (addr) et le hash du mot de passe (pw_hash).
    /// Si pw_hash existe dans PasswordDB -> on appelle VerifiedAddrs::add_address
    /// pour ajouter addr.
    ///
    /// Remarque de sécurité : dans ce squelette, l'appelant doit être celui
    /// configuré comme "emitter" dans password_db et devra de même être admin
    /// de VerifiedAddrs pour pouvoir appeler add_address. Dans une version
    /// plus avancée, on utiliserait des signatures multi-parties ou un rôle.
    public fun authenticate_and_register(
        pw_db: &mut password_db::PasswordDB,
        verified: &mut VerifiedAddrs,
        addr: address,
        pw_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        // L'appelant doit être bien l'émetteur qui a le droit d'ajouter des hashes
        assert!(tx_context::sender(ctx) == password_db::get_emitter(pw_db), 1);

        // Vérifier que le hash existe dans la DB
        let exists = password_db::password_hash_exists(pw_db, &pw_hash);
        assert!(exists, 2);

        // Ajoute l'adresse dans la liste des adresses vérifiées.
        // Ici, pour la démo, on exige que le même émetteur soit aussi admin de VerifiedAddrs,
        // sinon l'assert dans add_address échouera. Dans l'utilisation pratique, on mettra
        // en place un flux admin/autorisation clair.
        verified_addresses::add_address(verified, addr, ctx);
        debug::print(&b"Authenticated and registered address");
    }
}
