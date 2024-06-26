import { Address, toNano, Cell, beginCell, Slice } from '@ton/core';
import { XFI } from '../wrappers/XFI';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("EQDhthruapwuo_Lx96MW2tNBx6RYOEvHz7q1pSXrUR4M_dup");


    const xFI = provider.open(XFI.fromAddress(address));

    // 发送挖矿消息
    let cell2: Cell = beginCell()
        .storeUint(172282571249944562391355093940656328312n, 128)
        .storeUint(0, 1).endCell();

    let cell1: Cell = beginCell().storeRef(cell2)
        .storeUint(144943127676063095663117939959419744222n, 128)
        .storeUint(0, 1).endCell();

    // await xFI.send(
    //     provider.sender(),
    //     {
    //         value: toNano('3'),
    //     },
    //     {
    //         $$type: "UserMint",
    //         index: 123n,
    //         to: Address.parse("EQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWI3p"),
    //         amount: toNano(10000),
    //         proof: cell1,
    //         proof_length: 2n,
    //         to_str: "UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs",
    //     }
    // );

    // await xFI.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     {
    //         $$type: "MerkleAdmin",
    //         value: Address.parse("EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi")
    //     }
    // );

    const mint_config = await xFI.getGetMintConfig()
    console.log(mint_config)

    ui.write('Waiting for send...');

    console.log(Address.parse("EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi"))
    console.log(mint_config.admin)

    ui.write('successfully!');
}
