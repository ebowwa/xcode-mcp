# Installation Guide

This guide will walk you through installing and configuring Xcode MCP for use with Claude Desktop.

## Prerequisites

Before installing Xcode MCP, ensure you have the following:

### System Requirements
- **macOS**: 12.0 (Monterey) or later
- **Xcode**: 14.0 or later (install from Mac App Store)
- **Node.js**: 16.0 or later
- **Claude Desktop**: Latest version

### Verify Prerequisites

1. **Check macOS version**:
   ```bash
   sw_vers -productVersion
   ```

2. **Check Xcode installation**:
   ```bash
   xcode-select -p
   # Should output: /Applications/Xcode.app/Contents/Developer
   ```

3. **Install Xcode Command Line Tools** (if needed):
   ```bash
   xcode-select --install
   ```

4. **Check Node.js version**:
   ```bash
   node --version
   # Should be v16.0.0 or higher
   ```

## Installation Steps

### Option 1: Install from Source (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ebowwa/xcode-mcp.git
   cd xcode-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Note the installation path**:
   ```bash
   pwd
   # Remember this path for configuration
   ```

### Option 2: Install via npm (Coming Soon)

```bash
npm install -g xcode-mcp-server
```

## Configure Claude Desktop

1. **Open Claude configuration**:
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Add Xcode MCP server**:
   ```json
   {
     "mcpServers": {
       "xcode-mcp": {
         "command": "node",
         "args": ["/path/to/xcode-mcp/dist/index.js"],
         "env": {}
       }
     }
   }
   ```

3. **Replace `/path/to/xcode-mcp`** with your actual installation path from step 4 above.

## Verify Installation

1. **Restart Claude Desktop**:
   - Quit Claude Desktop completely
   - Relaunch Claude Desktop

2. **Test the connection**:
   ```
   User: "What Xcode tools are available?"
   ```

3. **Expected response**: Claude should list available xcode_* tools.

## Troubleshooting Installation

### "Command not found" errors

If you see command not found errors:

1. Ensure Xcode is properly installed:
   ```bash
   xcodebuild -version
   ```

2. Reset Xcode command line tools:
   ```bash
   sudo xcode-select --reset
   ```

### MCP Connection Failed

If Claude can't connect to Xcode MCP:

1. Check the log file:
   ```bash
   tail -f ~/Library/Logs/Claude/mcp-server-xcode-mcp.log
   ```

2. Verify the path in config is absolute (not relative)

3. Ensure Node.js is in your PATH:
   ```bash
   which node
   ```

### Permission Issues

If you encounter permission errors:

```bash
# Fix file permissions
chmod +x /path/to/xcode-mcp/dist/index.js

# Ensure read access
chmod -R 755 /path/to/xcode-mcp
```

## Post-Installation Setup

### Optional: Install Additional Tools

1. **xcodegen** (for better project generation):
   ```bash
   brew install xcodegen
   ```

2. **xcbeautify** (for prettier build output):
   ```bash
   brew install xcbeautify
   ```

### Configure Environment Variables

You can add environment variables to the MCP configuration:

```json
{
  "mcpServers": {
    "xcode-mcp": {
      "command": "node",
      "args": ["/path/to/xcode-mcp/dist/index.js"],
      "env": {
        "XCODE_MCP_LOG_LEVEL": "debug",
        "XCODE_MCP_TIMEOUT": "300000"
      }
    }
  }
}
```

## Next Steps

- Follow the [Quick Start Tutorial](Quick-Start) to create your first project
- Read the [Tool Reference](Tool-Reference) to learn about available commands
- Check [Common Workflows](Common-Workflows) for typical usage patterns

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/ebowwa/xcode-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ebowwa/xcode-mcp/discussions)
- **Logs**: Check `~/Library/Logs/Claude/mcp-server-xcode-mcp.log`