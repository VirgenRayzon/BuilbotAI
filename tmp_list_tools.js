const { spawn } = require('child_process');
const readline = require('readline');

const MCP_COMMAND = 'C:\\\\Users\\\\Rayzon\\\\AppData\\\\Roaming\\\\Python\\\\Python314\\\\Scripts\\\\notebooklm-mcp.exe';

const child = spawn(MCP_COMMAND, ['server'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, NOTEBOOKLM_MCP_TRANSPORT: 'stdio', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
});

const rl = readline.createInterface({
    input: child.stdout,
    terminal: false
});

let id = 1;
const initializeRequest = {
    jsonrpc: '2.0',
    id: id++,
    method: 'initialize',
    params: {
        clientInfo: { name: 'query-client', version: '1.0.0' },
        protocolVersion: '2024-11-05',
        capabilities: {}
    }
};

rl.on('line', (line) => {
    if (!line.trim().startsWith('{')) return;
    try {
        const response = JSON.parse(line);
        if (response.id === initializeRequest.id) {
            child.stdin.write(JSON.stringify({
                jsonrpc: '2.0',
                method: 'notifications/initialized'
            }) + '\n');

            // Ask for tools/list
            child.stdin.write(JSON.stringify({
                jsonrpc: '2.0',
                id: id++,
                method: 'tools/list',
                params: {}
            }) + '\n');
        } else if (response.result && response.result.tools) {
            console.log(JSON.stringify(response.result.tools, null, 2));
            child.kill();
        }
    } catch (err) {
    }
});

child.stdin.write(JSON.stringify(initializeRequest) + '\n');
