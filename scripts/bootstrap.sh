#!/bin/bash
set -e
dir=$(dirname "$0")
source $dir/_functions.sh

if [ "$NETWORK_ID" = "5777" ]; then
  echo "WARNING: As you're using the development environment this script will now erase the previous ZOS session and artifact files."
  rm -rf .openzeppelin/.session .openzeppelin/dev-5777.json
fi

# Deploy logic contracts.
yarn build
yarn oz push $zosArgs --skip-compile

# Instanciate the access contract.
yarn oz deploy Access --skip-compile --kind upgradeable --network $NETWORK # --no-interactive
access=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Access\"][0].address")

register=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Register\"][0].address")
# Instanciate the registry contract.
yarn oz deploy Registry --skip-compile --init initialize $zosArgs --args "$access"
registry=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Registry\"][0].address")

# Instanciate the register contract.
yarn oz deploy Register --skip-compile --init initialize $zosArgs --args "$registry"
# Instanciate the transact contract.
yarn oz deploy Transact --skip-compile --init initialize $zosArgs --args "$registry"
# Instanciate the token contract.
yarn oz deploy Token --skip-compile --init initialize $zosArgs --args "$registry"

yarn truffle exec scripts/finalize.js --network $NETWORK
