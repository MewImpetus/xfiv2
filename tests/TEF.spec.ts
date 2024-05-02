import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TEF } from '../wrappers/TEF';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";

describe('TEF', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tEF: SandboxContract<TEF>;

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
});
