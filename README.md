# Logical Code Auditor MCP Server

This is a Model Context Protocol (MCP) server for AI coding assistants like **Cursor** and **Claude Desktop**. 

It acts as a strict, automated safety checklist for your AI. When you ask the AI to review or write code, this server forces it to look for sneaky logic bugs, edge cases, and architectural flaws before they reach production.

---

## What does it actually do? (For Humans)

Most code scanners (like linters) only check for formatting typos or known security vulnerabilities. They are completely blind to **business logic errors**. 

This server solves that. It instructs the AI to run your code through a rigorous audit of **9 defensive programming pillars**:

1. **Edge Cases**: "What if this condition returns the exact opposite of what we expect?"
2. **Timeouts & Resiliency**: "What if this API call or database query hangs forever?" (Forces explicit timeouts).
3. **State Machine Safety**: "What if this function is called out of order (e.g., clicking 'Back' or resubmitting a form halfway through)?"
4. **Double Actions (Idempotency)**: "What if a user double-clicks a submit button rapidly?" (Forces concurrency guards).
5. **Cleanups (Atomicity)**: "What if a transaction fails halfway? Are we cleaning up files, connections, and memory?"
6. **Input Boundaries**: "What if someone sends a payload that is 10,000x larger than expected?"
7. **Race Conditions**: "What if another process modifies our data in the millisecond between us checking it and using it?"
8. **Security Sanitization**: "Could a user sneak executable code into this input?"
9. **Deadlocks**: "Are two components waiting for each other infinitely?"

### How it works in practice:
Instead of the AI giving you a wall of text or making blind edits, it will:
1. Analyze the code using these 9 pillars.
2. Present a clean, scannable **Markdown Table** (Visual Triage) showing which pillars passed (`[PASS]`) and which failed (`[FAIL]`).
3. **Wait for your approval** before writing or modifying any code.

---

## Known Issues & Limitations

While this tool significantly improves code quality, you should be aware of these design limits:

* **File Size Cap (10k characters)**: The server rejects files larger than 10,000 characters. You cannot audit entire applications at once. You must audit code modularly, component by component, to prevent the AI from losing focus.
* **Dependent on LLM Intelligence**: This tool does *not* scan code itself; it guides the AI on *how* to scan it. The depth of the audit depends on the capability of the model you use (e.g., Claude 3.5 Sonnet will find much deeper logical bugs than a smaller, faster model).
* **No Auto-Fixes**: The tool deliberately stops the AI from immediately writing code fixes. You must review the Visual Triage table first. If you want a quick "one-click fix," this extra step might feel slightly slower, but it prevents the AI from introducing new bugs.
* **Local Stdio Process**: Since it communicates via standard input/output (stdio), it must be installed and compiled locally on the machine running your IDE/Client.

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- NPM

### Build the Server
1. Clone this repository locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the TypeScript code:
   ```bash
   npm run build
   ```

---

## Configuration

Add this entry to your client configuration file (e.g., `claude_desktop_config.json` or Cursor's MCP settings):

```json
{
  "mcpServers": {
    "defensive-logical-auditor": {
      "command": "node",
      "args": [
        "/absolute/path/to/defensive-logical-auditor/build/index.js"
      ]
    }
  }
}
```
*Be sure to replace `/absolute/path/to/` with the actual path where you cloned the repository.*

---

## License

This software is licensed under the **Apache License 2.0** with the **"Commons Clause" License Condition v1.0**.

**Source-Available (Código Disponible)**: You are free to view, edit, and run the software locally. However, you are strictly prohibited from selling this software or offering it as a commercial hosted service. See the [LICENSE](LICENSE) file for details.
