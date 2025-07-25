class XcodeMCPClient {
    constructor() {
        this.commands = {};
        this.categories = [];
        this.commandHistory = [];
        this.currentCommand = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadCommands();
    }
    
    initializeElements() {
        this.elements = {
            categoryFilter: document.getElementById('categoryFilter'),
            commandSelect: document.getElementById('commandSelect'),
            commandInfo: document.getElementById('commandInfo'),
            parametersContainer: document.getElementById('parametersContainer'),
            executeBtn: document.getElementById('executeBtn'),
            statusIndicator: document.getElementById('statusIndicator'),
            rawCommand: document.getElementById('rawCommand'),
            outputText: document.getElementById('outputText'),
            historyContainer: document.getElementById('historyContainer'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn')
        };
    }
    
    attachEventListeners() {
        this.elements.categoryFilter.addEventListener('change', () => this.filterCommands());
        this.elements.commandSelect.addEventListener('change', () => this.selectCommand());
        this.elements.executeBtn.addEventListener('click', () => this.executeCommand());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }
    
    async loadCommands() {
        try {
            const response = await fetch('/api/commands');
            const data = await response.json();
            
            this.commands = data.commands;
            this.categories = data.categories;
            
            this.populateCategories();
            this.populateCommands();
        } catch (error) {
            console.error('Failed to load commands:', error);
            this.showError('Failed to load commands');
        }
    }
    
    populateCategories() {
        this.elements.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            this.elements.categoryFilter.appendChild(option);
        });
    }
    
    populateCommands() {
        const selectedCategory = this.elements.categoryFilter.value;
        this.elements.commandSelect.innerHTML = '';
        
        Object.entries(this.commands).forEach(([name, command]) => {
            if (selectedCategory === 'all' || command.category === selectedCategory) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = `${name} - ${command.description}`;
                this.elements.commandSelect.appendChild(option);
            }
        });
        
        this.elements.executeBtn.disabled = true;
        this.elements.commandInfo.innerHTML = '<p>Select a command to see details</p>';
    }
    
    filterCommands() {
        this.populateCommands();
    }
    
    selectCommand() {
        const commandName = this.elements.commandSelect.value;
        if (!commandName) return;
        
        this.currentCommand = this.commands[commandName];
        this.displayCommandInfo();
        this.buildParameterInputs();
        this.elements.executeBtn.disabled = false;
    }
    
    displayCommandInfo() {
        if (!this.currentCommand) return;
        
        let info = `<h4>${this.currentCommand.name}</h4>`;
        info += `<p><strong>Description:</strong> ${this.currentCommand.description}</p>`;
        info += `<p><strong>Category:</strong> ${this.currentCommand.category || 'general'}</p>`;
        
        if (this.currentCommand.platforms) {
            info += `<p><strong>Platforms:</strong> ${this.currentCommand.platforms.join(', ')}</p>`;
        }
        
        info += `<p><strong>Command:</strong> <code>${this.escapeHtml(this.currentCommand.command)}</code></p>`;
        
        this.elements.commandInfo.innerHTML = info;
    }
    
    buildParameterInputs() {
        if (!this.currentCommand) return;
        
        this.elements.parametersContainer.innerHTML = '';
        
        if (!this.currentCommand.parameters || Object.keys(this.currentCommand.parameters).length === 0) {
            this.elements.parametersContainer.innerHTML = '<p class="muted">No parameters required</p>';
            return;
        }
        
        Object.entries(this.currentCommand.parameters).forEach(([paramName, paramInfo]) => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'parameter-input';
            
            const label = document.createElement('label');
            label.innerHTML = `${paramName} ${paramInfo.required ? '<span class="required-marker">*</span>' : ''}`;
            label.setAttribute('for', `param-${paramName}`);
            
            let input;
            if (paramInfo.type === 'boolean') {
                const wrapper = document.createElement('div');
                wrapper.className = 'checkbox-wrapper';
                
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = `param-${paramName}`;
                input.name = paramName;
                
                wrapper.appendChild(input);
                wrapper.appendChild(label);
                inputDiv.appendChild(wrapper);
            } else {
                inputDiv.appendChild(label);
                
                input = document.createElement('input');
                input.type = paramInfo.type === 'number' ? 'number' : 'text';
                input.id = `param-${paramName}`;
                input.name = paramName;
                input.placeholder = paramInfo.description;
                
                if (paramInfo.default !== undefined) {
                    input.value = paramInfo.default;
                }
                
                inputDiv.appendChild(input);
            }
            
            this.elements.parametersContainer.appendChild(inputDiv);
        });
    }
    
    async executeCommand() {
        if (!this.currentCommand) return;
        
        this.elements.executeBtn.disabled = true;
        this.updateStatus('running');
        
        const commandName = this.elements.commandSelect.value;
        const parameters = this.collectParameters();
        
        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    commandName,
                    parameters
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.displayResult(result);
                this.addToHistory(commandName, parameters, result);
            } else {
                this.showError(result.error || 'Command execution failed');
            }
        } catch (error) {
            console.error('Execution error:', error);
            this.showError('Failed to execute command');
        } finally {
            this.elements.executeBtn.disabled = false;
        }
    }
    
    collectParameters() {
        const parameters = {};
        
        if (!this.currentCommand.parameters) return parameters;
        
        Object.keys(this.currentCommand.parameters).forEach(paramName => {
            const input = document.getElementById(`param-${paramName}`);
            if (input) {
                if (input.type === 'checkbox') {
                    parameters[paramName] = input.checked;
                } else if (input.value) {
                    parameters[paramName] = input.value;
                }
            }
        });
        
        return parameters;
    }
    
    displayResult(result) {
        this.updateStatus(result.success ? 'success' : 'error');
        this.elements.rawCommand.textContent = result.command || 'N/A';
        
        let output = '';
        if (result.output) {
            output += result.output;
        }
        if (result.error) {
            output += `\n\n=== Errors/Warnings ===\n${result.error}`;
        }
        
        this.elements.outputText.textContent = output || 'No output';
    }
    
    showError(message) {
        this.updateStatus('error');
        this.elements.outputText.textContent = `Error: ${message}`;
    }
    
    updateStatus(status) {
        this.elements.statusIndicator.className = `status-indicator ${status}`;
    }
    
    addToHistory(commandName, parameters, result) {
        const historyItem = {
            timestamp: new Date().toLocaleString(),
            commandName,
            parameters,
            success: result.success,
            command: result.command
        };
        
        this.commandHistory.unshift(historyItem);
        if (this.commandHistory.length > 20) {
            this.commandHistory.pop();
        }
        
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        if (this.commandHistory.length === 0) {
            this.elements.historyContainer.innerHTML = '<p class="muted">No commands executed yet</p>';
            return;
        }
        
        const historyHtml = this.commandHistory.map(item => {
            const statusClass = item.success ? 'success' : 'error';
            const statusIcon = item.success ? '✅' : '❌';
            
            let html = `<div class="history-item ${statusClass}">`;
            html += `<span class="timestamp">${item.timestamp}</span>`;
            html += `<span class="command-name">${statusIcon} ${item.commandName}</span>`;
            
            if (Object.keys(item.parameters).length > 0) {
                html += `<br><small>Params: ${JSON.stringify(item.parameters)}</small>`;
            }
            
            html += '</div>';
            return html;
        }).join('');
        
        this.elements.historyContainer.innerHTML = historyHtml;
    }
    
    clearHistory() {
        this.commandHistory = [];
        this.updateHistoryDisplay();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new XcodeMCPClient();
});