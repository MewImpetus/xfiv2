import { toNano, Address } from '@ton/core';
import { XFI } from '../wrappers/XFI';
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

    const xFI = provider.open(await XFI.fromInit(content, {
        $$type: "MintConfig",
        merkle_root: "147596663615302291649424969521479109454",
        set_at: 0n,
        set_interval: 24n,
        admin: Address.parse("UQAVWJbfEIGvKOht-utclCtzpnitbaWm70HwRa24NoTpUJ9C"),
        max_mint_today: toNano(10000000),
        minted_today: 0n,
    }));

    await xFI.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(xFI.address);

    // run methods on `xFI`

    await xFI.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        "deploy jetton master"
    );

}
