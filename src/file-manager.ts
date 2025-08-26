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

  async getDefaultDevelopmentTeam(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('defaults read com.apple.dt.Xcode IDEProvisioningTeamManagerLastSelectedTeamID 2>/dev/null');
      return stdout.trim();
    } catch {
      return null;
    }
  }

  async getSigningCertificate(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('security find-identity -v -p codesigning | grep "Apple Development" | head -1');
      const match = stdout.match(/"([^"]+)"/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
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

  private async generateXcodegenConfig(projectName: string, bundleId: string, platform: string): Promise<string> {
    const xcodegenPlatform = platform === 'ios' ? 'iOS' : platform === 'macos' ? 'macOS' : platform;
    const teamId = await this.getDefaultDevelopmentTeam();
    
    let config = `name: ${projectName}
options:
  bundleIdPrefix: ${bundleId}
  deploymentTarget:
    iOS: '15.0'
    macOS: '12.0'
targets:
  ${projectName}:
    type: application
    platform: ${xcodegenPlatform}
    sources: 
      - ${projectName}
    settings:
      PRODUCT_BUNDLE_IDENTIFIER: ${bundleId}`;
    
    if (teamId) {
      config += `
      DEVELOPMENT_TEAM: ${teamId}
      CODE_SIGN_STYLE: Automatic`;
    }
    
    return config + '\n';
  }

  async createXcodeProject(projectPath: string, projectName: string, bundleId: string, platform: string = 'ios'): Promise<void> {
    // Create project directory
    await this.createDirectory(projectPath);
    
    // Create source directory for xcodegen (must exist before generation)
    const sourcesDir = path.join(projectPath, projectName);
    await this.createDirectory(sourcesDir);
    
    // Generate xcodegen config with automatic team detection
    const xcodegenConfig = await this.generateXcodegenConfig(projectName, bundleId, platform);
    
    // Write xcodegen spec
    const specPath = path.join(projectPath, 'project.yml');
    await this.writeFile(specPath, xcodegenConfig);

    // Check if xcodegen is available
    try {
      await execAsync('which xcodegen');
      
      // Create basic Swift files BEFORE running xcodegen
      await this.createBasicSwiftFiles(sourcesDir, projectName, platform);
      
      // Generate project using xcodegen
      const { stdout, stderr } = await execAsync(`cd "${projectPath}" && xcodegen generate 2>&1`);
      console.log('xcodegen output:', stdout);
      if (stderr) console.error('xcodegen stderr:', stderr);
      
      // Check if .xcodeproj was created
      const xcodeprojPath = path.join(projectPath, `${projectName}.xcodeproj`);
      if (!await this.fileExists(xcodeprojPath)) {
        throw new Error('xcodegen did not create .xcodeproj file');
      }
    } catch (error) {
      console.error('xcodegen failed:', error);
      // Fallback: create basic structure manually
      await this.createBasicProjectStructure(projectPath, projectName, bundleId, platform);
    }
  }

  private async createBasicSwiftFiles(sourcesDir: string, projectName: string, platform: string): Promise<void> {
    // Create a basic Swift file
    const appContent = platform === 'ios' ? this.getIOSAppTemplate(projectName) : this.getMacOSAppTemplate(projectName);
    await this.writeFile(path.join(sourcesDir, `${projectName}App.swift`), appContent);
    
    // Create a basic ContentView
    const contentViewContent = this.getContentViewTemplate();
    await this.writeFile(path.join(sourcesDir, 'ContentView.swift'), contentViewContent);
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