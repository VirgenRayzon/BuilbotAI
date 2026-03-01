const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const MCP_COMMAND = 'C:\\\\Users\\\\Rayzon\\\\AppData\\\\Roaming\\\\Python\\\\Python314\\\\Scripts\\\\notebooklm-mcp.exe';
const NOTEBOOK_ID = '6aecbdcd-26ae-4738-a773-c5bc05cd01c0';

const child = spawn(MCP_COMMAND, ['server'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, NOTEBOOKLM_MCP_TRANSPORT: 'stdio', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
});

const rl = readline.createInterface({ input: child.stdout, terminal: false });
let id = 1;
const queries = [
    "List ALL the core business logic rules for BuildbotAI. Include: PSU overhead requirements, bottleneck tier system, currency conversion rates, DDR matching requirements, and any other specific technical constraints.",
    "What are the exact data structures and fields expected for a PC Component in BuildbotAI?",
    "What compatibility checks must the system perform? List every rule including socket, RAM DDR generation, form factor, cooler TDP, GPU clearance, and any special motherboard connectors.",
];
let queryIndex = 0;
let responses = [];

function writeJson(obj) { child.stdin.write(JSON.stringify(obj) + '\n'); }

rl.on('line', (line) => {
    if (!line.trim().startsWith('{')) return;
    try {
        const response = JSON.parse(line);
        if (response.id === 1) { // init
            writeJson({ jsonrpc: '2.0', method: 'notifications/initialized' });
            sendNextQuery();
        } else if (response.id >= 2) {
            const content = response.result?.content?.[0]?.text || JSON.stringify(response.result);
            responses.push({ query: queries[queryIndex - 1], response: content });
            if (queryIndex < queries.length) {
                sendNextQuery();
            } else {
                fs.writeFileSync('notebook_specs.json', JSON.stringify(responses, null, 2), 'utf-8');
                console.log('Specs saved to notebook_specs.json');
                setTimeout(() => child.kill(), 500);
            }
        }
    } catch (err) { console.error('Parse error:', err.message); }
});

function sendNextQuery() {
    writeJson({
        jsonrpc: '2.0',
        id: queryIndex + 2,
        method: 'tools/call',
        params: {
            name: 'chat_with_notebook',
            arguments: { request: { message: queries[queryIndex], notebook_id: NOTEBOOK_ID } }
        }
    });
    queryIndex++;
}

writeJson({
    jsonrpc: '2.0', id: 1,
    method: 'initialize',
    params: { clientInfo: { name: 'audit-client', version: '1.0.0' }, protocolVersion: '2024-11-05', capabilities: {} }
});

setTimeout(() => { child.kill(); process.exit(0); }, 120000);
