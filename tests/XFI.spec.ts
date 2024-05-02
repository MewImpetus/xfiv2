import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, Cell, beginCell } from '@ton/core';
import { XFI } from '../wrappers/XFI';
import { TransactionValidator } from '../build/XFI/tact_TransactionValidator';
import { TokenVault } from '../build/XFI/tact_TokenVault';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { TEF } from '../wrappers/TEF';
import { TEFWallet } from '../build/TEF/tact_TEFWallet';

describe('XFI', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let cat: SandboxContract<TreasuryContract>;
    let xFI: SandboxContract<XFI>;
    let tV: SandboxContract<TransactionValidator>;
    let TokenVault: SandboxContract<TokenVault>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');
        cat = await blockchain.treasury('cat');

        const jettonParams = {
            name: "jettonMaster1",
            description: "jettonMaster (TEF) is an innovative social media mining platform that aims to provide social media users with a share to earn channel by combining AI technology and blockchain token economics.",
            symbol: "TEF",
            image: "https://raw.githubusercontent.com/MewImpetus/xfi/main/logo.png",
        };

        const content = buildOnchainMetadata(jettonParams);

        xFI = blockchain.openContract(await XFI.fromInit(content, {
            $$type: "MintConfig",
            merkle_root: "147596663615302291649424969521479109454",
            set_at: 0n,
            set_interval: 24n,
            admin: alice.address,
            max_mint_today: toNano(10000000),
            minted_today: 0n,
        }));




        const deployResult = await xFI.send(
            deployer.getSender(),
            {
                value: toNano('2'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: xFI.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and xFI are ready to use
    });

    it('test manage the tef', async () => {

        const masterBefore = await xFI.getGetJettonMaster()
        expect(masterBefore.toString()).toEqual(deployer.address.toString());

        const masterdeployResult = await xFI.send(
            deployer.getSender(),
            {
                value: toNano('1.5'),
            },
            "deploy jetton master"
        );


        expect(masterdeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: xFI.address,
            success: true,
        });


        const masterAfter = await xFI.getGetJettonMaster()
        // Ensure that the address has changed and the master address has been saved.
        expect(masterAfter.toString()).not.toEqual(masterBefore)

        // Ensure that the main contract address is consistent with the master administrator address.
        const myaddress = await xFI.getGetMyaddress()
        expect(myaddress.toString()).toEqual(xFI.address.toString());


        // Send mining message.
        let cell2: Cell = beginCell()
            .storeUint(172282571249944562391355093940656328312n, 128)
            .storeUint(1, 1).endCell();

        let cell1: Cell = beginCell().storeRef(cell2)
            .storeUint(144943127676063095663117939959419744222n, 128)
            .storeUint(1, 1).endCell();

        const mintResult = await xFI.send(
            deployer.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: "UserMint",
                index: 123n,
                to: Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs"),
                amount: toNano(10000),
                proof: cell1,
                proof_length: 2n,
                to_str: "UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs",
            }
        );

        // 1. deployer -> xfi
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: xFI.address,
            success: true,
        });

        const res = await xFI.getTestmint({
            $$type: "UserMint",
            index: 123n,
            to: Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs"),
            amount: toNano(10000),
            proof: cell1,
            proof_length: 2n,
            to_str: "UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs",
        })

        // 2.  xfi -> uniqueness verification
        const exist_check_address = await xFI.getGetTransactionValidatorAddress(123n)
        expect(mintResult.transactions).toHaveTransaction({
            from: xFI.address,
            to: exist_check_address,
            success: true,
        });

        // Ensure the contract is created and the txid is set.
        const tV =  blockchain.openContract(TransactionValidator.fromAddress(exist_check_address));
        const txid = await tV.getGetTxid()
        expect(txid).toEqual(123n)
        const pass = await tV.getGetPass()
        expect(pass).toEqual(false)
        const parent = await tV.getGetParent()
        expect(parent.toString()).toEqual(xFI.address.toString())

        // 3. niqueness verification contract -> xfi
        expect(mintResult.transactions).toHaveTransaction({
            from: exist_check_address,
            to: xFI.address,
            success: true,
        });

        // 4. xfi -> master
        expect(mintResult.transactions).toHaveTransaction({
            from: xFI.address,
            to: masterAfter,
            success: true,
        });

        // 5. master contract -> the target wallet address.
        const tEF = blockchain.openContract(TEF.fromAddress(masterAfter))
        const targetWalletAddress = await tEF.getGetWalletAddress(Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs"));
        expect(mintResult.transactions).toHaveTransaction({
            from: masterAfter,
            to: targetWalletAddress,
            success: true,
        });

        // 6. xfi -> vault  for deploy
        const vaultContractAddress = await xFI.getGetVaultAddress(Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs"))
        expect(mintResult.transactions).toHaveTransaction({
            from: xFI.address,
            to: vaultContractAddress,
            success: true,
        });

        //7. master -> vault
        const vaultWallet = await tEF.getGetWalletAddress(vaultContractAddress)
        expect(mintResult.transactions).toHaveTransaction({
            from: masterAfter,
            to: vaultWallet,
            success: true,
        });

        // check balance
        const targetJettonContract = blockchain.openContract(TEFWallet.fromAddress(targetWalletAddress));
        const targetBalance = (await targetJettonContract.getGetWalletData()).balance;
        expect(targetBalance).toEqual(5000000000000n)

        const vaultJettonContract = blockchain.openContract(TEFWallet.fromAddress(vaultWallet));
        const vaultBalance = (await vaultJettonContract.getGetWalletData()).balance;
        expect(vaultBalance).toEqual(5000000000000n)

        //  8. excess deployer
        expect(mintResult.transactions).toHaveTransaction({
            from: vaultWallet,
            to: deployer.address,
            success: true,
        });

        expect(mintResult.transactions).toHaveTransaction({
            from: targetWalletAddress,
            to: deployer.address,
            success: true,
        });
       


    });
});
