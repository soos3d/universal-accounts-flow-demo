# Universal Accounts Deposit Flow Demo

## Overview
This demo showcases Particle Network's Universal Accounts as a deposit flow solution for dApps. It demonstrates how Web3 applications can leverage chain abstraction to provide users with a simplified experience when moving assets across different blockchain networks.

## Purpose
The primary purpose of this demo is to illustrate how Universal Accounts can solve one of the most significant friction points in Web3: **cross-chain asset movement**. 

Traditional approaches require users to:
1. Bridge assets manually between chains
2. Pay gas fees in native tokens for each chain
3. Navigate complex UIs across different protocols
4. Wait for confirmations across multiple transactions

With Universal Accounts, this process is abstracted away, allowing users to deposit assets from any supported chain directly into a dApp operating on a different chain.

## Key Features Demonstrated

### 1. Chain Abstraction
Users can deposit assets from one chain and have them appear on another chain without manually bridging. The entire cross-chain complexity is handled behind the scenes by Particle's Universal Accounts infrastructure.

### 2. Unified User Experience
The demo presents a single interface to handle deposits from multiple chains, eliminating the need for users to interact with different bridging protocols or manage multiple wallets.

### 3. Token Conversion
Users can deposit various supported tokens (like USDC or USDT) from any chain, and receive BNB on BNB Chain in the demo app - all in a single transaction from the user perspective.

> Find the guide for this app on the [Particle Docs](https://particle.network/docs/universal-accounts/)

## Local Development Setup

### Prerequisites
- Node.js (v20 or higher)
- npm or yarn
- A Universal Accounts project ID from [Particle Network](https://particle.network)

### Installation
1. Clone the repository
```bash
git clone https://github.com/soos3d/universal-accounts-flow-demo.git
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Environment Setup
- Copy the `.env.sample` file to `.env.local`:

- Update `.env.local` with your configuration:
  - Add your Universal Accounts project ID (`NEXT_PUBLIC_UA_PROJECT_ID`)
  - (Optional) Replace RPC URLs with your own endpoints

### Running the App
```bash
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)
