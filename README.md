# Protocol Execution Engine

A smart guidance system for executing complex workflows step-by-step. Instead of trying to automate everything (which is impossible due to tool constraints), this engine provides intelligent guidance through protocols.

## Core Concept

Since tools cannot call tools, the Protocol Execution Engine acts as a **smart checklist** that:
- Detects when protocols should be triggered
- Guides you through each step with exact commands
- Tracks progress through the protocol
- Learns from patterns to improve suggestions

## Features

- **Protocol Detection**: Automatically identifies which protocols apply to your situation
- **Step-by-Step Guidance**: Clear instructions with copy-paste ready commands
- **Progress Tracking**: Visual progress indicators and state management
- **Pattern Learning**: Improves suggestions based on usage patterns
- **Persistence**: Maintains state across sessions
- **Extensible**: Easy to add new protocols

## Available Protocols

### System Protocols
- **Session Initialization**: Complete startup sequence for new sessions
- **Error Recovery**: Systematic error handling and recovery
- **Find Location**: Systematic approach to finding files and locations

### Development Protocols
- **Repository Update**: Git operations, testing, and documentation
- **Create Project**: Complete project setup with Git and Brain integration

### Session Management
- **Auto-Continuation**: Generate continuation notes after multiple continues
- **Todo Management**: Task tracking and prioritization

## Installation

```bash
# Clone the repository
git clone /Users/bard/Code/mcp-protocol-engine

# Install dependencies
cd mcp-protocol-engine
npm install

# Build the project
npm run build
```

## Configuration

Add to your Claude Desktop configuration:

```json
{
  "mcp-protocol-engine": {
    "command": "node",
    "args": ["/Users/bard/Code/mcp-protocol-engine/dist/index.js"]
  }
}
```

## Usage

### Basic Workflow

1. **Detect applicable protocols**:
   ```
   protocol_detect("update repo")
   ```

2. **Start a protocol**:
   ```
   protocol_start("repo-update", {commit_message: "Add new features"})
   ```

3. **Get next action**:
   ```
   protocol_next("repo-update_12345")
   ```

4. **Execute the shown command**

5. **Mark step complete**:
   ```
   protocol_complete_step("repo-update_12345", "status")
   ```

6. **Continue until done**

### Quick Commands

- `protocol_list()` - See all available protocols
- `protocol_active()` - Show currently active protocols
- `protocol_status(id)` - Check progress of specific protocol
- `protocol_help(topic)` - Get help on specific topics

## Creating New Protocols

Protocols are defined in `src/protocol-definitions.ts`:

```typescript
{
  id: 'my-protocol',
  name: 'My Custom Protocol',
  description: 'Description of what it does',
  triggers: [
    { type: 'phrase', pattern: 'trigger phrase' }
  ],
  steps: [
    {
      id: 'step1',
      name: 'First Step',
      command: 'tool:command()',
      validation: 'How to verify completion'
    }
  ],
  metadata: {
    priority: 'medium',
    category: 'custom',
    tags: ['custom', 'workflow']
  }
}
```

## Architecture

```
Protocol Execution Engine
├── Protocol Registry (stores definitions)
├── Trigger Detection (matches input to protocols)
├── Step Tracker (maintains execution state)
├── Command Generator (creates executable commands)
├── Progress Visualizer (shows status)
└── State Manager (persistence layer)
```

## Key Insight

This system works **with** the constraint that tools can't call tools by providing a guidance layer that:
- Knows what should happen (protocols)
- Guides you through it (suggestions)
- Tracks progress (state management)
- Learns patterns (improvement over time)

This is actually MORE powerful than full automation because it:
- Keeps human judgment in the loop
- Can handle edge cases
- Provides transparency
- Allows for adaptation

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Troubleshooting

### Protocol won't start
- Check protocol exists: `protocol_list()`
- Verify trigger matches: `protocol_detect("your input")`
- Ensure required context provided

### Step won't complete
- Verify step ID is correct
- Check validation criteria
- Review error messages

### Lost track of progress
- Use `protocol_active()` to see all active protocols
- Use `protocol_status(id)` to see specific progress
- Check stored state in Brain system

## Future Enhancements

- [ ] Natural language processing for better trigger detection
- [ ] Machine learning for pattern recognition
- [ ] Visual workflow editor
- [ ] Protocol composition (protocols calling protocols)
- [ ] Integration with more tools
- [ ] Web UI for protocol management

## Related Documentation

- [Protocol Execution Engine - Design](/Users/bard/Code/claude-brain/data/BrainVault/architecture/Protocol Execution Engine - Design.md)
- [Protocol Execution Engine - Implementation](/Users/bard/Code/claude-brain/data/BrainVault/architecture/Protocol Execution Engine - Implementation.md)
- [Master Protocol Index](/Users/bard/Code/claude-brain/data/BrainVault/protocols/Master Protocol Index.md)

## License

MIT
