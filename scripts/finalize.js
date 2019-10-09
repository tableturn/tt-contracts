const fs = require('fs')
const BN = require('bn.js')
const utilsGenerator = require('./scripts/utils.js')

const Registry = artifacts.require('Registry')
const Access = artifacts.require('Access')
const Register = artifacts.require('Register')
const Transact = artifacts.require('Transact')
const Token = artifacts.require('Token')

module.exports = async done => {
  try {
    // Load ZOS ABI.
    const netId = await web3.eth.net.getId()
    console.log(`Using network id ${netId}.`)
    const zosFile = `.openzeppelin/dev-${netId}.json`
    const zosAbi = JSON.parse(fs.readFileSync(zosFile))
    console.log(`Loaded ZOS ABIs.`)

    // Prepare some addresses.
    const { issuer, pk2m, pierre, kevin } = require(`../conf/people.${netId}`)
    const governance = { from: pk2m }
    const issuance = { from: issuer }
    // Load contracts.
    const registry = await Registry.at(zosAbi.proxies[`TTContracts/Registry`][0].address)
    const access = await Access.at(zosAbi.proxies[`TTContracts/Access`][0].address)
    const register = await Register.at(zosAbi.proxies[`TTContracts/Register`][0].address)
    const transact = await Transact.at(zosAbi.proxies[`TTContracts/Transact`][0].address)
    const token = await Token.at(zosAbi.proxies[`TTContracts/Token`][0].address)

    const {   convert,   issue,   promoteActor,   promoteGovernor,   promoteIssuer,   registerContract } = utilsGenerator(registry, access, register, transact, token)

    console.log('Registering contracts with Registry...')

    await registerContract('Access', await registry.access(), access.address, governance)
    await Promise.all([
      registerContract('Register', await registry.register(), register.address, governance),
      registerContract('Transact', await registry.transact(), transact.address, governance),
      registerContract('Token', await registry.token(), token.address, governance)
    ])

    await Promise.all([promoteActor(pk2m, pk2m), promoteIssuer(pk2m, issuer)])

    if (netId !== 18021982) {
      console.log('This is not production - making a few staging actors and governors...')
      await Promise.all([
        promoteGovernor(pk2m, pierre),
        promoteActor(pk2m, pierre),
        promoteActor(pk2m, kevin)
      ])

      const balance = await token.balanceOf(pk2m)
      console.log(`PK2M Balance: ${balance.toString()}.`)
      if (balance.eq(new BN(0))) {
        console.log(`Allocating tokens to ${pk2m} for Year 1 of operational costs.`)
        await issue('1_121_010', 'Operational costs for 2019', issuance)
        await token.allocate(pk2m, convert('1_121_010'), governance)

        console.log(`Transfering tokens from ${pk2m} to an actor account.`)
        await token.transfer(kevin, convert('6050'), { from: pk2m })
        console.log(`Approving transfer...`)
        await transact.approve(pk2m, 0, { from: pierre })
      }
    }

    console.log(`All done. Informations about network ${netId}:`)
    console.log(`  Registry is at ${registry.address}`)
    console.log(`  Access is at ${access.address}`)
    console.log(`  Transact is at ${transact.address}`)
    console.log(`  Token is at ${token.address}`)
  } catch (e) {
    console.log(e)
  }
  done()
}
