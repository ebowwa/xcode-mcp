# Xcode MCP (Model Context Protocol) Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Version](https://img.shields.io/badge/MCP-v2.0.0-blue)](https://modelcontextprotocol.io)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)

A comprehensive MCP server that provides programmatic access to Xcode functionality, enabling AI assistants like Claude to create, build, test, and manage iOS/macOS projects directly.

<a href="https://glama.ai/mcp/servers/@ebowwa/xcode-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@ebowwa/xcode-mcp/badge" alt="Xcode Server MCP server" />
</a>

## 🚀 Features

### Project Management
- **Create new Xcode projects** - Generate complete project structures with SwiftUI templates
- **Build projects** - Compile apps with customizable configurations
- **Run tests** - Execute unit and UI tests
- **Archive apps** - Create archives for distribution
- **Manage schemes** - List and work with project schemes

### File Operations
- **Create Swift files** - Write source code directly to the filesystem
- **Modify Info.plist** - Update app configurations programmatically
- **Create directories** - Set up project folder structures
- **Read files** - Access and analyze existing code

### Simulator Management
- **List simulators** - View all available iOS, watchOS, and tvOS simulators
- **Boot/shutdown simulators** - Control simulator lifecycle
- **Install apps** - Deploy apps to simulators
- **Launch apps** - Run apps with specific bundle IDs
- **Capture screenshots** - Take simulator screenshots programmatically

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/xcode-mcp.git
cd xcode-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## 🔧 Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

## 🎯 Usage

Once configured, Claude can use these tools directly:

### Creating a New Project
```
User: "Create a new iOS app called MyApp"
Claude: *uses xcode_create_project to generate the project structure*
```

### Building Projects
```
User: "Build my iOS app"
Claude: *uses xcode_build_project with appropriate parameters*
```

### Managing Simulators
```
User: "Show me available simulators"
Claude: *uses xcode_list_simulators to display options*
```

## 📚 Available Tools

| Tool | Description |
|------|-------------|
| `xcode_create_project` | Create new Xcode projects with templates |
| `xcode_create_swift_file` | Write Swift source files |
| `xcode_build_project` | Build Xcode projects |
| `xcode_test_project` | Run project tests |
| `xcode_list_simulators` | List available simulators |
| `xcode_boot_simulator` | Start a simulator |
| `xcode_install_app_simulator` | Install apps on simulators |
| `xcode_modify_plist` | Modify plist files |
| `xcode_show_build_settings` | Display build configurations |
| `xcode_archive_project` | Create app archives |

## 🛠️ Development

### Prerequisites
- Node.js 16+
- Xcode 14+
- macOS 12+

### Building from Source
```bash
npm install
npm run build
```

### Running in Development
```bash
npm run dev
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📋 Requirements

- **macOS**: Required for Xcode integration
- **Xcode**: Must be installed with command line tools
- **Node.js**: Version 16 or higher

## 🐛 Troubleshooting

### Common Issues

**Simulators not showing:**
- Ensure Xcode is properly installed
- Run `xcode-select --install` for command line tools

**Build failures:**
- Check Xcode project paths are correct
- Verify scheme names match exactly

**MCP connection errors:**
- Restart Claude Desktop after configuration changes
- Check logs at `~/Library/Logs/Claude/mcp-server-xcode-mcp.log`

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- Uses Apple's Xcode command line tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/xcode-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/xcode-mcp/discussions)
- **Wiki**: [Documentation Wiki](https://github.com/yourusername/xcode-mcp/wiki)