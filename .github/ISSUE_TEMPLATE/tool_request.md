---
name: New Tool Request
about: Request a new Xcode tool to be added
title: '[TOOL] '
labels: new-tool
assignees: ''

---

**Tool Name**
Proposed name for the tool (e.g., `xcode_run_ui_tests`)

**Description**
What should this tool do?

**Xcode Command**
What underlying Xcode/xcrun command would this use?
```bash
# Example command
xcodebuild -workspace MyApp.xcworkspace -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15' test
```

**Parameters**
What parameters should the tool accept?
- `parameter_name`: Description (required/optional)
- `another_param`: Description (required/optional)

**Use Case**
When would Claude use this tool? Provide examples.

**Priority**
How important is this tool? (High/Medium/Low)

**Additional Notes**
Any other information that might be helpful.