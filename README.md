# @ebowwa/mcp-xcode

Xcode MCP server - build, test, run, and manage simulators from Claude Code.

## Installation

```bash
npm install @ebowwa/mcp-xcode
```

## Requirements

- macOS (Darwin)
- Xcode Command Line Tools (`xcode-select --install`)

## Tools

### Build Tools

| Tool | Description |
|------|-------------|
| `xcode_build` | Build an Xcode project/workspace |
| `xcode_test` | Run unit/UI tests |
| `xcode_archive` | Create .xcarchive for distribution |
| `xcode_clean` | Clean build folder |
| `xcode_show_build_settings` | Show all build settings for a scheme |

### Project Info

| Tool | Description |
|------|-------------|
| `xcode_project_info` | Get project/workspace info |
| `xcode_scheme_list` | List all schemes |
| `xcode_destination_list` | List available destinations |

### Simulator Tools

| Tool | Description |
|------|-------------|
| `xcode_simulator_list` | List all available simulators |
| `xcode_simulator_boot` | Boot a simulator |
| `xcode_simulator_shutdown` | Shutdown simulator(s) |
| `xcode_simulator_install` | Install app on simulator |
| `xcode_simulator_launch` | Launch app on simulator |
| `xcode_simulator_terminate` | Terminate app on simulator |
| `xcode_simulator_open_url` | Open URL on simulator |
| `xcode_simulator_take_screenshot` | Take screenshot |

### Device Tools

| Tool | Description |
|------|-------------|
| `xcode_device_list` | List connected physical devices |
| `xcode_runtime_list` | List installed iOS/tvOS/watchOS runtimes |

## Usage Examples

### Build a Scheme

```json
{
  "scheme": "MyApp",
  "destination": "platform=iOS Simulator,name=iPhone 15"
}
```

### Run Tests

```json
{
  "scheme": "MyAppTests",
  "onlyTesting": "MyAppTests/MyTestCase/testExample"
}
```

### Boot Simulator

```json
{
  "name": "iPhone 15",
  "runtime": "iOS 17.2"
}
```

### Install and Launch App

```json
{
  "appPath": "/path/to/MyApp.app",
  "bundleId": "com.mycompany.myapp"
}
```

## Claude Code Configuration

Add to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "xcode": {
      "command": "bun",
      "args": ["run", "/path/to/mcp-xcode/dist/index.js"]
    }
  }
}
```

## License

MIT
