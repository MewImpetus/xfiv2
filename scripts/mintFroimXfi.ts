import { Address, toNano, Cell, beginCell, Slice } from '@ton/core';
import { XFI } from '../wrappers/XFI';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("kQBf8d-Z56E_059n2sox-qgsWLWb8lkvF3GNPfbmoCjJAfZ9");


    const xFI = provider.open(XFI.fromAddress(address));

    // 发送挖矿消息
    let cell2: Cell = beginCell()
        .storeUint(172282571249944562391355093940656328312n, 128)
        .storeUint(1, 1).endCell();

    let cell1: Cell = beginCell().storeRef(cell2)
        .storeUint(144943127676063095663117939959419744222n, 128)
        .storeUint(1, 1).endCell();

    await xFI.send(
        provider.sender(),
        {
            value: toNano('1'),
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

    ui.write('Waiting for send...');

    ui.write('successfully!');
}
