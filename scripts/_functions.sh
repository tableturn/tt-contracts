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
zosArgs="--no-interactive --network $NETWORK"
zosDeployArgs="$zosArgs --skip-compile --kind upgradeable"
zosArtifacts=".openzeppelin/dev-${NETWORK_ID}.json"
version=$(cat .openzeppelin/project.json | jq -r ".version")

echo "Operating on:"
echo "  Network: $NETWORK"
echo "  Network ID: $NETWORK_ID"
echo "  Artifacts: $zosArtifacts"
echo "  Deployer: $DEPLOYER"
echo "  Governor: $GOVERNOR"
echo "  Version: $version"

# Make a session.
rm -f .zos.session
yarn oz session --timeout 30 --blockTimeout 50 --expires 7200 --from $DEPLOYER $zosArgs
