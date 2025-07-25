# Quick Start Tutorial

Let's build your first iOS app using Xcode MCP and Claude! This tutorial will walk you through creating a simple "Hello World" app.

## 🎯 What We'll Build

A simple iOS app that displays "Hello, World!" with:
- SwiftUI interface
- Custom colors
- Button interaction
- App icon placeholder

## 📋 Prerequisites

Make sure you've completed the [Installation Guide](Installation) and Claude can access Xcode MCP tools.

## 🚀 Step 1: Create the Project

Ask Claude to create a new project:

```
User: "Create a new iOS app called HelloWorld with bundle ID com.example.helloworld in ~/Desktop/HelloWorld"
```

Claude will use `xcode_create_project` to set up the basic structure.

## 📝 Step 2: Create the Main App File

```
User: "Create the main app file HelloWorldApp.swift with a SwiftUI app structure"
```

Claude will create:
```swift
import SwiftUI

@main
struct HelloWorldApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

## 🎨 Step 3: Design the Content View

```
User: "Create ContentView.swift with a greeting message and a button that changes the text when tapped"
```

Claude will create an interactive view:
```swift
import SwiftUI

struct ContentView: View {
    @State private var greeting = "Hello, World!"
    @State private var isGreeting = true
    
    var body: some View {
        VStack(spacing: 20) {
            Text(greeting)
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.blue)
                .padding()
            
            Button(action: {
                withAnimation {
                    isGreeting.toggle()
                    greeting = isGreeting ? "Hello, World!" : "Welcome to SwiftUI!"
                }
            }) {
                Text("Tap me!")
                    .font(.title2)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
```

## 🔧 Step 4: Configure the App

```
User: "Add microphone permission to Info.plist with description 'This app needs microphone access for voice features'"
```

Claude will use `xcode_add_plist_entry` to add the permission.

## 🏗️ Step 5: Build the Project

```
User: "Build the HelloWorld project in Debug configuration"
```

Claude will:
1. List available schemes
2. Build the project
3. Report any errors

## 📱 Step 6: Test on Simulator

```
User: "List available simulators and boot an iPhone 15 simulator"
```

Then:
```
User: "Install and launch HelloWorld app on the simulator"
```

## 🎯 Complete Workflow Example

Here's a complete conversation flow:

```
User: "I want to create a simple iOS app that shows a welcome message"

Claude: I'll help you create a simple iOS app. Let me start by creating the project structure.

[Uses xcode_create_project]
✓ Created project structure

[Uses xcode_create_swift_file for HelloWorldApp.swift]
✓ Created main app file

[Uses xcode_create_swift_file for ContentView.swift]
✓ Created content view with welcome message

User: "Can you make it more colorful with a gradient background?"

Claude: I'll update the ContentView to add a beautiful gradient background.

[Uses xcode_read_file to check current content]
[Uses xcode_create_swift_file to update with gradient]
✓ Added gradient background

User: "Great! Now build and run it"

Claude: I'll build your app and run it on a simulator.

[Uses xcode_build_project]
✓ Build succeeded

[Uses xcode_list_simulators]
[Uses xcode_boot_simulator]
[Uses xcode_install_app_simulator]
[Uses xcode_launch_app_simulator]
✓ App is now running on iPhone 15 simulator!
```

## 🔍 Exploring Further

### Add More Features
```
User: "Add a settings view with a toggle for dark mode"
```

### Create Custom Components
```
User: "Create a reusable button component with custom styling"
```

### Add Navigation
```
User: "Add navigation between multiple screens"
```

## 💡 Tips for Success

1. **Be Specific**: The more specific your requests, the better Claude can help
2. **Iterative Development**: Build features incrementally
3. **Ask for Explanations**: Claude can explain the code it creates
4. **Check Logs**: If something fails, ask Claude to check error logs

## 🐛 Common Issues

### Build Fails
```
User: "The build failed, can you check what's wrong?"
```
Claude will examine build settings and error messages.

### Simulator Issues
```
User: "The simulator won't boot, what should I do?"
```
Claude can restart simulators and check for issues.

### Code Problems
```
User: "The button doesn't work, can you debug it?"
```
Claude can read files and identify issues.

## 🎉 Congratulations!

You've created your first iOS app with Xcode MCP! 

### Next Steps:
- Try the [Common Workflows](Common-Workflows) for more complex examples
- Explore the [Tool Reference](Tool-Reference) for all available commands
- Join the [community](https://github.com/ebowwa/xcode-mcp/discussions) to share your creations

## 📚 Resources

- [Apple SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Xcode MCP Tool Reference](Tool-Reference)
- [Troubleshooting Guide](Troubleshooting)