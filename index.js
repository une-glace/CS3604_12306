#!/usr/bin/env node
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const server = new McpServer({
  name: "Agile-Architect-Manager",
  version: "2.0.0",
});

const {
  loadYaml,
  saveYaml,
  validateInputs,
  flattenPreOrder,
  popNextRequirement,
  updateRequirementArtifacts,
  registerInterfaceItem,
  initGraphFromRequirements,
  updateGraphNode,
  runCommand
} = require('./utils.js');


// --- 1. Init Queue (Top-Down Only) ---
server.tool(
  "init_top_down_queue",
  "Initialize Agile Development Queue (Top-Down). [REQUIRED: project_root, requirements_path].",
  {
    project_root: z.string().describe("MANDATORY. Project root path."),
    requirements_path: z.string().describe("MANDATORY. Requirements file path."),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root, requirements_path } = args;

    try {
      const outputPath = path.join(project_root, 'artifacts', 'phase_one_progress.yaml');
      if (fs.existsSync(outputPath)) {
        return { content: [{ type: "text", text: `Queue already initialized at: ${outputPath}` }] };
      }
      const rawReqs = loadYaml(requirements_path);
      if (!rawReqs) return { content: [{ type: "text", text: `Failed to load requirements file.` }] };

      const queue = [];
      flattenPreOrder(rawReqs, queue);
      saveYaml(outputPath, queue);

      // Initialize Architecture Graph
      initGraphFromRequirements(project_root, rawReqs);

      return { content: [{ type: "text", text: `Initialized Agile queue with ${queue.length} items.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- 2. Pop Next Requirement (Agile Mode) ---
server.tool(
  "pop_next_requirement",
  "Get next requirement for Agile implementation (Design -> Test -> Code).",
  {
    project_root: z.string().describe("MANDATORY. Project root path."),
    requirements_path: z.string().describe("MANDATORY. Requirements file path."),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root, requirements_path } = args;

    try {
      // Reusing the same progress file logic
      const result = await popNextRequirement(project_root, 'phase_one_progress.yaml', requirements_path);
      if (result && result.formattedOutput) {
        return { content: [{ type: "text", text: result.formattedOutput }] };
      }
      const textResult = result ? yaml.dump(result) : "Error: Internal function returned null";
      return { content: [{ type: "text", text: textResult }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- 3. Register UI ---
server.tool(
  "register_ui_component",
  "Register UI Component after design/impl.",
  {
    project_root: z.string(),
    id: z.string(),
    path: z.string(),
    description: z.string().optional(),
    related_req_id: z.string(),
    upstream_ids: z.array(z.string()).optional(),
    downstream_ids: z.array(z.string()).optional(),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root, id, related_req_id, path, description, ...data } = args;
    
    try {
      registerInterfaceItem(project_root, 'ui_interface.yaml', id, { related_req_id, path, description, ...data }, ['upstream_ids', 'downstream_ids']);
      if (related_req_id) updateRequirementArtifacts(project_root, related_req_id, 'ui_ids', id);
      updateGraphNode(project_root, 'UI', id, { path, description }, { related_req_id, upstream_ids: data.upstream_ids, downstream_ids: data.downstream_ids });

      return { content: [{ type: "text", text: `Registered UI ${id}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- 4. Register API ---
server.tool(
  "register_api_endpoint",
  "Register API Endpoint after design/impl.",
  {
    project_root: z.string(),
    id: z.string(),
    path: z.string(),
    signature: z.string(),
    related_req_id: z.string(),
    upstream_ids: z.array(z.string()).optional(),
    downstream_ids: z.array(z.string()).optional(),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root, id, related_req_id, path, signature, ...data } = args;

    try {
      registerInterfaceItem(project_root, 'api_interface.yaml', id, { related_req_id, path, signature, ...data }, ['upstream_ids', 'downstream_ids']);
      if (related_req_id) updateRequirementArtifacts(project_root, related_req_id, 'api_ids', id);
      updateGraphNode(project_root, 'API', id, { path, signature }, { related_req_id, upstream_ids: data.upstream_ids, downstream_ids: data.downstream_ids });

      return { content: [{ type: "text", text: `Registered API ${id}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- 5. Register Func ---
server.tool(
  "register_backend_function",
  "Register Backend Function after design/impl.",
  {
    project_root: z.string(),
    id: z.string(),
    path: z.string(),
    signature: z.string(),
    related_req_id: z.string(),
    upstream_ids: z.array(z.string()).optional(),
    db_tables: z.array(z.string()).optional(),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root, id, related_req_id, path, signature, ...data } = args;

    try {
      registerInterfaceItem(project_root, 'func_interface.yaml', id, { related_req_id, path, signature, ...data }, ['upstream_ids', 'db_tables']);
      if (related_req_id) updateRequirementArtifacts(project_root, related_req_id, 'func_ids', id);
      updateGraphNode(project_root, 'FUNC', id, { path, signature }, { related_req_id, upstream_ids: data.upstream_ids, db_tables: data.db_tables });

      return { content: [{ type: "text", text: `Registered FUNC ${id}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- 6. Save Progress (Commit) ---
server.tool(
  "save_progress",
  "Commit changes to Git after successful implementation. [REQUIRED: project_root, message].",
  {
    project_root: z.string().describe("MANDATORY."),
    message: z.string().describe("Commit message, e.g., 'Feat(REQ-1): Implement Login'"),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root, message } = args;

    try {
      // 1. Git Add
      const addRes = await runCommand('git add .', project_root);
      if (addRes.error) return { content: [{ type: "text", text: `Git Add Failed: ${addRes.stderr}` }] };

      // 2. Git Commit
      const commitRes = await runCommand(`git commit -m "${message}"`, project_root);
      if (commitRes.error) {
        // Handle "nothing to commit" gracefully
        if (commitRes.stdout.includes('nothing to commit')) {
           return { content: [{ type: "text", text: `No changes to commit. (Git status: clean)` }] };
        }
        return { content: [{ type: "text", text: `Git Commit Failed: ${commitRes.stderr || commitRes.stdout}` }] };
      }

      return { content: [{ type: "text", text: `Success: Saved progress. ${commitRes.stdout}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- 7. Clear and Retry (Reset) ---
server.tool(
  "clear_and_retry",
  "Hard reset Git to previous commit to retry current requirement. [REQUIRED: project_root].",
  {
    project_root: z.string().describe("MANDATORY."),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root } = args;

    try {
      const res = await runCommand('git reset --hard', project_root);
      if (res.error) return { content: [{ type: "text", text: `Git Reset Failed: ${res.stderr}` }] };

      // Note: We don't rewind the 'phase_one_progress.yaml' here automatically because 
      // the 'pop_next_requirement' already marked it as processed. 
      // Ideally, the user agent will just re-read the context or we could modify status back to 'unprocessed'.
      // For simplicity in this tool, we assume the agent keeps the requirement context and just wipes the code changes.
      
      return { content: [{ type: "text", text: `Success: Workspace reset. You can now retry the implementation.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- 8. Meta Test (Architecture & Quality Gate) ---
server.tool(
  "run_metatest",
  "Architecture Compliance Check. Run this during TDD process.",
  {
    project_root: z.string().describe("MANDATORY."),
  },
  async (args) => {
    const validationError = validateInputs(args);
    if (validationError) return { content: [{ type: "text", text: validationError }] };
    const { project_root } = args;

    const report = [];
    let hasError = false;

    try {
      // Step 0: Get list of changed/new files (Staged + Unstaged)
      // We use git to find what the agent has actually worked on.
      const statusCmd = await runCommand('git status --porcelain', project_root);
      if (statusCmd.error) throw new Error(`Git status failed: ${statusCmd.stderr}`);
      
      const lines = statusCmd.stdout.split('\n').filter(l => l.trim() !== '');
      if (lines.length === 0) {
        return { content: [{ type: "text", text: "METATEST SKIP: No changes detected in workspace." }] };
      }

      const changedFiles = lines.map(line => line.substring(3).trim()); // Remove 'M  ', '?? ' etc.

      report.push("[1/3] File Structure & Naming Check...");
      const validPrefixes = [
        'backend/src/', 'backend/test/', 'backend/package.json', 'backend/database.db',
        'frontend/src/', 'frontend/test/', 'frontend/package.json', 'frontend/index.html', 'frontend/vite.config.js',
        'metadata.md', 'artifacts/' // Allow artifacts updates
      ];
      
      // Separate source files for Pairing Check
      const backendSrcFiles = [];
      const frontendSrcFiles = [];

      for (const file of changedFiles) {
        // 1.1 Check Path Whitelist
        const isValidPath = validPrefixes.some(prefix => file.startsWith(prefix));
        
        // Allow root level config files if absolutely necessary, but warn
        if (!isValidPath) {
           report.push(`VIOLATION: File '${file}' is outside allowed directories (backend/src, frontend/src, etc.).`);
           hasError = true;
        }

        // 1.2 Categorize for Pairing Check
        if (file.startsWith('backend/src/') && file.endsWith('.js') && !file.includes('database/')) {
            backendSrcFiles.push(file);
        }
        if (file.startsWith('frontend/src/') && (file.endsWith('.jsx') || file.endsWith('.js')) && !file.includes('main.jsx')) {
            frontendSrcFiles.push(file);
        }
      }

      if (!hasError) report.push("Structure Check Passed.");


      report.push("\n[2/3] Test Pairing Check (Metadata Spec)...");
      // Check if src files have corresponding test files
      // Rule: backend/src/path/to/file.js -> backend/test/path/to/file.test.js
      
      const missingTests = [];

      // Backend Pairing
      for (const srcFile of backendSrcFiles) {
        const testFile = srcFile.replace('backend/src/', 'backend/test/').replace('.js', '.test.js');
        if (!fs.existsSync(path.join(project_root, testFile))) {
             missingTests.push(`Missing Backend Test: ${testFile} (for ${srcFile})`);
        }
      }

      // Frontend Pairing
      for (const srcFile of frontendSrcFiles) {
        // Handle .jsx -> .test.jsx or .test.js
        let testFile = srcFile.replace('frontend/src/', 'frontend/test/');
        // Try .test.jsx first, then .test.js logic if needed. 
        // Metadata says: file extension + .test
        // Example: HomePage.jsx -> HomePage.test.jsx
        const ext = path.extname(srcFile); // .jsx
        const baseName = path.basename(srcFile, ext); // HomePage
        const dirName = path.dirname(testFile);
        
        const expectedTestName = `${baseName}.test${ext}`; // HomePage.test.jsx
        const fullTestPath = path.join(dirName, expectedTestName);

        if (!fs.existsSync(path.join(project_root, fullTestPath))) {
             missingTests.push(`Missing Frontend Test: ${fullTestPath} (for ${srcFile})`);
        }
      }

      if (missingTests.length > 0) {
        missingTests.forEach(m => report.push(`${m}`));
        hasError = true;
      } else {
        report.push("Test Pairing Check Passed.");
      }


      report.push("\n[3/3] Compilation & Syntax Check...");
      // Frontend: Vite Build (Checks imports, JSX syntax, missing dependencies)
      // Only run if frontend files changed
      if (changedFiles.some(f => f.startsWith('frontend/'))) {
        report.push("   Running Frontend Build (Vite)...");
        // We use --noEmit or just build to check validity. 
        // Assuming 'npm run build' runs 'vite build'
        const feBuild = await runCommand('npm run build', path.join(project_root, 'frontend'));
        if (feBuild.error) {
           report.push(`Frontend Build Failed:\n${feBuild.stderr.slice(0, 300)}...`);
           hasError = true;
        } else {
           report.push("Frontend Build OK.");
        }
      }

      // Backend: Syntax Check (Node -c)
      // Checking changed JS files for syntax errors
      if (changedFiles.some(f => f.startsWith('backend/'))) {
         report.push("   Checking Backend Syntax...");
         const jsFiles = changedFiles.filter(f => f.startsWith('backend/') && f.endsWith('.js'));
         for (const jsFile of jsFiles) {
            const syntaxCheck = await runCommand(`node --check ${jsFile}`, project_root);
            if (syntaxCheck.error) {
                report.push(`Syntax Error in ${jsFile}:\n${syntaxCheck.stderr}`);
                hasError = true;
            }
         }
         if (!hasError) report.push("Backend Syntax OK.");
      }

      const finalStatus = hasError ? "FAILED" : "PASSED";
      const summary = `\n=== METATEST REPORT ===\n${report.join('\n')}\n=======================\nRESULT: ${finalStatus}`;

      return { content: [{ type: "text", text: summary }] };

    } catch (err) {
      return { content: [{ type: "text", text: `Error running metatest: ${err.message}` }] };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});