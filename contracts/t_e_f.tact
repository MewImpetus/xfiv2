import "@stdlib/deploy";
import "./jetton/master";
import "./jetton/wallet";
message Mint {
    origin: Address;
    to: Address;
    amount: Int;
}

contract TEFWallet with JettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    jetton_master: Address;
    init(owner: Address, jetton_master: Address){
        self.owner = owner;
        self.jetton_master = jetton_master;
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf TEFWallet(owner_address, self.jetton_master);
    }
}

contract TEF with JettonMaster, Deployable {
    total_supply: Int as coins = 0;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    genesis: Bool = true;
    init(owner: Address, jetton_content: Cell){
        self.owner = owner;
        self.jetton_content = jetton_content;
    }

    receive("Genesis"){
        require(self.genesis, "For genesis only.");
        let ctx: Context = context();
        let msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: ctx.sender,
            amount: ton("1.1"),
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, msg);
        self._mint(ctx, msg);
        self.genesis = false;
    }

    receive(msg: Mint){
        let ctx: Context = context();
        let _msg: JettonMint = JettonMint{
            origin: msg.origin,
            receiver: msg.to,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf TEFWallet(owner_address, myAddress());
    }
}