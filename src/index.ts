#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { CommandExecutor } from './command-executor.js';
import { WebMonitorManager } from './web-monitor-manager.js';

class XcodeMCPServer {
  private server: Server;
  private commandExecutor: CommandExecutor;
  private webMonitorManager: WebMonitorManager;

  constructor() {
    this.server = new Server(
      {
        name: 'xcode-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.commandExecutor = new CommandExecutor();
    this.webMonitorManager = new WebMonitorManager();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      this.webMonitorManager.stop();
      await this.server.close();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      this.webMonitorManager.stop();
      await this.server.close();
      process.exit(0);
    });
  }

  private async setupToolHandlers(): Promise<void> {
    // Load commands and dynamically create tool list
    await this.commandExecutor.loadCommands();
    const tools = this.commandExecutor.generateMCPToolDefinitions();

    // Add web monitor management tools
    const webMonitorTools = [
      {
        name: 'start_web_monitor',
        description: 'Start the web interface for visual command execution and monitoring',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'stop_web_monitor',
        description: 'Stop the web interface if it is running',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'web_monitor_status',
        description: 'Get the current status of the web monitor',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [...tools, ...webMonitorTools],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Handle web monitor tools
        if (name === 'start_web_monitor') {
          const result = await this.webMonitorManager.start();
          return {
            content: [
              {
                type: 'text',
                text: `${result.message}\n\nWeb interface available at: ${result.url}`
              }
            ]
          };
        }
        
        if (name === 'stop_web_monitor') {
          const result = this.webMonitorManager.stop();
          return {
            content: [
              {
                type: 'text',
                text: result.message
              }
            ]
          };
        }
        
        if (name === 'web_monitor_status') {
          const status = this.webMonitorManager.getStatus();
          let text = status.running 
            ? `Web monitor is running at ${status.url} (port ${status.port})`
            : 'Web monitor is not running';
          return {
            content: [
              {
                type: 'text',
                text: text
              }
            ]
          };
        }
        
        // Handle Xcode commands
        // Remove 'xcode_' prefix if present
        const commandName = name.startsWith('xcode_') ? name.slice(6) : name;
        const result = await this.commandExecutor.executeCommand(commandName, args);
        
        let responseText = result.output;
        if (result.error) {
          responseText += `\n\nWarnings/Errors:\n${result.error}`;
        }
        if (!result.success) {
          responseText = `Command failed: ${result.error}\n\nCommand executed: ${result.command}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  async run(): Promise<void> {
    await this.setupToolHandlers();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Xcode MCP server v2.0 running on stdio');
  }
}

const server = new XcodeMCPServer();
server.run().catch(console.error);