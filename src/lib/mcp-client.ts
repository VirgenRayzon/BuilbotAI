import { spawn } from 'child_process';
import readline from 'node:readline';
import fs from 'fs';

const MCP_COMMAND = 'python';
const MCP_SCRIPT = 'c:/Users/Rayzon/Anti Gravity/NotebookLM/mcp_server.py';
const NOTEBOOK_ID = '6aecbdcd-26ae-4738-a773-c5bc05cd01c0';
const DEBUG_LOG = 'grounding-debug.log';

export async function callNotebookTool(toolName: string, args: any) {
    return new Promise((resolve, reject) => {
        const spawnArgs = [MCP_SCRIPT, 'server', '-n', NOTEBOOK_ID];

        fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] Spawning MCP: ${MCP_COMMAND} ${spawnArgs.join(' ')}\n`);

        const child = spawn(MCP_COMMAND, spawnArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                NOTEBOOKLM_MCP_TRANSPORT: 'stdio',
                PYTHONIOENCODING: 'utf-8',
            }
        });

        child.stderr.on('data', (data) => {
            const msg = data.toString();
            fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [MCP STDERR] ${msg}`);
            console.error(`[NotebookLM MCP] ${msg}`);
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
                clientInfo: { name: 'nextn-client', version: '1.0.0' },
                protocolVersion: '2024-11-05',
                capabilities: {}
            }
        };

        const toolRequest = {
            jsonrpc: '2.0',
            id: id++,
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: { ...args, notebook_id: NOTEBOOK_ID }
            }
        };

        let initialized = false;

        rl.on('line', (line) => {
            // Ignore non-JSON lines (noise like ASCII art or logs)
            if (!line.trim().startsWith('{')) return;

            try {
                const response = JSON.parse(line);

                if (response.id === initializeRequest.id) {
                    initialized = true;
                    child.stdin.write(JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'notifications/initialized'
                    }) + '\n');
                    child.stdin.write(JSON.stringify(toolRequest) + '\n');
                } else if (response.id === toolRequest.id) {
                    child.kill();
                    if (response.error) {
                        reject(new Error(`MCP Error: ${JSON.stringify(response.error)}`));
                    } else {
                        resolve(response.result);
                    }
                }
            } catch (err) {
                // Silently skip parse errors for noise lines
            }
        });

        child.on('error', (err) => {
            reject(err);
        });

        child.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                reject(new Error(`MCP server exited with code ${code}`));
            }
        });

        // Start initialization
        child.stdin.write(JSON.stringify(initializeRequest) + '\n');

        // Timeout safety
        setTimeout(() => {
            child.kill();
            reject(new Error('MCP request timed out'));
        }, 120000);
    });
}
