import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FileManager } from './file-manager.js';

const execAsync = promisify(exec);

export interface CommandParameter {
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  default?: any;
  description: string;
  template?: string;
}

export interface XcodeCommand {
  name: string;
  description: string;
  command: string;
  parameters?: Record<string, CommandParameter>;
  output_format?: 'text' | 'json';
  category: string;
  platforms?: string[];
}

export interface CommandDefinitions {
  xcode_commands: Record<string, XcodeCommand>;
}

export class CommandExecutor {
  private commands: Record<string, XcodeCommand> = {};
  private commandsPath: string;
  private fileManager: FileManager;

  constructor(commandsPath?: string) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.commandsPath = commandsPath || path.join(__dirname, '..', 'commands.json');
    this.fileManager = new FileManager();
  }

  async loadCommands(): Promise<void> {
    try {
      const content = await fs.readFile(this.commandsPath, 'utf-8');
      const definitions: CommandDefinitions = JSON.parse(content);
      this.commands = definitions.xcode_commands;
    } catch (error) {
      throw new Error(`Failed to load commands from ${this.commandsPath}: ${error}`);
    }
  }

  getAvailableCommands(): Record<string, XcodeCommand> {
    return this.commands;
  }

  getCommandsByCategory(category: string): Record<string, XcodeCommand> {
    return Object.fromEntries(
      Object.entries(this.commands).filter(([_, cmd]) => cmd.category === category)
    );
  }

  getCommand(name: string): XcodeCommand | undefined {
    return this.commands[name];
  }

  validateParameters(command: XcodeCommand, args: Record<string, any>): void {
    if (!command.parameters) return;

    for (const [paramName, paramDef] of Object.entries(command.parameters)) {
      const value = args[paramName];
      
      if (paramDef.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Required parameter '${paramName}' is missing`);
      }

      if (value !== undefined && paramDef.type === 'string' && typeof value !== 'string') {
        throw new Error(`Parameter '${paramName}' must be a string`);
      }
    }
  }

  buildCommand(command: XcodeCommand, args: Record<string, any>): string {
    let builtCommand = command.command;

    // Replace required parameters
    if (command.parameters) {
      for (const [paramName, paramDef] of Object.entries(command.parameters)) {
        const value = args[paramName] !== undefined ? args[paramName] : paramDef.default;
        
        if (paramDef.type === 'boolean') {
          // Handle boolean parameters
          if (value === true) {
            // Replace placeholder with the template if true
            builtCommand = builtCommand.replace(`{${paramName}}`, paramDef.template || '');
          } else {
            // Remove placeholder if false
            builtCommand = builtCommand.replace(`{${paramName}}`, '');
          }
        } else if (value !== undefined && value !== null && value !== '') {
          if (paramDef.template) {
            // Use custom template for parameter
            const paramValue = paramDef.template.replace(`{${paramName}}`, value);
            builtCommand = builtCommand.replace(`{${paramName}}`, paramValue);
          } else {
            // Direct replacement
            builtCommand = builtCommand.replace(`{${paramName}}`, value);
          }
        } else {
          // Remove optional parameter placeholders
          builtCommand = builtCommand.replace(new RegExp(`\\s*\\{${paramName}\\}`, 'g'), '');
        }
      }
    }

    // Clean up any remaining placeholder patterns
    builtCommand = builtCommand.replace(/\s+/g, ' ').trim();
    
    return builtCommand;
  }

  async executeCommand(name: string, args: Record<string, any> = {}): Promise<{
    success: boolean;
    output: string;
    error?: string;
    command: string;
  }> {
    const command = this.getCommand(name);
    if (!command) {
      throw new Error(`Command '${name}' not found`);
    }

    this.validateParameters(command, args);

    // Handle internal commands
    if (command.command.startsWith('internal:')) {
      return await this.executeInternalCommand(command, args);
    }

    // Handle external commands
    const builtCommand = this.buildCommand(command, args);

    try {
      const { stdout, stderr } = await execAsync(builtCommand);
      
      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        command: builtCommand
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        command: builtCommand
      };
    }
  }

  private async executeInternalCommand(command: XcodeCommand, args: Record<string, any>): Promise<{
    success: boolean;
    output: string;
    error?: string;
    command: string;
  }> {
    const internalCommand = command.command.replace('internal:', '');
    
    try {
      let output = '';
      
      switch (internalCommand) {
        case 'file_write':
          await this.fileManager.writeFile(args.file_path, args.content);
          output = `File created successfully at: ${args.file_path}`;
          break;
          
        case 'create_project':
          await this.fileManager.createXcodeProject(
            args.project_path,
            args.project_name,
            args.bundle_id,
            args.platform || 'ios'
          );
          output = `Project '${args.project_name}' created successfully at: ${args.project_path}`;
          break;
          
        case 'modify_plist':
          await this.fileManager.modifyPlist(args.plist_path, args.key, args.value);
          output = `Plist modified successfully: ${args.key} = ${args.value}`;
          break;
          
        case 'add_plist_entry':
          await this.fileManager.addPlistEntry(args.plist_path, args.key, args.type, args.value);
          output = `Plist entry added successfully: ${args.key} = ${args.value}`;
          break;
          
        case 'create_directory':
          await this.fileManager.createDirectory(args.path);
          output = `Directory created successfully at: ${args.path}`;
          break;
          
        case 'read_file':
          output = await this.fileManager.readFile(args.file_path);
          break;
          
        case 'build_with_auto_team':
          // Dynamically detect team and build
          const teamId = await this.fileManager.getDefaultDevelopmentTeam();
          const teamFlag = teamId ? `DEVELOPMENT_TEAM=${teamId}` : '';
          
          const buildCommand = `xcodebuild -project "${args.project_path}" -scheme "${args.scheme}" -destination "id=${args.device_id}" ${teamFlag} -allowProvisioningUpdates -allowProvisioningDeviceRegistration build`;
          
          const { stdout, stderr } = await execAsync(buildCommand);
          output = stdout;
          if (stderr) output += `\n\nWarnings/Errors:\n${stderr}`;
          break;
          
        default:
          throw new Error(`Unknown internal command: ${internalCommand}`);
      }
      
      return {
        success: true,
        output,
        error: undefined,
        command: `internal:${internalCommand}`
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        command: `internal:${internalCommand}`
      };
    }
  }

  // Helper method to get command suggestions based on partial input
  getCommandSuggestions(partial: string): string[] {
    const lowerPartial = partial.toLowerCase();
    return Object.keys(this.commands)
      .filter(name => name.toLowerCase().includes(lowerPartial))
      .sort();
  }

  // Get commands that work with specific file types
  getCommandsForFileType(fileExtension: string): Record<string, XcodeCommand> {
    const relevantCommands: Record<string, XcodeCommand> = {};
    
    for (const [name, command] of Object.entries(this.commands)) {
      if (command.parameters) {
        for (const [paramName, paramDef] of Object.entries(command.parameters)) {
          if (paramDef.description.toLowerCase().includes(fileExtension.toLowerCase())) {
            relevantCommands[name] = command;
            break;
          }
        }
      }
    }
    
    return relevantCommands;
  }

  // Add new command dynamically
  async addCommand(name: string, command: XcodeCommand): Promise<void> {
    this.commands[name] = command;
    
    // Save back to file
    const definitions: CommandDefinitions = {
      xcode_commands: this.commands
    };
    
    await fs.writeFile(this.commandsPath, JSON.stringify(definitions, null, 2));
  }

  // Generate MCP tool definitions from commands
  generateMCPToolDefinitions(): Array<{
    name: string;
    description: string;
    inputSchema: any;
  }> {
    return Object.entries(this.commands).map(([name, command]) => ({
      name: `xcode_${name}`,
      description: command.description,
      inputSchema: {
        type: 'object',
        properties: command.parameters ? Object.fromEntries(
          Object.entries(command.parameters).map(([paramName, paramDef]) => [
            paramName,
            {
              type: paramDef.type,
              description: paramDef.description,
              ...(paramDef.default !== undefined && { default: paramDef.default })
            }
          ])
        ) : {},
        required: command.parameters ? Object.entries(command.parameters)
          .filter(([_, paramDef]) => paramDef.required)
          .map(([paramName]) => paramName) : []
      }
    }));
  }
}