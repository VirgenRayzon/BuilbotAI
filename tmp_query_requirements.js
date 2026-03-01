const { spawn } = require('child_process');
const readline = require('readline');

const MCP_COMMAND = 'C:\\\\Users\\\\Rayzon\\\\AppData\\\\Roaming\\\\Python\\\\Python314\\\\Scripts\\\\notebooklm-mcp.exe';
const NOTEBOOK_ID = '6aecbdcd-26ae-4738-a773-c5bc05cd01c0';

const child = spawn(MCP_COMMAND, ['server'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, NOTEBOOKLM_MCP_TRANSPORT: 'stdio', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
});

const rl = readline.createInterface({
    input: child.stdout,
    terminal: false
});

let id = 1;

function writeJson(obj) {
    child.stdin.write(JSON.stringify(obj) + '\n');
}

rl.on('line', (line) => {
    if (!line.trim().startsWith('{')) return;
    try {
        const response = JSON.parse(line);
        if (response.id === 1) { // Initialize response
            writeJson({ jsonrpc: '2.0', method: 'notifications/initialized' });

            // Ask for requirements
            writeJson({
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: {
                    name: 'chat_with_notebook',
                    arguments: {
                        request: {
                            message: "Please list all core technical requirements, compatibility rules, pricing logic (currency conversion), and data structure specifications for the BuildbotAI PC building application. Focus on specific constraints like DDR matching, PSU overhead, and currency rates.",
                            notebook_id: NOTEBOOK_ID
                        }
                    }
                }
            });
        } else if (response.id === 2) {
            console.log(JSON.stringify(response.result, null, 2));
            child.kill();
        }
    } catch (err) { }
});

writeJson({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        clientInfo: { name: 'query-client', version: '1.0.0' },
        protocolVersion: '2024-11-05',
        capabilities: {}
    }
});
