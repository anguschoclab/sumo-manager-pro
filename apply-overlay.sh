#!/usr/bin/env bash
set -e
echo "Applying Duelmasters Sprint 4 delta overlay..."
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# No-op: this archive is meant to be extracted into project root.
# Provide friendly message.
echo "1) Ensure this .zip was extracted into your project root."
echo "2) Run: npm i @radix-ui/react-badge"
echo "3) Run: npm run dev"
echo "Done."