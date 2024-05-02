import { Address, toNano, Cell, beginCell, Slice } from '@ton/core';
import { TEF } from '../wrappers/TEF';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("EQDKU58NDun_wXcQ3GeS8tdYzfvHEG6rOLheJhmmThXZILG1");


    const hub = provider.open(TEF.fromAddress(address));

    await hub.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        "Genesis"
    )


    ui.write('Waiting for send...');

    ui.write('successfully!');
}
