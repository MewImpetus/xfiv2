import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import { XFI } from '../wrappers/XFI';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";

describe('XFI', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let cat: SandboxContract<TreasuryContract>;
    let xFI: SandboxContract<XFI>;

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

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and xFI are ready to use
    });
});
