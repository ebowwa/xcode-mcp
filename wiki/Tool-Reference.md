# Tool Reference

Complete reference for all Xcode MCP tools.

## Project Management Tools

### xcode_create_project
Creates a new Xcode project with basic SwiftUI structure.

**Parameters:**
- `project_path` (required): Where to create the project
- `project_name` (required): Name of the project
- `bundle_id` (required): Bundle identifier (e.g., com.company.app)
- `platform` (optional): Target platform - "ios" or "macos" (default: "ios")

**Example:**
```
Create iOS app "MyApp" at /Users/me/Projects/MyApp with bundle ID com.example.myapp
```

### xcode_build_project
Builds an existing Xcode project.

**Parameters:**
- `project_path` (required): Path to .xcodeproj file
- `scheme` (required): Build scheme name
- `configuration` (optional): "Debug" or "Release" (default: "Debug")
- `destination` (optional): Build destination

**Example:**
```
Build MyApp.xcodeproj with scheme "MyApp" for iOS Simulator
```

### xcode_list_schemes
Lists all schemes in a project.

**Parameters:**
- `project_path` (required): Path to .xcodeproj file

## File Management Tools

### xcode_create_swift_file
Creates a Swift source file with content.

**Parameters:**
- `file_path` (required): Where to create the file
- `content` (required): Swift code content

### xcode_modify_plist
Modifies an existing plist entry.

**Parameters:**
- `plist_path` (required): Path to plist file
- `key` (required): Key to modify
- `value` (required): New value

### xcode_add_plist_entry
Adds a new plist entry.

**Parameters:**
- `plist_path` (required): Path to plist file
- `key` (required): Key to add
- `type` (required): Value type (string, bool, integer, array, dict)
- `value` (required): Value to set

## Simulator Tools

### xcode_list_simulators
Lists all available simulators.

**No parameters required**

### xcode_boot_simulator
Boots a specific simulator.

**Parameters:**
- `device_id` (required): Simulator device ID or name

### xcode_install_app_simulator
Installs an app on a simulator.

**Parameters:**
- `device_id` (required): Simulator device ID
- `app_path` (required): Path to .app bundle

### xcode_launch_app_simulator
Launches an app on a simulator.

**Parameters:**
- `device_id` (required): Simulator device ID
- `bundle_id` (required): App bundle identifier

## Testing Tools

### xcode_test_project
Runs tests for a project.

**Parameters:**
- `project_path` (required): Path to .xcodeproj file
- `scheme` (required): Test scheme name
- `destination` (optional): Test destination

## Build Tools

### xcode_clean_project
Cleans build artifacts.

**Parameters:**
- `project_path` (required): Path to .xcodeproj file
- `scheme` (optional): Scheme to clean

### xcode_archive_project
Creates an archive for distribution.

**Parameters:**
- `project_path` (required): Path to .xcodeproj file
- `scheme` (required): Scheme to archive
- `archive_path` (required): Output path for .xcarchive

## Information Tools

### xcode_show_build_settings
Shows build settings for a project/scheme.

**Parameters:**
- `project_path` (required): Path to .xcodeproj file
- `scheme` (required): Scheme name

### xcode_show_sdk_info
Shows available SDKs and versions.

**No parameters required**

### xcode_show_destinations
Shows available build destinations.

**Parameters:**
- `project_path` (required): Path to .xcodeproj file
- `scheme` (required): Scheme name