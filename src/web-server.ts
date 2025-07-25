import express from 'express';
import cors from 'cors';
import path from 'path';
import { CommandExecutor } from './command-executor.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const commandExecutor = new CommandExecutor();

// Initialize command executor
async function init() {
  await commandExecutor.loadCommands();
  console.log('Commands loaded successfully');
}

// API Routes
app.get('/api/commands', async (req, res) => {
  try {
    const commands = commandExecutor.getAvailableCommands();
    const categories = new Set<string>();
    
    // Extract categories
    Object.values(commands).forEach((cmd: any) => {
      if (cmd.category) {
        categories.add(cmd.category);
      }
    });
    
    res.json({
      commands,
      categories: Array.from(categories).sort()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load commands' });
  }
});

app.get('/api/commands/:name', async (req, res) => {
  try {
    const command = commandExecutor.getCommand(req.params.name);
    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }
    res.json(command);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get command' });
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { commandName, parameters } = req.body;
    
    if (!commandName) {
      return res.status(400).json({ error: 'Command name is required' });
    }
    
    const result = await commandExecutor.executeCommand(commandName, parameters || {});
    res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Command execution failed',
      success: false
    });
  }
});

// Serve the web interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
init().then(() => {
  app.listen(PORT, () => {
    console.log(`Xcode MCP Web Interface running at http://localhost:${PORT}`);
  });
}).catch(console.error);