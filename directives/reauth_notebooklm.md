# Directive: Handling NotebookLM Authentication

## Goal
Restore access to the NotebookLM RAG system when session cookies expire.

## Context
Google session cookies typically expire every few weeks, causing the "Authentication expired or invalid" error in `grounding-debug.log`.

## Steps
1. **Detect Error:**
   - Look for `Authentication expired or invalid` messages in the logs.
   - The MCP server will return a JSON error with `status: "error"`.

2. **Re-authenticate:**
   - Run the following command in the terminal:
     ```powershell
     $env:PYTHONUTF8=1; & "C:\Users\Rayzon\AppData\Roaming\Python\Python314\Scripts\notebooklm.exe" login
     ```
   - This opens a browser window.
   - Wait for the user to complete the Google login.
   - When the user confirms, focus the terminal and press **ENTER**.

3. **Verify:**
   - Run an MCP tool call like `list_notebooks` to ensure the new `storage_state.json` is working.

## Edge Cases
- **Encoding Errors:** If the command fails with a `UnicodeEncodeError`, ensure `$env:PYTHONUTF8=1` is set.
- **Path Issues:** Always use the absolute path to `notebooklm.exe` in the Python scripts directory.
