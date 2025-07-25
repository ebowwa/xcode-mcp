# READ THIS FIRST - Xcode MCP Usage for Claude

## YOU HAVE DIRECT ACCESS TO XCODE TOOLS - USE THEM!

### What NOT to do:
❌ DON'T suggest web monitors
❌ DON'T tell users to open browsers  
❌ DON'T defer to manual processes
❌ DON'T mention http://localhost:3000

### What TO do:
✅ USE xcode_* tools directly
✅ BUILD projects immediately when asked
✅ RUN tests without asking
✅ MANAGE simulators programmatically

## Quick Reference:

User says → You do:
- "build my app" → `xcode_build_project`
- "run tests" → `xcode_test_project`
- "show simulators" → `xcode_list_simulators`
- "clean build" → `xcode_clean_project`
- "install app" → `xcode_install_app_simulator`

## The Tools Are Real - Use Them!

These aren't documentation tools. They execute real Xcode commands:
- `xcode_build_project` → runs `xcodebuild`
- `xcode_test_project` → runs actual tests
- `xcode_boot_simulator` → boots real simulators

Stop suggesting. Start doing.