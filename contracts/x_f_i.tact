import "@stdlib/deploy";
import "@stdlib/ownable";
import "./t_e_f";

struct MintConfig {
    merkle_root : String;
    set_at : Int as uint32 = 0;
    set_interval: Int as uint32 = 24 * 3600;
    admin : Address;
    max_mint_today : Int as uint64;  // Maximum mintable today
    minted_today : Int as uint64;   // minted amount today
}

message UserMint {
    index: Int;
    to: Address;
    amount: Int;
    proof: Cell;
    proof_length: Int;
    to_str: String;
}

message TransactionCheck {
    origin: Address;
    to: Address;
    amount: Int;
}
message CheckResult {
    origin: Address;
    pass: Bool;
    txid: Int;
    to: Address;
    amount: Int;
}

message IncreaseBalance {
    amount: Int;
}

message DecreaseBalance {
    amount: Int;
}

// Check if the transaction exists.
contract TransactionValidator {
    txid: Int;
    parent: Address;
    pass: Bool;
    init(txid: Int, parent: Address){
        self.txid = txid;
        self.parent = parent;
        self.pass = true;
    }

    receive(msg: TransactionCheck){
        let ctx: Context = context();
        require(ctx.sender == self.parent, "No permission");
        self.reply(CheckResult{origin: msg.origin, pass: self.pass, txid:self.txid, to: msg.to, amount: msg.amount}.toCell());
        self.pass = false;
    }

    get fun get_pass(): Bool {
        return self.pass;
    }

    get fun get_parent(): Address {
        return self.parent;
    }

    get fun get_txid(): Int {
        return self.txid;
    }
}

// save 50% mint token
contract TokenVault {
    mint_nums: Int = 0;
    owner: Address;
    parent: Address;
    init (owner: Address, parent: Address) {
        self.owner = owner;
        self.parent = parent;
    }

    receive("mint to vault") {
        self.mint_nums = self.mint_nums + 1;
    }

    receive (msg: JettonTransfer) {
        // TODO burn 10%
        // TODO transfer 90%
    }

    get fun get_mint_nums(): Int {
        return self.mint_nums;
    }
    
}

contract XFI with Deployable, Ownable {
    owner: Address;
    master: Address;
    vaultTotal: Int as coins = 0;  // Total balance of the vault
    mint_config: MintConfig;
    jetton_content: Cell;

    init(jetton_content: Cell, mint_config: MintConfig){
        self.mint_config = mint_config;
        self.jetton_content = jetton_content;
        self.master = sender();
        self.owner = sender(); // Set the administrator of this contract.
    }

    receive("deploy jetton master") {
        // Deploy the master contract and set the administrator to this contract.
        let initCode: StateInit = initOf TEF(myAddress(), self.jetton_content);
        let master_address: Address = contractAddress(initCode);
        send(SendParameters{
                to: master_address,
                value: ton("0.05"), // pay for message, the deployment and give some TON for storage
                mode: SendIgnoreErrors,
                code: initCode.code, // attaching the state init will cause the message to deploy
                data: initCode.data,
                body: "Genesis".asComment() // we must piggyback the deployment on another message
            }
        );
        self.master = master_address;
    }


    // mining for users
    receive(msg: UserMint){
        let ctx: Context = context();
        // Merkle tree verification
        let target_hash: String = self.calculate_transaction_hash(msg.index, msg.to_str, msg.amount);
        require(self.verify_proof(target_hash, msg.proof, msg.proof_length), "Merkle verification failed.");
        let init: StateInit = self.calculate_transaction_validator_init(msg.index);
        send(SendParameters{
                to: contractAddress(init),
                value: 0,
                mode: SendRemainingValue,
                body: TransactionCheck{origin:ctx.sender, to: msg.to, amount: msg.amount}.toCell(),
                code: init.code,
                data: init.data
            }
        );
    }

    // send mint to master
    receive(msg: CheckResult){
        let ctx: Context = context();
        self._mint_validate(ctx, msg.txid);
        if (msg.pass) {
            let cash: Int = msg.amount /2;
            // send cash
            send(SendParameters{
                    to: self.master,
                    value: ton("0.01"),
                    mode: SendRemainingValue,
                    body: Mint{ origin: msg.origin, to: msg.to, amount: cash }.toCell()
                }
            );
            // send vault
            let initCode: StateInit = self.calculate_vault_init(msg.to);
            let vault_address: Address = contractAddress(initCode);
            send(SendParameters{
                to: vault_address,
                body: "mint to vault".asComment(),
                value: ton("0.9"),             // pay for the deployment and leave some TON in the child for storage
                mode: SendRemainingValue,
                code: initCode.code,            // deploy the child if needed
                data: initCode.data
            });
            send(SendParameters {
                    to: self.master,
                    value: ton("0.12"),
                    mode: SendRemainingValue,
                    body: Mint{ origin: msg.origin, to: vault_address, amount: msg.amount - cash }.toCell()
                }
            );
        }
    }


    inline fun calculate_transaction_hash(index: Int, to_str: String, amount: Int): String {
        let ctx: Context = context();
        let sb: StringBuilder = beginString();
        sb.append(index.toString());
        sb.append(to_str);
        sb.append(amount.toString());
        return self.sha128(sb.toString());
    }
   

    inline fun sha128(s: String) : String {
        return (sha256(s) >> 128).toString();
    }

    inline fun verify_proof(target_hash: String, proof: Cell, proof_length: Int): Bool {
        let current_hash: String = target_hash;
        let frist_cell: Bool = true; 
        let parser : Slice = proof.beginParse();
        repeat (proof_length) {
            if (!frist_cell) {
                if !parser.refsEmpty() {
                    parser = parser.loadRef().beginParse();
                }
            }
            let _hash: Int = parser.loadUint(128);
            let _position: Int = parser.loadUint(1);
            let sb: StringBuilder = beginString();

            if (_position == 0) {
                sb.append(_hash.toString());
                sb.append(current_hash);
            } else {
                sb.append(current_hash);
                sb.append(_hash.toString());
            }

            current_hash = self.sha128(sb.toString());
            frist_cell = false;
        }

        return current_hash == self.mint_config.merkle_root;
    }

    inline fun _mint_validate(ctx: Context, txid: Int) {
        require(ctx.sender == contractAddress(self.calculate_transaction_validator_init(txid)), "No permission");
    }

    // Duplicate transaction verification Contract Address
    inline fun calculate_transaction_validator_init(txid: Int): StateInit {
        return initOf TransactionValidator(txid, myAddress());
    }

    inline fun calculate_vault_init(owner: Address): StateInit {
        return initOf TokenVault(owner, myAddress());
    }

    // get function
    //==================================================
    get fun get_jetton_master(): Address {
        return self.master;
    }

    get fun get_myaddress(): Address {
        return myAddress();
    }

    get fun get_transaction_validator_address(index: Int): Address {
        let init: StateInit = self.calculate_transaction_validator_init(index);
        return contractAddress(init);
    }

    get fun get_vault_address(owner: Address): Address {
        let initCode: StateInit = self.calculate_vault_init(owner);
        return contractAddress(initCode);
    }



    // just for test
    //==================================================

    get fun testmint(msg: UserMint): Address {
        // Merkle tree verification
        let target_hash: String = self.calculate_transaction_hash(msg.index, msg.to_str, msg.amount);
        require(self.verify_proof(target_hash, msg.proof, msg.proof_length), "Merkle verification failed.");
        let init: StateInit = self.calculate_transaction_validator_init(msg.index);
        return contractAddress(init);
        // send(SendParameters{
        //         to: contractAddress(init),
        //         value: 0,
        //         mode: SendRemainingValue,
        //         body: TransactionCheck{to: msg.to, amount: msg.amount}.toCell(),
        //         code: init.code,
        //         data: init.data
        //     }
        // );
    }
    
}