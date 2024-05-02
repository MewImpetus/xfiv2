import { toNano, Address } from '@ton/core';
import { TEF } from '../wrappers/TEF';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from "../utils/jetton-helpers";

export async function run(provider: NetworkProvider) {

    const jettonParams = {
        name: "jettonMaster1",
        description: "jettonMaster (TEF) is an innovative social media mining platform that aims to provide social media users with a share to earn channel by combining AI technology and blockchain token economics.",
        symbol: "TEF",
        image: "https://raw.githubusercontent.com/MewImpetus/xfi/main/logo.png",
    };
    const content = buildOnchainMetadata(jettonParams);


    const tEF = provider.open(await TEF.fromInit(
        Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs"),
        content,
    ));

    await tEF.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(tEF.address);

    // run methods on `tEF`
}
