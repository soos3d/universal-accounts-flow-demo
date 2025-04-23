# Universal Accounts Flow Demo

A Next.js application demonstrating Universal Accounts powered by Particle Network, focusing on seamless cross-chain USDC and USDT deposits. This demo showcases how users can deposit tokens from various chains directly into an application on Arbitrum without manual bridging.

## Features

- 🔐 MetaMask Wallet Integration
- 💱 Cross-chain USDC/USDT Deposits
- 🌉 Automatic Cross-chain Bridging
- 🚀 Instant Token Reception
- 🎯 Simplified User Experience

## Tech Stack

- Next.js 14
- TypeScript
- Universal Account SDK (@GDdark/universal-account)
- Ethers.js v6
- Tailwind CSS
- Radix UI Components

## Getting Started

### Prerequisites

- Node.js >= 18
- Yarn package manager

### Installation

1. Clone the repository
2. Copy the environment variables:
   ```bash
   cp .env.sample .env
   ```
3. Update the `.env` file with your credentials
4. Install dependencies:
   ```bash
   yarn install
   ```

### Development

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:

```bash
yarn build
```

Start the production server:

```bash
yarn start
```

## Environment Variables

Make sure to set up the following environment variables in your `.env` file:

- `NEXT_PUBLIC_UA_PROJECT_ID`: Your Universal Account project ID

## License

This project is private and proprietary. All rights reserved.