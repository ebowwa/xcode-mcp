# Getting Started with Xcode MCP

This guide will help you set up and start using Xcode MCP with Claude.

## Prerequisites

Before you begin, ensure you have:

1. **macOS 12.0 or later**
2. **Xcode 14.0 or later** installed from the App Store
3. **Xcode Command Line Tools** installed:
   ```bash
   xcode-select --install
   ```
4. **Node.js 16.0 or later** installed
5. **Claude Desktop** application

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/xcode-mcp.git
cd xcode-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Configure Claude Desktop

Edit your Claude configuration file:
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add the Xcode MCP server:
```json
{
  "mcpServers": {
    "xcode-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/xcode-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### 5. Restart Claude Desktop

Quit and relaunch Claude Desktop to load the new configuration.

## Verify Installation

Ask Claude to list available Xcode tools:
```
User: "What Xcode tools do you have available?"
```

Claude should respond with a list of available xcode_* tools.

## First Project

Try creating your first project:
```
User: "Create a new iOS app called HelloWorld with bundle ID com.example.helloworld"
```

Claude will use the `xcode_create_project` tool to generate the project structure.

## Next Steps

- Read the [Tool Reference](Tool-Reference.md) to learn about all available tools
- Check [Advanced Usage](Advanced-Usage.md) for complex workflows
- See [Troubleshooting](Troubleshooting.md) if you encounter issues