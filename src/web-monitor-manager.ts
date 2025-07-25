import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WebMonitorManager {
  private webServerProcess: ChildProcess | null = null;
  private port: number = 3000;
  private isRunning: boolean = false;

  constructor() {}

  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', () => {
        resolve(false);
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, '127.0.0.1');
    });
  }

  async findAvailablePort(startPort: number = 3000): Promise<number> {
    let port = startPort;
    while (port < startPort + 100) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
      port++;
    }
    throw new Error('No available ports found');
  }

  async start(): Promise<{ url: string; port: number; message: string }> {
    if (this.isRunning && this.webServerProcess) {
      return {
        url: `http://localhost:${this.port}`,
        port: this.port,
        message: 'Web monitor is already running'
      };
    }

    try {
      // Find an available port
      this.port = await this.findAvailablePort();
      
      // Spawn the web server process
      const webServerPath = join(__dirname, 'web-server.js');
      
      console.error(`[WebMonitor] Starting web server at ${webServerPath} on port ${this.port}`);
      
      this.webServerProcess = spawn('node', [webServerPath], {
        env: { ...process.env, PORT: this.port.toString() },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      // Wait for the "running at" message
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Web server failed to start within timeout'));
        }, 5000);

        if (this.webServerProcess!.stdout) {
          this.webServerProcess!.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('running at')) {
              clearTimeout(timeout);
              resolve();
            }
          });
        }

        this.webServerProcess!.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        this.webServerProcess!.on('exit', (code) => {
          clearTimeout(timeout);
          reject(new Error(`Web server exited with code ${code}`));
        });
      });

      this.isRunning = true;

      // Handle process cleanup
      this.webServerProcess.on('exit', () => {
        this.isRunning = false;
        this.webServerProcess = null;
      });

      const url = `http://localhost:${this.port}`;
      return {
        url,
        port: this.port,
        message: `Web monitor started successfully at ${url}`
      };
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop(): { message: string } {
    if (this.webServerProcess) {
      this.webServerProcess.kill('SIGTERM');
      this.webServerProcess = null;
      this.isRunning = false;
      return { message: 'Web monitor stopped successfully' };
    }
    return { message: 'Web monitor was not running' };
  }

  getStatus(): { running: boolean; port?: number; url?: string } {
    if (this.isRunning && this.webServerProcess) {
      return {
        running: true,
        port: this.port,
        url: `http://localhost:${this.port}`
      };
    }
    return { running: false };
  }
}