// Vercel function: OmniPlan MCP server for AI assistants (Claude, ChatGPT).
// URL: https://<app>/api/mcp   Auth: personal token (Settings → Інтеграції).
import '../server/mcp/tz.js'; // must be first: sets the Europe/Kyiv time zone
import { firestoreDeps } from '../server/mcp/firestoreRepo.js';
import { handleMcp } from '../server/mcp/handler.js';

const deps = firestoreDeps();

export function GET(request: Request) { return handleMcp(request, deps); }
export function POST(request: Request) { return handleMcp(request, deps); }
export function OPTIONS(request: Request) { return handleMcp(request, deps); }
export function DELETE(request: Request) { return handleMcp(request, deps); }
