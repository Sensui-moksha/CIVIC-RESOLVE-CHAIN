# DeFix: Civic Problem Solving Platform - Setup Guide

## � Introduction

This guide provides specific instructions for setting up the DeFix platform on your local environment and deploying it for public use. DeFix is a specialized application for communities to report civic problems, propose solutions, and distribute rewards using the Aptos blockchain.

## �️ Development Environment Setup

### Required Software

1. **Node.js & NPM**:
   - Install Node.js v18 or higher from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node -v && npm -v`

2. **Aptos CLI**:
   - For Windows: Download binary from [GitHub Releases](https://github.com/aptos-labs/aptos-core/releases)
   - For macOS: `brew install aptos`
   - For Linux: Use the AppImage from GitHub Releases
   - Add to PATH and verify: `aptos --version`

3. **Petra Wallet**:
   - Install from [petra.app](https://petra.app/) or Chrome Web Store
   - Create new wallet or import existing one
   - Switch network to Testnet for development

4. **Code Editor**: 
   - Visual Studio Code recommended
   - Install TypeScript and React extensions

## � Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/civic-resolve-chain.git
cd civic-resolve-chain
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Local Config
Create a `.env.local` file in the root directory:
```
VITE_IPFS_API_KEY=your_nft_storage_api_key
```

### 4. Setup IPFS Storage

You'll need an NFT.Storage account for storing problem evidence and solution images:

1. Register at [NFT.Storage](https://nft.storage/)
2. Create a new API key from the dashboard
3. Copy the API key (starts with `eyJ...`)

## 🔑 Getting API Keys

### NFT.Storage API Token

1. Visit [NFT.Storage](https://nft.storage/)
2. Sign up with your email or GitHub
3. Go to **API Keys** section
4. Create a new API key
5. Copy the token (starts with `eyJ...`)

**Token Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **Security Note**: API tokens are stored locally in your browser's localStorage for convenience. Never share your tokens.

## � Smart Contract Deployment

Follow these precise steps to deploy the DeFix smart contract to Aptos:

### 1. Set Up Aptos Account

```bash
# Initialize your Aptos account (creates ~/.aptos/config.yaml)
aptos init --network testnet

# Fund your account with test tokens
aptos account fund-with-faucet --account default
```

### 2. Compile and Publish Contract

```bash
# Navigate to the contracts directory
cd contracts

# Compile the Move contract
aptos move compile

# If compilation succeeds, publish the contract
# Replace with your actual account address
aptos move publish --named-addresses defix=0x123...your_address_here
```

### 3. Verify Deployment

```bash
# Check that your module is published
aptos account list --query modules

# Save your account address - you'll need this as the "Module Address" in the app
aptos account list | grep default
```

### 4. Store Contract Address

After successful deployment, copy your account address. You'll need to enter this as the "Module Address" when setting up the app.

## 💻 Running the Application

### Start Development Server

```bash
# Start the Vite development server
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173)

### First-Time Configuration

When you first open the application:

1. Click "Connect Wallet" and approve the connection request in Petra
2. Enter your NFT.Storage API key when prompted
3. Enter your deployed contract address (from the previous section)
4. Allow location access for the map functionality

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

## 🚀 Deployment Guide

### GitHub Pages Deployment

1. **Update Base Path**:
   
   Edit `vite.config.ts` to use your repository name:
   ```typescript
   // Change this line in vite.config.ts
   base: mode === 'production' ? '/civic-resolve-chain/' : '/',
   ```

2. **Create GitHub Action**:

   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: 18
         - name: Install dependencies
           run: npm ci
         - name: Build
           run: npm run build
         - name: Deploy
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             folder: dist
   ```

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

4. **Enable GitHub Pages**:
   - Go to repository → Settings → Pages
   - Source: GitHub Actions
   - Wait for deployment to complete

Your app will be available at: `https://yourusername.github.io/civic-resolve-chain/`

## 🧪 Testing the Application

### Manual Testing Flow

1. **Report a New Problem**:
   - Click "Report Problem" button
   - Complete the form with title, description
   - Upload a test image as evidence
   - Set a location on the map
   - Set a bounty amount (start with small amounts like 0.01 APT)
   - Submit and confirm in Petra wallet

2. **View Problems**:
   - Check that your problem appears on the map
   - Verify the problem details page loads correctly
   - Test filtering and sorting options

3. **Propose Solutions**:
   - Open a problem detail page
   - Click "Propose Solution"
   - Fill in solution details and upload proof
   - Submit and verify transaction

4. **Vote and Reward**:
   - Test voting functionality
   - Verify vote counts update correctly
   - Test reward distribution to solution providers

### Troubleshooting Common Issues

- **Transaction Error**: Check Aptos Explorer for detailed error message
- **Map Not Loading**: Clear site data and allow location permissions
- **Upload Failures**: Verify your NFT.Storage API key is valid

## ⚙️ Advanced Configuration

### Storage Provider Options

DeFix supports multiple IPFS providers:

| Provider | API Key Format | Configuration |
|----------|---------------|---------------|
| NFT.Storage (default) | Starts with `eyJ` | Enter in app or use env variable |
| Pinata | JWT format | Enter in app or use env variable |
| Web3.Storage | API token | Enter in app or use env variable |

### Network Configuration

To switch between Testnet and Mainnet, modify `src/utils/aptos.ts`:

```typescript
// For testnet (development)
const config = new AptosConfig({ network: Network.TESTNET });

// For mainnet (production)
// const config = new AptosConfig({ network: Network.MAINNET });
```

### Environment Variables

Create a `.env.local` file for local development:

```
# Required
VITE_IPFS_TOKEN=your_nft_storage_api_key

# Optional
VITE_NETWORK=testnet  # or mainnet
VITE_CONTRACT_ADDRESS=0x123...  # pre-filled contract address
```

For production, set these variables in your hosting platform.

## � Troubleshooting Guide

### Problem: "No Aptos wallet found"
**Solutions:**
- Install Petra wallet extension from [petra.app](https://petra.app)
- Ensure extension is enabled in your browser
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Check that wallet is unlocked and on the correct network

### Problem: "Transaction failed"
**Solutions:**
- Check browser console for specific error message
- Ensure wallet has sufficient APT for gas (min 0.1 APT recommended)
- Verify contract address is correct
- Try with a smaller transaction amount
- Check Aptos Explorer for transaction status

### Problem: "IPFS upload failed" 
**Solutions:**
- Verify your NFT.Storage API key is valid and not expired
- Check your internet connection
- Reduce image file size (under 5MB recommended)
- Try an alternative IPFS provider

### Problem: "Location not loading"
**Solutions:**
- Enable precise location permissions in browser settings
- Disable VPN or proxy services
- Try accessing from a different network
- Allow location access in your OS settings

### Getting Technical Support
1. Check browser developer console (F12) for error messages
2. Open an issue on GitHub with:
   - Detailed error description
   - Screenshots if applicable
   - Browser and wallet version
   - Steps to reproduce the issue

## � Project Reference

### Key Files & Directories

| Path | Purpose |
|------|---------|
| `/contracts/sources/ProblemRegistry.move` | Core smart contract for problems and solutions |
| `/src/components/maps/` | Map components for location selection |
| `/src/components/problems/` | Problem submission and display components |
| `/src/components/wallet/` | Petra wallet integration |
| `/src/utils/aptos.ts` | Aptos blockchain interaction utilities |
| `/src/utils/ipfs.ts` | IPFS storage interaction |
| `/src/utils/geocoding.ts` | Location handling utilities |

### Smart Contract Functions

| Function | Purpose |
|----------|---------|
| `create_problem` | Report a new civic problem |
| `propose_solution` | Submit a solution to a problem |
| `vote_solution` | Vote on a proposed solution |
| `release_bounty` | Send reward to solution provider |

### Frontend Architecture

DeFix uses a modern React architecture:

- **State Management**: React Context for global state
- **Data Fetching**: Custom hooks for blockchain data
- **UI Components**: shadcn/ui with Tailwind CSS
- **Routing**: React Router for navigation
- **Build System**: Vite for fast development
- **Map Integration**: Leaflet.js for interactive maps

## � Security Considerations

### Smart Contract Security
- **Move Prover**: Consider using the Move Prover tool to verify contract safety
- **Limited Testing**: Start with small bounty amounts during testing
- **Transaction Review**: Always review transaction details before signing
- **Function Access**: Use appropriate access controls in smart contract functions

### Frontend Security
- **API Key Protection**: Never commit API keys to public repositories
- **Data Validation**: Validate all user inputs before submission
- **Transaction Simulation**: Simulate transactions before submitting to network
- **Clear Cache**: Clear local storage if testing with sensitive data

### Wallet Security
- **Seed Phrase**: Store your wallet seed phrase securely offline
- **Development Account**: Use a separate development account with limited funds
- **Network Separation**: Keep development on testnet until ready for production

## � Production Considerations

### Pre-Deployment Checklist

✅ **Smart Contract**
- [ ] Contract thoroughly tested on testnet
- [ ] All functions working as expected
- [ ] Gas optimization implemented
- [ ] Security review completed

✅ **Frontend**
- [ ] Build optimization enabled
- [ ] Images and assets compressed
- [ ] Error handling for all API calls
- [ ] Mobile responsiveness tested

✅ **Documentation**
- [ ] User guide completed
- [ ] API documentation updated
- [ ] Contract functions documented
- [ ] Deployment process documented

### Deployment Options

| Platform | Advantages | Setup Time |
|----------|------------|------------|
| GitHub Pages | Free, simple integration | 10-15 minutes |
| Vercel | Zero-config, previews | 5-10 minutes |
| Netlify | Easy form handling | 5-10 minutes |
| Self-hosted | Full control | 30+ minutes |

### Mainnet Deployment

Before deploying to mainnet:

1. Set network to `Network.MAINNET` in `src/utils/aptos.ts`
2. Deploy contract with real APT:
   ```bash
   aptos move publish --named-addresses defix=<your_address> --network mainnet
   ```
3. Test thoroughly with small amounts first
4. Consider formal verification for critical functions

## 📚 Additional Resources

- [Aptos Framework Docs](https://aptos.dev/move/move-on-aptos)
- [Move Language Book](https://move-language.github.io/move/)
- [Petra Wallet Documentation](https://petra.app/docs)
- [NFT.Storage Docs](https://nft.storage/docs/)
- [Leaflet Maps Documentation](https://leafletjs.com/reference.html)
- [shadcn/ui Components](https://ui.shadcn.com/docs)

---

**DeFix Platform** © 2025 | For questions or support, open an issue on GitHub

## 🧠 Advanced Usage

### Smart Contract Interaction via CLI

```bash
# View contract resources on your account
aptos account list --account <your-address>

# Create a problem directly via CLI
aptos move run \
  --function-id <address>::ProblemRegistry::create_problem \
  --args string:"Pothole on Main St" string:"Large pothole causing traffic issues" string:"ipfs://..." u64:10000000 \
  --assume-yes

# Query all problems (returns JSON data)
aptos move view \
  --function-id <address>::ProblemRegistry::get_all_problems
```

### Contract Testing

```bash
# Run all Move tests
cd contracts
aptos move test

# Run specific test functions
aptos move test --filter test_create_problem
```

### Contract Verification

After deployment, verify your contract on Aptos Explorer:

1. Visit [Aptos Explorer](https://explorer.aptoslabs.com/)
2. Search for your account address
3. Check "Modules" section
4. Verify ProblemRegistry module is listed and matches your source code

### Performance Tips

1. **Map Loading**: Use lower resolution map tiles for faster loading
2. **Image Optimization**: Compress images before uploading to IPFS
3. **Transaction Batching**: Group related operations when possible
4. **Caching**: Enable browser caching for static assets
5. **Pagination**: Implement pagination for long lists of problems

---

**DeFix Platform** © 2025 | Built with ❤️ for community empowerment