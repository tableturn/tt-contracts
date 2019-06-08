#!/bin/bash
set -e

function bump {
  version=$1
  if [[ "$version" == *.* ]]; then
      majorpart="${version%.*}."
  else
      majorpart=""
  fi
  minorpart="${version##*.}"
  echo "$majorpart$((minorpart+1))"
}

# Change these based on the accounts at hand.
zosArgs="--verbose --network $NETWORK"
zosArtifacts="zos.dev-${NETWORK_ID}.json"
version=$(cat zos.json | jq -r ".version")

echo "Operating on:"
echo "  Network: $NETWORK"
echo "  Network ID: $NETWORK_ID"
echo "  Artifacts: $zosArtifacts"
echo "  Deployer: $DEPLOYER"
echo "  Governor: $GOVERNOR"
echo "  Version: $version"

# Make a session.
rm -f .zos.session
yarn zos session --timeout 30 --expires 7200 --from $DEPLOYER $zosArgs
