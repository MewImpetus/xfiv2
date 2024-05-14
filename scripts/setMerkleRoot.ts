import { Address, toNano } from "@ton/core";
import { TonClient4, WalletContractV4 } from "@ton/ton";
import { XFI } from '../wrappers/XFI';
import { mnemonicToPrivateKey } from "@ton/crypto";

const Sleep = (ms: number)=> {
    return new Promise(resolve=>setTimeout(resolve, ms))
}

(async () => {
    const client = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com", // Test-net API endpoint
    });

    const mnemonic = "your 24 secret words";  // 你的24个钱包助记词
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    
    // open wallet and read the current seqno of the wallet
    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);

    // open the contract address
    let admin = Address.parse("EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi");

    let contract = XFI.fromAddress(Address.parse("EQDhthruapwuo_Lx96MW2tNBx6RYOEvHz7q1pSXrUR4M_dup"));
    let xfi = client.open(contract);

    // send message to contract
    await xfi.send(walletSender, 
        { value: toNano("0.1") }, 
        {
            $$type: "MerkleRoot",
            value: "asfasfada23478129471asfasd78asd72342afsa"  // root hash
        });
    
    await Sleep(3000);
    console.log("Mint Config: " + (await xfi.getGetMintConfig()));
})();
