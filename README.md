# DeFix - Civic Problem Solving on Aptos

<div align="center">
  <img src="/public/favicon.png" alt="DeFix Logo" width="150" />
  <p><em>Empowering communities through decentralized civic problem-solving</em></p>
</div>

## 📋 Project Description

DeFix is a revolutionary decentralized platform built on the Aptos blockchain that transforms how communities identify, report, and solve local civic issues. By harnessing blockchain technology, DeFix creates a transparent, efficient, and incentivized ecosystem where:

- Citizens can report local problems with verifiable evidence
- Community members can propose and validate solutions
- Stakeholders vote on the most effective fixes
- Rewards are automatically distributed to successful problem-solvers
- The entire process is tracked immutably on the blockchain

This platform bridges the gap between identifying civic problems and implementing effective solutions by creating financial incentives for fixing issues that affect community wellbeing.

## 🚀 Project Vision

Our vision is to empower communities to take ownership of their local environments through collaborative problem-solving. DeFix aims to:

1. **Decentralize civic improvement** by removing traditional bureaucratic barriers
2. **Incentivize public service** through a transparent reward system
3. **Build community engagement** around shared local challenges
4. **Create accountability** through immutable problem and solution tracking
5. **Accelerate issue resolution** by connecting problems directly with solvers

By bridging the gap between citizens and local governance, DeFix creates a self-sustaining ecosystem where civic engagement is rewarded and public spaces are continually improved through decentralized coordination.

## ✨ Key Features

- **Decentralized Problem Reporting**
  - Detailed reports with titles, descriptions and categories
  - Location mapping with precise coordinates
  - Evidence upload to IPFS with immutable storage
  - Bounty setting for incentivizing solutions

- **Interactive Map Interface**
  - Geolocation-based visualization of problems
  - Filtering by status, bounty size, and category
  - Color-coded problem indicators by status
  - Responsive design for mobile and desktop

- **Blockchain-Verified Solutions**
  - Transparent solution proposals
  - Evidence uploading for solution verification
  - Immutable record of all proposed solutions
  - Traceability of solution history

- **Community Voting System**
  - Democratic selection of the best solutions
  - One-wallet-one-vote to prevent manipulation
  - Transparent vote counting
  - Time-limited voting periods

- **Automated Bounty Distribution**
  - Smart contract-managed reward system
  - Automatic transfer to solution providers
  - Escrow protection for funds
  - Optional tip functionality

- **Web3 Integration**
  - IPFS storage for decentralized data
  - Petra Wallet connectivity
  - Transaction signing and verification
  - Custom Move contract interactions

## 🔮 Future Scope

- **DAO Governance**
  - Community voting on platform parameters
  - Decentralized treasury management
  - Proposal system for platform improvements
  - Token-based governance rights

- **Reputation System**
  - Solver trust profiles based on history
  - Problem reporter credibility scores
  - Achievement badges for civic contributions
  - Social verification of identities

- **Enhanced Integrations**
  - Municipal data API connections
  - Open311 standard compatibility
  - Weather and environmental data feeds
  - Integration with civil service ticketing systems

- **Extended Platform Support**
  - Native mobile applications
  - Offline functionality with syncing
  - Multi-language support
  - Accessibility improvements

- **Technical Expansions**
  - Multi-chain deployment options
  - Layer 2 scaling solutions
  - AI-assisted problem categorization
  - Predictive analytics for civic planning

## 📝 Contract Details

The DeFix platform is powered by a custom Move language smart contract on the Aptos blockchain:

- **Contract Name**: `ProblemRegistry`
- **Repository Path**: `/contracts/sources/ProblemRegistry.move`
- **Networks**: Compatible with Aptos Testnet and Mainnet
- **Core Functions**:
  - `create_problem`: Register new civic issues with metadata
  - `propose_solution`: Submit potential fixes to problems
  - `vote_solution`: Cast votes for preferred solutions
  - `release_bounty`: Transfer rewards to solution providers

- **Data Structures**:
  - `Problem`: Contains issue details, location, and bounty
  - `Solution`: Holds proposed fixes with evidence
  - `Vote`: Records community preferences
  - `Registry`: Manages global problem tracking

## 🏗️ Project Structure

```
civic-resolve-chain/
├── contracts/                  # Aptos Move smart contracts
│   ├── Move.toml               # Contract dependencies
│   └── sources/                # Contract source files
│       └── ProblemRegistry.move # Main smart contract
│
├── public/                     # Static assets
│   ├── favicon.png             # Project icon
│   └── ...                     # Other static files
│
├── src/
│   ├── components/             # React components
│   │   ├── maps/               # Map-related components
│   │   │   ├── LocationSearch.tsx # Location search functionality
│   │   │   └── MapPicker.tsx    # Map selection component
│   │   │
│   │   ├── problems/           # Problem-related components
│   │   │   ├── ProblemForm.tsx  # Problem creation form
│   │   │   └── ProblemList.tsx  # Problem listing component
│   │   │
│   │   ├── wallet/             # Blockchain integration
│   │   │   └── WalletConnect.tsx # Wallet connection component
│   │   │
│   │   ├── theme/              # UI theming
│   │   └── ui/                 # Reusable UI components
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── use-mobile.tsx      # Mobile detection hook
│   │
│   ├── utils/                  # Utility functions
│   │   ├── aptos.ts            # Aptos blockchain interactions
│   │   ├── geocoding.ts        # Location services
│   │   ├── ipfs.ts             # IPFS storage functions
│   │   └── store.ts            # Local state management
│   │
│   ├── pages/                  # Page components
│   │   ├── Index.tsx           # Main landing page
│   │   ├── ProblemDetail.tsx   # Problem details page
│   │   └── NotFound.tsx        # 404 page
│   │
│   ├── App.tsx                 # Main application component
│   └── main.tsx                # Application entry point
│
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
└── SETUP_GUIDE.md              # Detailed setup instructions
```

## 🚀 Getting Started

To work with the DeFix codebase:

```sh
# Clone the repository
git clone https://github.com/yourusername/civic-resolve-chain.git

# Navigate to project directory
cd civic-resolve-chain

# Install dependencies
npm install

# Start development server
npm run dev
```

For detailed setup instructions including smart contract deployment, configuration options, and deployment guides, please refer to the [SETUP_GUIDE.md](SETUP_GUIDE.md) file.

## 🔧 Technologies

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **Blockchain**: Aptos, Move language
- **Storage**: IPFS via NFT.Storage
- **Maps**: Leaflet.js for interactive maps
- **Wallet**: Petra Wallet integration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <p>
    <strong>DeFix</strong> - Building better communities through decentralized problem-solving
  </p>
  <p>
    <a href="https://github.com/yourusername/civic-resolve-chain">GitHub</a> •
    <a href="SETUP_GUIDE.md">Setup Guide</a>
  </p>
</div>
#
