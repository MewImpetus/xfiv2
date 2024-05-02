import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TEF } from '../wrappers/TEF';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { TEFWallet, JettonBurn } from '../build/TEF/tact_TEFWallet';

describe('TEF', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tEF: SandboxContract<TEF>;
    let tEFWakket: SandboxContract<TEFWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');


        const jettonParams = {
            name: "Teetefi",
            description: "jettonMaster (TEF) is an innovative social media mining platform that aims to provide social media users with a share to earn channel by combining AI technology and blockchain token economics.",
            symbol: "TEF",
            image: "https://raw.githubusercontent.com/MewImpetus/xfi/main/logo.png",
        };
        const content = buildOnchainMetadata(jettonParams);

        tEF = blockchain.openContract(await TEF.fromInit(
            deployer.address,
            content
        ));



        const deployResult = await tEF.send(
            deployer.getSender(),
            {
                value: toNano('5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tEF.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tEF are ready to use
    });

    it('genesis', async () => {
        // frist should success
        let mintyResult = await tEF.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            "Genesis"
        );

        expect(mintyResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tEF.address,
            success: true,
        });


        // Check that JettonMaster send 1 token to deployer's jetton wallet
        const deployerWalletAddress = await tEF.getGetWalletAddress(deployer.address);
        expect(mintyResult.transactions).toHaveTransaction({
            from: tEF.address,
            to: deployerWalletAddress,
            success: true,
        });

        // Check that deployer's jetton wallet send JettonExcesses msg to deployer
        expect(mintyResult.transactions).toHaveTransaction({
            from: deployerWalletAddress,
            to: deployer.address,
            success: true,
        });

        // second should be failed
        mintyResult = await tEF.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            "Genesis"
        );


        expect(mintyResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tEF.address,
            success: false,
        });

        // Check that deployer's jetton wallet balance is 1
        const deployerJettonContract = blockchain.openContract(TEFWallet.fromAddress(deployerWalletAddress));
        const deployerBalanceAfter = (await deployerJettonContract.getGetWalletData()).balance;

        expect(deployerBalanceAfter).toEqual(1100000000n);

    });


    it('should deployer burn 1 token', async () => {
        // Mint 1 token to deployer first to build her jetton wallet
        const mintyResult = await tEF.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            "Genesis"
        );

        const jettonBurn: JettonBurn = {
            $$type: 'JettonBurn',
            query_id: 0n,
            amount: 1n,
            response_destination: deployer.address,
            custom_payload: null,
        };

        // deployer's jetton wallet address
        const deployerWalletAddress = await tEF.getGetWalletAddress(deployer.address);
        // deployer's jetton wallet
        const deployerJettonContract = blockchain.openContract(TEFWallet.fromAddress(deployerWalletAddress));
        // deployer's jetton wallet balance before burning
        const deployerBalanceBefore = (await deployerJettonContract.getGetWalletData()).balance;

        // deployer burn 1 token
        const burnResult = await deployerJettonContract.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            jettonBurn
        );
        //printTransactionFees(burnResult.transactions);

        // Check that deployer send JettonBurn msg to her jetton wallet
        expect(burnResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: deployerWalletAddress,
            success: true,
        });

        // Check that deployer's jetton wallet send JettonBurnNotification msg to JettonMaster
        expect(burnResult.transactions).toHaveTransaction({
            from: deployerWalletAddress,
            to: tEF.address,
            success: true,
        });

        // Check that JettonMaster send JettonExcesses msg to deployer
        expect(burnResult.transactions).toHaveTransaction({
            from: tEF.address,
            to: deployer.address,
            success: true,
        });

        // Check that deployer's jetton wallet balance is subtracted 1
        const deployerBalanceAfter = (await deployerJettonContract.getGetWalletData()).balance;
        expect(deployerBalanceAfter).toEqual(deployerBalanceBefore - 1n);
    });

});