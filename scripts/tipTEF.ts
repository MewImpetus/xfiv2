import { Address, toNano, beginCell } from '@ton/core';
import { XFI } from '../wrappers/XFI';
import { TEF } from '../wrappers/TEF';
import { TokenVault } from '../build/XFI/tact_TokenVault';
import { TEFWallet } from '../build/TEF/tact_TEFWallet';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const agent_address = Address.parse("EQDnjzyoV7fWSh6TrpC-U1BGLBBvOCXogdCy8kl4nvLlvFQg");
    const tef_master_address = Address.parse("0QDJ_8-DRLoS9IogLyjoDuh3bGFSLobfQPGT4TfjNi1lmCx5");


    const xFI = provider.open(XFI.fromAddress(agent_address));
    const tEF = provider.open(TEF.fromAddress(tef_master_address))


    const vaultContract = await xFI.getGetVaultAddress(Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs"))
    const my_vault_contract = provider.open(TokenVault.fromAddress(vaultContract))
    const vaultWalletContract = await tEF.getGetWalletAddress(vaultContract)
    const my_vault_wallet = provider.open(TEFWallet.fromAddress(vaultWalletContract))
    let my_vault_balance = (await my_vault_wallet.getGetWalletData()).balance

    console.log(my_vault_balance)

    await my_vault_contract.send(
        provider.sender(),
        {
            value: toNano('1'),
        },
        {
            $$type: "Tip",
            query_id: 0n,
            amount: toNano(2000),
            destination: Address.parse("UQAQIFfuMdPuWacwN93eD-jJU9f8uUpjAGE1HGtiHyM7274s"),
            response_destination: Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs"),
            forward_payload: beginCell().endCell()
        }
    );

    ui.write('Waiting for send...');

    ui.write('successfully!');
}
