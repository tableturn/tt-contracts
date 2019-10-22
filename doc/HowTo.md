# TT Contracts How-To

## Generalities

There are a few things to keep in mind regarding the architecture of this app.

### Registry Contract

First and foremost, the `Registry` contract keeps track of what is the latest and up-to-date contracts addresses. Querying for the addresses is trivial, so relying on it is highly encouraged.

For example, to get the address of the `Access` contract, simply call `Registry.access/0`.

### Register Contract

We use this contract to publish arbitrary hashes to the chain (For example hashes proving that something has happenned at a certain time). The `Register` contract exposes methods to add, remove and test whether or not a hash has been published.

### Access Contract

The `Access` contract keeps track of ACLs. There are a few roles already defined, such as `issuer`, `governor` and `actor`.

These roles can be queried by calling their respective list getters on the contract, (Eg such as `Accessactors/0`).

There's also a governance function per type of role to add and remove them from the ACLs, (Eg such as `AccessaddActor/1` and `Access.removeActor/1`).

It is possible to query whether or not a given address has a certain role as well (Eg by calling `AccessisActor/1`).

### Token Contract

The `Token` contract complies to the ERC20 standard using 6 decimal places.

Note that that since the CVDS is permissioned, calling `Token.transfer/2` won't immediatelly transfer the funds to the recipient. Instead, it will create a transfer request for a governor to approve or reject. See the `Transact` contract for more information about this topic.

## Token Transfer Flow

There are two different ways to perform a transfer based on who is performing it.

- Normal transfer, during which the entity performing the transaction transfers from their own wallet directly using `transfer/2`.
- Delegated transfer, during which the entity performing the transaction transfers on behalf of someone else using `transferFrom/3`. This method requires pre-approval from the owner of the funds.

Either way, using these methods creates a transfer order and the funds aren't immediatelly transfered. A member of the Review Committee would then need to either approve or reject the transfer. During that time, the funds still belong to their original owner, but are "frozen" - a state very similar to an escrow.

At this point, the Review Committee member can either:

1. Approve the transfer (Using `Transact.approve/2`) in which case the funds will clear and be credited to the recipient.
1. Reject the transfer (Using `Transact.reject/2`) in which case the funds will be thawed and credited back to their original owner.

Because of this mechanic, anyone who initiated a transfer request must contact the review committee and provide them with the address from which the funds shall be transfered (In use case 1 it's their own address, in use case 2 it's the owner address) as well as the transfer ID they would like to be reviewed.

## Chains

### Staging Chain (Dev)

Our staging chain is running with the following information:

- Address: `https://chain.dev.consilienceventures.com`.
- Genesis block can be [found here](genesis.18021981.json).
- Network ID: `18021981`.

Important contracts information can be found below.

| Name     | Proxy                                        | Implementation                               |
| -------- | -------------------------------------------- | -------------------------------------------- |
| Registry | `0xC881cc4dA74d63EEe3aBDF17b0e124A2150801dB` | `0x7491B398d56aB47389c01Bcd87Bfec3E83B95ab2` |
| Access   | `0xba2CC6707D46358ced394924BA587e4AfedeA576` | `0x8a8366cf9098877296A3906DC2b0E483aEd2BcF8` |
| Register | `0xcd19Af4c2063BEA5826F892F6D49CEeb22979567` | `0x24Ac369F8d8EAEf4d07a31ab7b604D0582240320` |
| Transact | `0x117d5fbEe148a375C99366E2D22b3FbECD9771A0` | `0x5F92F5E183e38F7e9452f0d155bb788E7411B318` |
| Token    | `0xD4d8f5eb143458f21495447901Aa8309cE92E947` | `0xc0D408E8B83cea560360E3Ce3d588b6e7a3f2795` |

### Production Chain (Prod)

Our production chain is running with the following information:

- Address: `https://chain.consilienceventures.com`.
- Genesis block can be [found here](genesis.18021982.json).
- Network ID: `18021982`.

Important contracts information can be found below.

| Name     | Proxy                                        | Implementation                               |
| -------- | -------------------------------------------- | -------------------------------------------- |
| Registry | `0x7e80AfF28E1D41BF815e308f63004d1464c3B188` | `0xbe93DFEf0276c2ddbb1C6c10c4507Bd2C8599FE2` |
| Access   | `0x766cAa49B1ed4298c36347Ef243A7E0D41957729` | `0x11E8Fb7ED74B501Ad48EeDdcCC48ec22dCaF9edf` |
| Register | `0xbC12e2d0085F9EC1664c27d2441C8B161B658bde` | `0xf9eA42E95d69089E190504dD6652aE0EAd74CD11` |
| Transact | `0x258028EF7e34cee3dd7f3b547dcE4E24b4cFB472` | `0x9f299c1BE98097E7e8288A6bDfa3D9d905b45e00` |
| Token    | `0xbA73dD43546Dc438d30Fa91fc05159F2f3AF1052` | `0x4a087dF21dc93881871c93dc98709bd099331B08` |
