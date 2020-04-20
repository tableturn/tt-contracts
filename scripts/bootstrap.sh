#!/bin/bash
set -e
dir=$(dirname "$0")
source $dir/_functions.sh

if [ "$NETWORK_ID" = "5777" ]; then
  echo "WARNING: As you're using the development environment this script will now erase the previous ZOS session and artifact files."
  rm -rf .openzeppelin/.session .openzeppelin/dev-5777.json
fi

# Deploy logic contracts.
# yarn build
yarn oz push $zosArgs --skip-compile

# Deploy the Access contract.
yarn oz deploy Access $zosDeployArgs $GOVERNOR
access=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Access\"][0].address")

#  Deploy the Registry contract.
yarn oz deploy Registry $zosDeployArgs "$access"
registry=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Registry\"][0].address")

# Deploy the Register contract.
yarn oz deploy Register $zosDeployArgs "$registry"
register=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Register\"][0].address")

# Deploy the Transact contract.
yarn oz deploy Transact $zosDeployArgs "$registry"

# Deploy the Token contract.
yarn oz deploy Token $zosDeployArgs "$registry"

# Finalize our development chain.
yarn truffle exec scripts/finalize.js --network $NETWORK
