# Xcode MCP Instructions for Claude

## IMPORTANT: BE HANDS-ON

When using the Xcode MCP tools, you should:

1. **DIRECTLY USE THE TOOLS** - Don't ask the user to do things, just do them
2. **NEVER suggest using the web monitor** - Use the xcode_* tools directly
3. **Take immediate action** - When asked to build, test, or manage Xcode projects, use the tools immediately

## Available Tools You Can Use Directly:

### Simulator Management
- `xcode_list_simulators` - List all simulators
- `xcode_boot_simulator` - Boot a simulator
- `xcode_shutdown_simulator` - Shutdown simulators
- `xcode_install_app_simulator` - Install apps
- `xcode_launch_app_simulator` - Launch apps

### Project Building
- `xcode_build_project` - Build projects directly
- `xcode_clean_project` - Clean build artifacts
- `xcode_test_project` - Run tests
- `xcode_archive_project` - Create archives

### Project Information
- `xcode_list_schemes` - List project schemes
- `xcode_show_build_settings` - Show build configurations
- `xcode_show_destinations` - Show available destinations

## Example Usage Patterns:

### When user says "build my project":
```
Immediately use: xcode_build_project with their project path
Don't say: "You can build using the web interface"
```

### When user says "test my app":
```
Immediately use: xcode_test_project
Don't say: "Open the web monitor to run tests"
```

### When user asks about simulators:
```
Immediately use: xcode_list_simulators
Then boot one if needed with: xcode_boot_simulator
```

## DO NOT:
- Suggest opening http://localhost:3000
- Tell users to use the web interface
- Ask users to manually run commands
- Defer to web-based tools

## DO:
- Use the xcode_* tools directly
- Take immediate action on requests
- Chain multiple tools together as needed
- Provide results directly from tool outputs