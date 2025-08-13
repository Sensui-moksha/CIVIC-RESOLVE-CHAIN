# Aptos CLI Setup (Testnet)

Follow these steps locally (outside Lovable) to deploy and interact with the Move contract.

1) Install Aptos CLI
- macOS: brew install aptos
- Or universal script: curl -fsSL https://aptos.dev/scripts/install_cli.py | python3 -
- Verify: aptos --version

2) Initialize account (testnet)
- mkdir defix-contract && cd defix-contract
- Copy the `contracts/` folder from this repo here or work directly in it
- aptos init --network testnet
- Fund account: aptos account fund-with-faucet --account default

3) Configure Move package
- In contracts/Move.toml set the named address:
  [addresses]
  defix = "0xYOUR_ACCOUNT_ADDRESS"   # from aptos init output

4) Publish contract
- cd contracts
- aptos move compile
- aptos move publish --assume-yes
- Note the module address printed (same as your account). Frontend expects this as `moduleAddress`.

5) Use faucet for test APT
- aptos account fund-with-faucet --account default --amount 100000000

6) Plug address into the frontend
- Open the app, paste your module address into the "Module Address" field in the Problem form.
- Connect wallet (Petra/Martian) on testnet and post a problem.

Troubleshooting
- If publish fails due to dependencies, ensure rev=testnet in Move.toml and try again.
- Ensure Petra is on Testnet.
