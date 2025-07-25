# Contributing to Xcode MCP

First off, thank you for considering contributing to Xcode MCP! It's people like you that make this tool better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Include your environment details** (macOS version, Xcode version, Node.js version)
- **Include relevant logs** from `~/Library/Logs/Claude/mcp-server-xcode-mcp.log`

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code follows the existing style
4. Make sure your code lints (`npm run lint`)
5. Write a meaningful commit message
6. Push to your fork and submit a pull request

## Development Process

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/xcode-mcp.git
cd xcode-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Project Structure

```
xcode-mcp/
├── src/                    # Source TypeScript files
│   ├── index.ts           # Main MCP server entry
│   ├── command-executor.ts # Command execution logic
│   ├── file-manager.ts    # File operations
│   └── web-monitor-manager.ts # Web interface
├── dist/                  # Compiled JavaScript (generated)
├── commands.json          # Tool definitions
└── package.json          # Project metadata
```

### Adding New Tools

1. Add tool definition to `commands.json`
2. If it's an internal command, implement in `command-executor.ts`
3. Update README.md with the new tool
4. Add tests if applicable

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style (2 spaces, no semicolons where optional)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add support for workspace file operations

- Implement create_workspace_file tool
- Add workspace path validation
- Update documentation

Fixes #123
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag: `git tag v1.2.3`
4. Push the tag: `git push origin v1.2.3`
5. GitHub Actions will handle the release

## Questions?

Feel free to open an issue with your question or reach out in discussions.

## Recognition

Contributors will be recognized in our README.md. Thank you for your contributions!