# Logical Code Auditor MCP Server

An MCP (Model Context Protocol) server for **Cursor**, **Claude Desktop**, and other LLM clients. It helps AI analyze your code for business logic errors, race conditions, memory leaks, and edge cases.

While traditional linters and SAST tools look for syntax patterns, this server guides your LLM to run a deep architectural review based on **9 defensive programming pillars**.

---

## Key Features

1. **9-Pillar Code Audit**: Directs the LLM to systematically check the code for:
   - **Control Flow Edge Cases**: What happens if conditions return the opposite of the happy path?
   - **Fault Tolerance**: Explicit timeouts and robust fallback mechanisms on I/O.
   - **State Machine Integrity**: Preventing invalid transitions or out-of-order calls.
   - **Idempotency**: Ensuring repeated actions (like double clicks) don't corrupt state.
   - **Atomicity**: Guaranteeing cleanups and preventing memory/resource leaks.
   - **Resource Limits**: Preventing buffer bloat and handling malicious inputs.
   - **Concurrency (TOCTOU)**: Blocking race conditions between checking and using data.
   - **Input Sanitization**: Preventing injection and keeping data separate from commands.
   - **Circular Dependencies**: Avoiding deadlocks and infinite waits.
2. **Context Degradation Mitigation**: Limits input snippets to 10,000 characters. This forces modular auditing, preventing the LLM from losing analytical focus ("lost-in-the-middle" effect).
3. **Over-Engineering Protection**: The tool dynamically assesses the code's complexity against a requested `risk_level` (`auto`, `low`, `medium`, `critical`). If `critical` audits are requested for trivial logic, the auditor issues a clear over-engineering warning.
4. **Visual Triage (Human-in-the-Loop)**: Instead of long-winded paragraphs, the LLM outputs a scannable Markdown status table. It flags only failing components (`[FAIL]`) and bypasses passing ones (`[PASS]`), prompting for user review before writing any refactored code.

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- NPM

### Build the Server
1. Clone the repository to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the TypeScript source code:
   ```bash
   npm run build
   ```

---

## Configuration

To integrate this server into your LLM client (e.g., Claude Desktop, Cursor), add the following entry to your configuration file (typically `claude_desktop_config.json`):

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
*Make sure to replace `/absolute/path/to/` with the actual path to your repository.*

---

## Usage

Once connected, you can invoke the auditor tool. The LLM will automatically utilize the `full_audit` tool to process code snippets.

### Tool Definition
- **Tool Name**: `full_audit`
- **Arguments**:
  - `code_snippet` (string, required): The target code to audit.
  - `risk_level` (string, optional): Enforcement mode (`auto`, `low`, `medium`, `critical`).

---

## License

This software is licensed under the **Apache License 2.0** with the **"Commons Clause" License Condition v1.0**.

**Source-Available (Código Disponible)**: You are free to read, modify, and run the software locally. However, you are strictly prohibited from selling the software or offering it as a commercial hosted service. See the [LICENSE](LICENSE) file for the full legal terms.
