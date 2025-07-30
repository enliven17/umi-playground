# Umi Playground

A web application for deploying smart contracts on Umi Network. Supports both MoveVM and EVM (Solidity) contract deployments with a beautiful glassmorphism UI.

## Features

- **Dual VM Support**: Deploy contracts on both MoveVM and EVM
- **Modern UI**: Glassmorphism design with responsive layout
- **File Upload**: Drag and drop or click to upload contract files
- **Real-time Feedback**: Live deployment status and transaction tracking
- **Security**: Built-in rate limiting, input validation, and command injection protection
- **Rate Limiting**: 5 requests per minute per IP
- **Auto Cleanup**: Temporary files are automatically cleaned up

## Supported Contract Types

### EVM (Solidity)
- **File Format**: `.sol` files
- **Language**: Solidity ^0.8.28
- **Network**: Umi Devnet
- **RPC URL**: `https://devnet.uminetwork.com`

### MoveVM
- **File Format**: `.move` files
- **Language**: Move
- **Network**: Umi Devnet
- **Status**: Coming Soon

## Requirements

### For Users
- Valid private key with test tokens
- Solidity contracts (.sol files) for EVM
- Move contracts (.move files) for MoveVM (when available)
- Account address for Move deployments

### For Development
- Node.js 18+
- npm or yarn
- Umi Network test tokens

## File Limits

- **Maximum file size**: 1MB
- **Maximum code length**: 50,000 characters
- **Supported extensions**: `.sol`, `.move`

## Security Features

### Input Validation
- Private key format validation (64 hex characters, 0x prefix optional)
- Account address validation (40 hex characters with 0x prefix)
- Contract name validation (alphanumeric and underscores)
- File size and content length limits

### Rate Limiting
- 5 requests per minute per IP address
- Automatic reset after 60 seconds
- Real-time remaining request counter

### Command Injection Protection
- Sanitized command execution
- Allowed commands: `npx`, `npm`, `aptos`, `hardhat`
- Dangerous character filtering

### File System Security
- Temporary directory isolation
- Automatic cleanup after 5 minutes
- Secure file path handling

### Error Handling
- Structured error responses
- No sensitive data leakage
- Comprehensive logging

## How It Works

### Frontend
1. **File Upload**: Users can drag and drop or click to upload contract files
2. **Code Preview**: Read-only preview of uploaded contract code
3. **Input Validation**: Real-time validation of private keys and addresses
4. **Deployment**: Secure API calls to backend deployment services

### Backend
1. **Request Processing**: Rate limiting and input validation
2. **Temporary Setup**: Creates isolated temporary directories
3. **Contract Compilation**: Uses Hardhat for Solidity, Aptos CLI for Move
4. **Deployment**: Executes deployment commands with sanitized inputs
5. **Cleanup**: Automatically removes temporary files and directories

### Deployment Process
1. **Validation**: Checks file format, size, and content
2. **Setup**: Creates project structure with dependencies
3. **Compilation**: Compiles contract using appropriate tools
4. **Deployment**: Deploys to Umi Devnet
5. **Response**: Returns contract address and transaction hash

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd umi-playground
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Aptos CLI** (for Move deployments)
   ```bash
   curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Development

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── components/         # React components
├── lib/               # Utility functions
└── screens/           # Page components
```

### Key Components
- **CodeEditor**: File upload and code preview
- **DeployForm**: Private key input and deployment controls
- **ResultBox**: Deployment results display
- **PlaygroundScreen**: Main application screen

### Security Library
- **Input validation**: Contract and key format checking
- **Rate limiting**: IP-based request limiting
- **Command sanitization**: Safe command execution
- **File cleanup**: Automatic temporary file removal

## Environment Variables

No environment variables required for basic functionality. The application uses Umi Devnet by default.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the security features

---

Made with ❤️ for the Umi ecosystem by [enliven](https://github.com/enliven17)
