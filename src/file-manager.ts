import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FileManager {
  async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  async createDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    return await fs.readdir(dirPath);
  }

  async modifyPlist(plistPath: string, key: string, value: string): Promise<void> {
    // Use PlistBuddy to modify plist files
    const command = `/usr/libexec/PlistBuddy -c "Set :${key} ${value}" "${plistPath}"`;
    await execAsync(command);
  }

  async addPlistEntry(plistPath: string, key: string, type: string, value: string): Promise<void> {
    const command = `/usr/libexec/PlistBuddy -c "Add :${key} ${type} ${value}" "${plistPath}"`;
    await execAsync(command);
  }

  async createXcodeProject(projectPath: string, projectName: string, bundleId: string, platform: string = 'ios'): Promise<void> {
    // Create project directory
    await this.createDirectory(projectPath);
    
    // Use xcodeproj Ruby gem or generate project structure manually
    // For now, we'll use xcodegen if available, or fall back to manual creation
    const xcodegenConfig = {
      name: projectName,
      options: {
        bundleIdPrefix: bundleId,
        deploymentTarget: {
          iOS: '15.0',
          macOS: '12.0'
        }
      },
      targets: {
        [projectName]: {
          type: 'application',
          platform: platform,
          sources: [projectName],
          settings: {
            PRODUCT_BUNDLE_IDENTIFIER: bundleId
          }
        }
      }
    };

    // Write xcodegen spec
    const specPath = path.join(projectPath, 'project.yml');
    await this.writeFile(specPath, JSON.stringify(xcodegenConfig, null, 2));

    // Check if xcodegen is available
    try {
      await execAsync('which xcodegen');
      // Generate project using xcodegen
      await execAsync(`cd "${projectPath}" && xcodegen generate`);
    } catch {
      // Fallback: create basic structure manually
      await this.createBasicProjectStructure(projectPath, projectName, bundleId, platform);
    }
  }

  private async createBasicProjectStructure(projectPath: string, projectName: string, bundleId: string, platform: string): Promise<void> {
    // Create basic directory structure
    const sourcesDir = path.join(projectPath, projectName);
    await this.createDirectory(sourcesDir);
    
    // Create a basic Swift file
    const appContent = platform === 'ios' ? this.getIOSAppTemplate(projectName) : this.getMacOSAppTemplate(projectName);
    await this.writeFile(path.join(sourcesDir, `${projectName}App.swift`), appContent);
    
    // Create Info.plist
    const infoPlistContent = this.getInfoPlistTemplate(projectName, bundleId);
    await this.writeFile(path.join(sourcesDir, 'Info.plist'), infoPlistContent);
    
    // Create a basic ContentView
    const contentViewContent = this.getContentViewTemplate();
    await this.writeFile(path.join(sourcesDir, 'ContentView.swift'), contentViewContent);
  }

  private getIOSAppTemplate(appName: string): string {
    return `import SwiftUI

@main
struct ${appName}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`;
  }

  private getMacOSAppTemplate(appName: string): string {
    return `import SwiftUI

@main
struct ${appName}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`;
  }

  private getContentViewTemplate(): string {
    return `import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
`;
  }

  private getInfoPlistTemplate(appName: string, bundleId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <false/>
    </dict>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
`;
  }
}