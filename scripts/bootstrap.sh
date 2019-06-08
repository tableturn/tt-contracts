#!/bin/bash
set -e
dir=$(dirname "$0")
source $dir/_functions.sh

if [ "$NETWORK_ID" = "5777" ]; then
  echo "WARNING: As you're using the development environment this script will now"
  echo "erase the previous ZOS session and artifact files."
  rm -rf .zos.session zos.dev-5777.json
fi

# Deploy logic contracts.
yarn build
yarn zos push $zosArgs --skip-compile

# Instanciate the access contract.
yarn zos create Access --skip-compile --init initialize $zosArgs --args "$GOVERNOR"
access=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Access\"][0].address")
# Instanciate the registry contract.
yarn zos create Registry --skip-compile --init initialize $zosArgs --args "$access"
registry=$(cat $zosArtifacts | jq ".proxies[\"TTContracts/Registry\"][0].address")
# Instanciate the transact contract.
yarn zos create Transact --skip-compile --init initialize $zosArgs --args "$registry"
# Instanciate the token contract.
yarn zos create Token --skip-compile --init initialize $zosArgs --args "$registry"

yarn truffle exec scripts/finalize.js --network $NETWORK
