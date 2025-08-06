#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { ProtocolEngine } from './protocol-engine.js';
import { protocolDefinitions } from './protocol-definitions.js';

class ProtocolExecutionServer {
  private server: Server;
  private engine: ProtocolEngine;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-protocol-engine',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.engine = new ProtocolEngine();
    this.setupHandlers();
    this.loadProtocols();
  }

  private loadProtocols() {
    // Load all protocol definitions
    protocolDefinitions.forEach(protocol => {
      this.engine.registerProtocol(protocol);
    });
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.handleToolCall(name, args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'protocol_detect',
        description: 'Detect which protocols should be triggered based on input',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'User input or command'
            },
            context: {
              type: 'object',
              description: 'Current context (optional)',
              additionalProperties: true
            }
          },
          required: ['input']
        }
      },
      {
        name: 'protocol_start',
        description: 'Start executing a specific protocol',
        inputSchema: {
          type: 'object',
          properties: {
            protocolId: {
              type: 'string',
              description: 'ID of the protocol to start'
            },
            context: {
              type: 'object',
              description: 'Context for the protocol',
              additionalProperties: true
            }
          },
          required: ['protocolId']
        }
      },
      {
        name: 'protocol_next',
        description: 'Get the next action for an active protocol',
        inputSchema: {
          type: 'object',
          properties: {
            activeProtocolId: {
              type: 'string',
              description: 'ID of the active protocol'
            }
          },
          required: ['activeProtocolId']
        }
      },
      {
        name: 'protocol_complete_step',
        description: 'Mark a protocol step as completed',
        inputSchema: {
          type: 'object',
          properties: {
            activeProtocolId: {
              type: 'string',
              description: 'ID of the active protocol'
            },
            stepId: {
              type: 'string',
              description: 'ID of the completed step'
            },
            result: {
              type: 'object',
              description: 'Result of the step execution (optional)',
              additionalProperties: true
            }
          },
          required: ['activeProtocolId', 'stepId']
        }
      },
      {
        name: 'protocol_status',
        description: 'Get the status and progress of an active protocol',
        inputSchema: {
          type: 'object',
          properties: {
            activeProtocolId: {
              type: 'string',
              description: 'ID of the active protocol'
            }
          },
          required: ['activeProtocolId']
        }
      },
      {
        name: 'protocol_list',
        description: 'List all available protocols',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category (optional)'
            }
          }
        }
      },
      {
        name: 'protocol_active',
        description: 'List all currently active protocols',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'protocol_help',
        description: 'Get help on using the Protocol Execution Engine',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Help topic (optional)',
              enum: ['getting-started', 'protocols', 'commands', 'troubleshooting']
            }
          }
        }
      }
    ];
  }

  private async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'protocol_detect':
        return this.engine.detectTriggers(args.input, args.context || {});

      case 'protocol_start':
        return this.engine.startProtocol(args.protocolId, args.context || {});

      case 'protocol_next':
        return this.engine.getNextAction(args.activeProtocolId);

      case 'protocol_complete_step':
        this.engine.completeStep(args.activeProtocolId, args.stepId, args.result);
        return this.engine.displayProgress(args.activeProtocolId);

      case 'protocol_status':
        return this.engine.displayProgress(args.activeProtocolId);

      case 'protocol_list':
        return this.engine.listProtocols(args.category);

      case 'protocol_active':
        return this.engine.listActiveProtocols();

      case 'protocol_help':
        return this.getHelp(args.topic);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private getHelp(topic?: string): string {
    const helps: Record<string, string> = {
      'getting-started': `
# Getting Started with Protocol Execution Engine

The Protocol Execution Engine helps you execute complex workflows step-by-step.

## Basic Usage:
1. Detect applicable protocols: protocol_detect("your command")
2. Start a protocol: protocol_start("protocol-id")
3. Get next action: protocol_next("active-id")
4. Execute the command shown
5. Mark complete: protocol_complete_step("active-id", "step-id")
6. Repeat until done

## Example:
User: "update repo"
1. protocol_detect("update repo") → Shows applicable protocols
2. protocol_start("repo-update") → Starts the protocol
3. protocol_next("repo-update_123") → Shows next command
4. Execute: git:git_status()
5. protocol_complete_step("repo-update_123", "status")
6. Continue until all steps complete
`,
      'protocols': `
# Available Protocols

## Repository Update (repo-update)
Triggers: "update repo", "commit changes", "push to github"
Steps: Git status → Tests → Commit → Push → Summary

## Session Initialization (session-init)
Triggers: "start session", new conversation
Steps: Brain init → Bag of tricks → Locations → Project → Captain's log

## Auto-Continuation (auto-continuation)
Triggers: Second continue detected, max prompt length twice
Steps: Analyze → Generate note → Save state → Create artifact

## Error Recovery (error-recovery)
Triggers: Tool errors, file not found, permission denied
Steps: Diagnose → Attempt fix → Fallback → Report

Use protocol_list() to see all available protocols.
`,
      'commands': `
# Protocol Commands

## Detection & Discovery
- protocol_detect(input) - Find applicable protocols
- protocol_list() - List all protocols
- protocol_active() - Show active protocols

## Execution
- protocol_start(id, context) - Begin a protocol
- protocol_next(activeId) - Get next action
- protocol_complete_step(activeId, stepId) - Mark step done
- protocol_status(activeId) - Check progress

## Help
- protocol_help(topic) - Get help on specific topic
`,
      'troubleshooting': `
# Troubleshooting

## Protocol won't start
- Check protocol exists: protocol_list()
- Verify trigger matches: protocol_detect("your input")
- Ensure required context provided

## Step won't complete
- Verify step ID is correct
- Check validation criteria
- Review error messages

## Lost track of progress
- Use protocol_active() to see all active protocols
- Use protocol_status(id) to see specific progress
- Check stored state in Brain system

## Protocol stuck
- Some steps may be conditional
- Check if manual intervention needed
- Review protocol definition for requirements
`
    };

    return helps[topic || ''] || `
# Protocol Execution Engine Help

The Protocol Execution Engine provides guided execution of complex workflows.

## Available Topics:
- getting-started: Basic usage and examples
- protocols: List of available protocols
- commands: Command reference
- troubleshooting: Common issues and solutions

Use protocol_help("topic") for specific help.

## Quick Start:
1. Say what you want to do
2. Use protocol_detect() to find matching protocols
3. Start the protocol with protocol_start()
4. Follow the step-by-step guidance
`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Protocol Execution Engine MCP server running');
  }
}

// Start the server
const server = new ProtocolExecutionServer();
server.run().catch(console.error);
