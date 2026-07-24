#!/usr/bin/env bun
/**
 * @ebowwa/mcp-xcode - Xcode MCP Server
 *
 * Comprehensive Xcode integration with tools for:
 * - Building/testing/archiving Xcode projects
 * - Simulator management (boot, shutdown, install, launch)
 * - Project/workspace inspection
 * - Scheme and destination listing
 *
 * macOS only - requires Xcode command line tools
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { spawn, execSync } from "child_process";
import { promisify } from "util";

const exec = promisify(require("child_process").exec);

// ============================================================================
// Platform Check
// ============================================================================

function checkPlatform(): boolean {
  return process.platform === "darwin";
}

function checkXcodeInstalled(): boolean {
  try {
    execSync("xcode-select -p", { encoding: "utf-8" });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Zod Schemas
// ============================================================================

const ProjectPathSchema = z.object({
  projectPath: z
    .string()
    .optional()
    .describe("Path to .xcodeproj or .xcworkspace (uses current directory if not specified)"),
});

const SchemeSchema = z.object({
  scheme: z.string().describe("Scheme name to build/test/archive"),
});

const ConfigurationSchema = z.object({
  configuration: z
    .enum(["Debug", "Release"])
    .optional()
    .default("Debug")
    .describe("Build configuration"),
});

const DestinationSchema = z.object({
  destination: z
    .string()
    .optional()
    .describe("Destination specifier (e.g., 'platform=iOS Simulator,name=iPhone 15')"),
});

const CleanSchema = z.object({
  clean: z
    .boolean()
    .optional()
    .default(false)
    .describe("Clean build folder before building"),
});

const BuildSchema = ProjectPathSchema.merge(SchemeSchema)
  .merge(ConfigurationSchema)
  .merge(DestinationSchema)
  .merge(CleanSchema)
  .extend({
    extraArgs: z
      .array(z.string())
      .optional()
      .describe("Additional xcodebuild arguments"),
  });

const TestSchema = BuildSchema.extend({
  testPlan: z.string().optional().describe("Test plan to run"),
  onlyTesting: z.string().optional().describe("Test case to run (e.g., 'TestTarget/TestSuite')"),
  skipTesting: z.string().optional().describe("Test case to skip"),
});

const ArchiveSchema = ProjectPathSchema.merge(SchemeSchema)
  .extend({
    archivePath: z.string().describe("Path to save the .xcarchive"),
    configuration: z
      .enum(["Debug", "Release"])
      .optional()
      .default("Release")
      .describe("Build configuration for archive"),
  });

const SimulatorSchema = z.object({
  simulatorId: z
    .string()
    .optional()
    .describe("Simulator UDID (uses booted simulator if not specified)"),
});

const SimulatorBootSchema = z.object({
  name: z.string().optional().describe("Simulator name (e.g., 'iPhone 15')"),
  deviceId: z.string().optional().describe("Simulator UDID"),
  runtime: z.string().optional().describe("iOS runtime (e.g., 'iOS 17.2')"),
});

const AppInstallSchema = SimulatorSchema.extend({
  appPath: z.string().describe("Path to .app bundle to install"),
});

const AppLaunchSchema = SimulatorSchema.extend({
  bundleId: z.string().describe("Bundle identifier of app to launch"),
  waitForDebugger: z.boolean().optional().default(false).describe("Wait for debugger to attach"),
});

const OpenUrlSchema = SimulatorSchema.extend({
  url: z.string().describe("URL to open"),
});

// ============================================================================
// MCP Tool Definitions
// ============================================================================

const TOOLS = [
  // Build tools
  {
    name: "xcode_build",
    description: `Build an Xcode project or workspace.

Examples:
  - Build scheme: { "scheme": "MyApp" }
  - Build with workspace: { "projectPath": "/path/to/MyApp.xcworkspace", "scheme": "MyApp" }
  - Build for simulator: { "scheme": "MyApp", "destination": "platform=iOS Simulator,name=iPhone 15" }
  - Clean build: { "scheme": "MyApp", "clean": true }`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace" },
        scheme: { type: "string", description: "Scheme name to build" },
        configuration: { type: "string", enum: ["Debug", "Release"], default: "Debug" },
        destination: { type: "string", description: "Destination specifier" },
        clean: { type: "boolean", default: false, description: "Clean build folder first" },
        extraArgs: { type: "array", items: { type: "string" }, description: "Additional xcodebuild arguments" },
      },
      required: ["scheme"],
    },
  },
  {
    name: "xcode_test",
    description: `Run tests for an Xcode project.

Examples:
  - Run all tests: { "scheme": "MyAppTests" }
  - Run specific test: { "scheme": "MyAppTests", "onlyTesting": "MyAppTests/MyTestCase/testExample" }
  - Run test plan: { "scheme": "MyApp", "testPlan": "AllTests" }`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace" },
        scheme: { type: "string", description: "Scheme name to test" },
        configuration: { type: "string", enum: ["Debug", "Release"], default: "Debug" },
        destination: { type: "string", description: "Destination specifier" },
        testPlan: { type: "string", description: "Test plan to run" },
        onlyTesting: { type: "string", description: "Test case to run exclusively" },
        skipTesting: { type: "string", description: "Test case to skip" },
        clean: { type: "boolean", default: false },
        extraArgs: { type: "array", items: { type: "string" } },
      },
      required: ["scheme"],
    },
  },
  {
    name: "xcode_archive",
    description: `Create an Xcode archive for distribution.

Examples:
  - Archive app: { "scheme": "MyApp", "archivePath": "/path/to/MyApp.xcarchive" }
  - Archive with workspace: { "projectPath": "/path/to/MyApp.xcworkspace", "scheme": "MyApp", "archivePath": "./build/MyApp.xcarchive" }`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace" },
        scheme: { type: "string", description: "Scheme name to archive" },
        archivePath: { type: "string", description: "Path to save the .xcarchive" },
        configuration: { type: "string", enum: ["Debug", "Release"], default: "Release" },
      },
      required: ["scheme", "archivePath"],
    },
  },

  // Project info tools
  {
    name: "xcode_project_info",
    description: `Get information about an Xcode project or workspace.

Shows targets, configurations, and build settings.`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace" },
      },
    },
  },
  {
    name: "xcode_scheme_list",
    description: `List all schemes in an Xcode project or workspace.`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace" },
      },
    },
  },
  {
    name: "xcode_destination_list",
    description: `List all available build destinations (simulators, devices, runtimes).

Use this to find valid destination strings for build/test commands.`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace (optional)" },
      },
    },
  },

  // Simulator tools
  {
    name: "xcode_simulator_list",
    description: `List all available iOS simulators.

Shows device name, UDID, state, and runtime.`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "xcode_simulator_boot",
    description: `Boot an iOS simulator.

Examples:
  - Boot by name: { "name": "iPhone 15", "runtime": "iOS 17.2" }
  - Boot by UDID: { "deviceId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" }`,
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Simulator name (e.g., 'iPhone 15')" },
        deviceId: { type: "string", description: "Simulator UDID" },
        runtime: { type: "string", description: "iOS runtime (e.g., 'iOS 17.2')" },
      },
    },
  },
  {
    name: "xcode_simulator_shutdown",
    description: `Shutdown an iOS simulator or all simulators.

Examples:
  - Shutdown specific: { "simulatorId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" }
  - Shutdown all: {}`,
    inputSchema: {
      type: "object",
      properties: {
        simulatorId: { type: "string", description: "Simulator UDID (shuts down all if not specified)" },
      },
    },
  },
  {
    name: "xcode_simulator_install",
    description: `Install an app on a simulator.

Examples:
  - Install app: { "appPath": "/path/to/MyApp.app" }
  - Install on specific simulator: { "appPath": "/path/to/MyApp.app", "simulatorId": "XXXX-XXXX" }`,
    inputSchema: {
      type: "object",
      properties: {
        appPath: { type: "string", description: "Path to .app bundle to install" },
        simulatorId: { type: "string", description: "Simulator UDID (uses booted simulator if not specified)" },
      },
      required: ["appPath"],
    },
  },
  {
    name: "xcode_simulator_launch",
    description: `Launch an app on a simulator.

Examples:
  - Launch app: { "bundleId": "com.mycompany.myapp" }
  - Launch and wait for debugger: { "bundleId": "com.mycompany.myapp", "waitForDebugger": true }`,
    inputSchema: {
      type: "object",
      properties: {
        bundleId: { type: "string", description: "Bundle identifier of app to launch" },
        simulatorId: { type: "string", description: "Simulator UDID (uses booted simulator if not specified)" },
        waitForDebugger: { type: "boolean", default: false, description: "Wait for debugger to attach" },
      },
      required: ["bundleId"],
    },
  },
  {
    name: "xcode_simulator_terminate",
    description: `Terminate an app running on a simulator.

Examples:
  - Terminate app: { "bundleId": "com.mycompany.myapp" }`,
    inputSchema: {
      type: "object",
      properties: {
        bundleId: { type: "string", description: "Bundle identifier of app to terminate" },
        simulatorId: { type: "string", description: "Simulator UDID (uses booted simulator if not specified)" },
      },
      required: ["bundleId"],
    },
  },
  {
    name: "xcode_simulator_open_url",
    description: `Open a URL on a simulator.

Examples:
  - Open URL: { "url": "https://example.com" }
  - Deep link: { "url": "myapp://deep-link" }`,
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to open" },
        simulatorId: { type: "string", description: "Simulator UDID (uses booted simulator if not specified)" },
      },
      required: ["url"],
    },
  },
  {
    name: "xcode_simulator_take_screenshot",
    description: `Take a screenshot of a simulator.

Examples:
  - Take screenshot: { "outputPath": "/tmp/screenshot.png" }`,
    inputSchema: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Path to save screenshot" },
        simulatorId: { type: "string", description: "Simulator UDID (uses booted simulator if not specified)" },
      },
      required: ["outputPath"],
    },
  },

  // Utility tools
  {
    name: "xcode_clean",
    description: `Clean the build folder for an Xcode project.

Examples:
  - Clean project: {}`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace" },
      },
    },
  },
  {
    name: "xcode_show_build_settings",
    description: `Show all build settings for a scheme.

Useful for debugging build configuration issues.`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "Path to .xcodeproj or .xcworkspace" },
        scheme: { type: "string", description: "Scheme name" },
        configuration: { type: "string", enum: ["Debug", "Release"], default: "Debug" },
      },
      required: ["scheme"],
    },
  },
  {
    name: "xcode_runtime_list",
    description: `List all installed iOS/tvOS/watchOS/macOS runtimes.`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "xcode_device_list",
    description: `List all connected physical devices (iPhone, iPad, etc.).`,
    inputSchema: { type: "object", properties: {} },
  },
];

// ============================================================================
// Command Execution
// ============================================================================

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  success: boolean;
}

async function executeCommand(
  command: string,
  args: string[],
  cwd?: string,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd, shell: true });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code,
        success: code === 0,
      });
    });

    proc.on("error", (error) => {
      resolve({
        stdout: "",
        stderr: error.message,
        exitCode: -1,
        success: false,
      });
    });
  });
}

// ============================================================================
// Tool Handlers
// ============================================================================

async function handleBuild(params: unknown): Promise<string> {
  const validated = BuildSchema.parse(params);
  const args = ["xcodebuild"];

  if (validated.projectPath) {
    args.push("-project", validated.projectPath);
  }

  args.push("-scheme", validated.scheme);
  args.push("-configuration", validated.configuration);

  if (validated.destination) {
    args.push("-destination", validated.destination);
  }

  if (validated.clean) {
    args.push("clean");
  }

  args.push("build");

  if (validated.extraArgs) {
    args.push(...validated.extraArgs);
  }

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? `Build succeeded:\n${result.stdout}`
    : `Build failed:\n${result.stderr}\n${result.stdout}`;
}

async function handleTest(params: unknown): Promise<string> {
  const validated = TestSchema.parse(params);
  const args = ["xcodebuild"];

  if (validated.projectPath) {
    args.push("-project", validated.projectPath);
  }

  args.push("-scheme", validated.scheme);
  args.push("-configuration", validated.configuration);

  if (validated.destination) {
    args.push("-destination", validated.destination);
  }

  if (validated.testPlan) {
    args.push("-testPlan", validated.testPlan);
  }

  if (validated.onlyTesting) {
    args.push("-only-testing", validated.onlyTesting);
  }

  if (validated.skipTesting) {
    args.push("-skip-testing", validated.skipTesting);
  }

  if (validated.clean) {
    args.push("clean");
  }

  args.push("test");

  if (validated.extraArgs) {
    args.push(...validated.extraArgs);
  }

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? `Tests passed:\n${result.stdout}`
    : `Tests failed:\n${result.stderr}\n${result.stdout}`;
}

async function handleArchive(params: unknown): Promise<string> {
  const validated = ArchiveSchema.parse(params);
  const args = ["xcodebuild"];

  if (validated.projectPath) {
    args.push("-project", validated.projectPath);
  }

  args.push(
    "-scheme",
    validated.scheme,
    "-configuration",
    validated.configuration,
    "-archivePath",
    validated.archivePath,
    "archive",
  );

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? `Archive created at ${validated.archivePath}:\n${result.stdout}`
    : `Archive failed:\n${result.stderr}\n${result.stdout}`;
}

async function handleProjectInfo(params: unknown): Promise<string> {
  const validated = ProjectPathSchema.parse(params);
  const args = ["xcodebuild", "-list"];

  if (validated.projectPath) {
    args.push("-project", validated.projectPath);
  }

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? result.stdout
    : `Failed to get project info:\n${result.stderr}`;
}

async function handleSchemeList(params: unknown): Promise<string> {
  const validated = ProjectPathSchema.parse(params);
  const args = ["xcodebuild", "-list"];

  if (validated.projectPath) {
    args.push("-project", validated.projectPath);
  }

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? result.stdout
    : `Failed to list schemes:\n${result.stderr}`;
}

async function handleDestinationList(params: unknown): Promise<string> {
  const validated = ProjectPathSchema.partial().parse(params);
  const args = ["xcodebuild", "-showdestinations"];

  if (validated.projectPath) {
    args.push("-project", validated.projectPath);
  }

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? result.stdout
    : `Failed to list destinations:\n${result.stderr}`;
}

async function handleSimulatorList(): Promise<string> {
  const result = await executeCommand("xcrun", ["simctl", "list", "devices", "available"]);
  return result.success
    ? result.stdout
    : `Failed to list simulators:\n${result.stderr}`;
}

async function handleSimulatorBoot(params: unknown): Promise<string> {
  const validated = SimulatorBootSchema.parse(params);

  if (validated.deviceId) {
    const result = await executeCommand("xcrun", ["simctl", "boot", validated.deviceId]);
    return result.success
      ? `Simulator ${validated.deviceId} booted`
      : `Failed to boot simulator:\n${result.stderr}`;
  }

  if (validated.name) {
    // Find device by name
    const listResult = await executeCommand("xcrun", [
      "simctl",
      "list",
      "devices",
      "available",
      "-j",
    ]);

    if (!listResult.success) {
      return `Failed to list simulators:\n${listResult.stderr}`;
    }

    try {
      const data = JSON.parse(listResult.stdout);
      let deviceId: string | null = null;

      for (const runtime of Object.keys(data.devices)) {
        if (validated.runtime && !runtime.includes(validated.runtime)) continue;

        for (const device of data.devices[runtime]) {
          if (device.name === validated.name) {
            deviceId = device.udid;
            break;
          }
        }
        if (deviceId) break;
      }

      if (!deviceId) {
        return `Simulator "${validated.name}" not found${validated.runtime ? ` with runtime ${validated.runtime}` : ""}`;
      }

      const bootResult = await executeCommand("xcrun", ["simctl", "boot", deviceId]);
      return bootResult.success
        ? `Simulator "${validated.name}" (${deviceId}) booted`
        : `Failed to boot simulator:\n${bootResult.stderr}`;
    } catch (error) {
      return `Failed to parse simulator list: ${error}`;
    }
  }

  return "Either deviceId or name is required";
}

async function handleSimulatorShutdown(params: unknown): Promise<string> {
  const validated = SimulatorSchema.parse(params);

  if (validated.simulatorId) {
    const result = await executeCommand("xcrun", ["simctl", "shutdown", validated.simulatorId]);
    return result.success
      ? `Simulator ${validated.simulatorId} shut down`
      : `Failed to shutdown simulator:\n${result.stderr}`;
  }

  // Shutdown all
  const result = await executeCommand("xcrun", ["simctl", "shutdown", "all"]);
  return result.success
    ? "All simulators shut down"
    : `Failed to shutdown simulators:\n${result.stderr}`;
}

async function handleSimulatorInstall(params: unknown): Promise<string> {
  const validated = AppInstallSchema.parse(params);
  const targetDevice = validated.simulatorId || "booted";

  const result = await executeCommand("xcrun", [
    "simctl",
    "install",
    targetDevice,
    validated.appPath,
  ]);

  return result.success
    ? `App installed on ${targetDevice}`
    : `Failed to install app:\n${result.stderr}`;
}

async function handleSimulatorLaunch(params: unknown): Promise<string> {
  const validated = AppLaunchSchema.parse(params);
  const targetDevice = validated.simulatorId || "booted";

  const args = ["simctl", "launch"];
  if (validated.waitForDebugger) {
    args.push("--wait-for-debugger");
  }
  args.push(targetDevice, validated.bundleId);

  const result = await executeCommand("xcrun", args);
  return result.success
    ? `App ${validated.bundleId} launched on ${targetDevice}`
    : `Failed to launch app:\n${result.stderr}`;
}

async function handleSimulatorTerminate(params: unknown): Promise<string> {
  const validated = z.object({
    bundleId: z.string(),
    simulatorId: z.string().optional(),
  }).parse(params);

  const targetDevice = validated.simulatorId || "booted";

  const result = await executeCommand("xcrun", [
    "simctl",
    "terminate",
    targetDevice,
    validated.bundleId,
  ]);

  return result.success
    ? `App ${validated.bundleId} terminated on ${targetDevice}`
    : `Failed to terminate app:\n${result.stderr}`;
}

async function handleSimulatorOpenUrl(params: unknown): Promise<string> {
  const validated = OpenUrlSchema.parse(params);
  const targetDevice = validated.simulatorId || "booted";

  const result = await executeCommand("xcrun", [
    "simctl",
    "openurl",
    targetDevice,
    validated.url,
  ]);

  return result.success
    ? `URL ${validated.url} opened on ${targetDevice}`
    : `Failed to open URL:\n${result.stderr}`;
}

async function handleSimulatorScreenshot(params: unknown): Promise<string> {
  const validated = z.object({
    outputPath: z.string(),
    simulatorId: z.string().optional(),
  }).parse(params);

  const targetDevice = validated.simulatorId || "booted";

  const result = await executeCommand("xcrun", [
    "simctl",
    "io",
    targetDevice,
    "screenshot",
    validated.outputPath,
  ]);

  return result.success
    ? `Screenshot saved to ${validated.outputPath}`
    : `Failed to take screenshot:\n${result.stderr}`;
}

async function handleClean(params: unknown): Promise<string> {
  const validated = ProjectPathSchema.parse(params);
  const args = ["xcodebuild", "clean"];

  if (validated.projectPath) {
    args.push("-project", validated.projectPath);
  }

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? "Clean succeeded"
    : `Clean failed:\n${result.stderr}`;
}

async function handleShowBuildSettings(params: unknown): Promise<string> {
  const validated = z.object({
    projectPath: z.string().optional(),
    scheme: z.string(),
    configuration: z.enum(["Debug", "Release"]).optional().default("Debug"),
  }).parse(params);

  const args = ["xcodebuild", "-scheme", validated.scheme, "-configuration", validated.configuration, "-showBuildSettings"];

  if (validated.projectPath) {
    args.splice(1, 0, "-project", validated.projectPath);
  }

  const result = await executeCommand(args[0], args.slice(1));
  return result.success
    ? result.stdout
    : `Failed to show build settings:\n${result.stderr}`;
}

async function handleRuntimeList(): Promise<string> {
  const result = await executeCommand("xcrun", ["simctl", "list", "runtimes"]);
  return result.success
    ? result.stdout
    : `Failed to list runtimes:\n${result.stderr}`;
}

async function handleDeviceList(): Promise<string> {
  const result = await executeCommand("xcrun", ["xctrace", "list", "devices"]);
  return result.success
    ? result.stdout
    : `Failed to list devices:\n${result.stderr}`;
}

// ============================================================================
// MCP Server Setup
// ============================================================================

async function main() {
  // Platform check
  if (!checkPlatform()) {
    console.error("Error: @ebowwa/mcp-xcode only runs on macOS");
    process.exit(1);
  }

  if (!checkXcodeInstalled()) {
    console.error("Error: Xcode command line tools not installed. Run: xcode-select --install");
    process.exit(1);
  }

  const server = new Server(
    {
      name: "xcode-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args) {
      return {
        content: [{ type: "text", text: `No arguments provided for tool: ${name}` }],
        isError: true,
      };
    }

    try {
      let result: string;

      switch (name) {
        case "xcode_build":
          result = await handleBuild(args);
          break;
        case "xcode_test":
          result = await handleTest(args);
          break;
        case "xcode_archive":
          result = await handleArchive(args);
          break;
        case "xcode_project_info":
          result = await handleProjectInfo(args);
          break;
        case "xcode_scheme_list":
          result = await handleSchemeList(args);
          break;
        case "xcode_destination_list":
          result = await handleDestinationList(args);
          break;
        case "xcode_simulator_list":
          result = await handleSimulatorList();
          break;
        case "xcode_simulator_boot":
          result = await handleSimulatorBoot(args);
          break;
        case "xcode_simulator_shutdown":
          result = await handleSimulatorShutdown(args);
          break;
        case "xcode_simulator_install":
          result = await handleSimulatorInstall(args);
          break;
        case "xcode_simulator_launch":
          result = await handleSimulatorLaunch(args);
          break;
        case "xcode_simulator_terminate":
          result = await handleSimulatorTerminate(args);
          break;
        case "xcode_simulator_open_url":
          result = await handleSimulatorOpenUrl(args);
          break;
        case "xcode_simulator_take_screenshot":
          result = await handleSimulatorScreenshot(args);
          break;
        case "xcode_clean":
          result = await handleClean(args);
          break;
        case "xcode_show_build_settings":
          result = await handleShowBuildSettings(args);
          break;
        case "xcode_runtime_list":
          result = await handleRuntimeList();
          break;
        case "xcode_device_list":
          result = await handleDeviceList();
          break;
        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [{
            type: "text",
            text: `Validation error:\n${error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n")}`,
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stdin.resume();
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
