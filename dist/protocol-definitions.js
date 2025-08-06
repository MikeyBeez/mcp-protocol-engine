export const protocolDefinitions = [
    {
        id: 'repo-update',
        name: 'Repository Update Protocol',
        description: 'Complete repository update workflow with git operations, testing, and documentation',
        triggers: [
            { type: 'phrase', pattern: 'update repo' },
            { type: 'phrase', pattern: 'commit changes' },
            { type: 'phrase', pattern: 'push to github' },
            { type: 'phrase', pattern: 'update repository' }
        ],
        steps: [
            {
                id: 'status',
                name: 'Check Git Status',
                description: 'Review current repository state and modified files',
                command: 'git:git_status()',
                validation: 'Review modified files and ensure all changes are intended'
            },
            {
                id: 'tests',
                name: 'Run Tests',
                description: 'Execute test suite to ensure code quality',
                command: 'system:system_exec("npm test")',
                validation: 'All tests pass successfully',
                conditional: 'context.includeTests'
            },
            {
                id: 'add',
                name: 'Stage Changes',
                description: 'Add all changes to git staging area',
                command: 'git:git_add(files=["."])',
                validation: 'Changes staged for commit'
            },
            {
                id: 'commit',
                name: 'Commit Changes',
                description: 'Create git commit with descriptive message',
                command: 'git:git_commit(message="${commit_message}")',
                validation: 'Commit created successfully'
            },
            {
                id: 'push',
                name: 'Push to Remote',
                description: 'Push commits to remote repository',
                command: 'git:git_push()',
                validation: 'Changes pushed to remote successfully'
            },
            {
                id: 'summary',
                name: 'Create Summary',
                description: 'Generate summary of changes for documentation',
                command: 'brain-manager:generate_summary(changes=${session_changes})',
                validation: 'Summary created and saved'
            }
        ],
        metadata: {
            priority: 'medium',
            category: 'development',
            tags: ['git', 'repository', 'version-control']
        }
    },
    {
        id: 'session-init',
        name: 'Session Initialization Protocol',
        description: 'Complete startup sequence for new Claude session',
        triggers: [
            { type: 'phrase', pattern: 'start session' },
            { type: 'phrase', pattern: 'initialize' },
            { type: 'event', pattern: 'new_conversation' }
        ],
        steps: [
            {
                id: 'brain_init',
                name: 'Initialize Brain System',
                description: 'Load Brain system and user preferences',
                command: 'brain:brain_init()',
                validation: 'Brain system initialized successfully'
            },
            {
                id: 'bag_of_tricks',
                name: 'Load Bag of Tricks',
                description: 'Load quick reference for when stuck',
                command: 'brain:state_get("bag_of_tricks", category="system")',
                validation: 'Bag of tricks reference loaded'
            },
            {
                id: 'locations',
                name: 'Load Critical Locations',
                description: 'Load system paths and file locations',
                command: 'brain:state_get("critical_locations", category="system")',
                validation: 'All critical locations loaded'
            },
            {
                id: 'project',
                name: 'Restore Project Context',
                description: 'Load last active project context',
                command: 'brain:state_get("last_project", category="session")',
                validation: 'Project context restored or new project selected'
            },
            {
                id: 'captain_log',
                name: "Check Captain's Log",
                description: "Load today's Captain's Log if available",
                command: 'filesystem:read_file("/Users/bard/Code/claude-brain/data/BrainVault/Captain\'s log ${today}.md")',
                validation: "Today's context loaded",
                conditional: 'file_exists'
            },
            {
                id: 'reminders',
                name: 'Check Reminders',
                description: 'Review any pending reminders',
                command: 'brain-manager:check_reminders()',
                validation: 'Reminders reviewed'
            }
        ],
        metadata: {
            priority: 'critical',
            category: 'system',
            tags: ['initialization', 'startup', 'session']
        }
    },
    {
        id: 'auto-continuation',
        name: 'Auto-Continuation Protocol',
        description: 'Generate continuation note after multiple continues',
        triggers: [
            { type: 'event', pattern: 'second_continue_detected' },
            { type: 'state', pattern: 'max_prompt_length_twice' },
            { type: 'phrase', pattern: 'create continuation note' }
        ],
        steps: [
            {
                id: 'analyze',
                name: 'Analyze Session Context',
                description: 'Gather all work done in current session',
                validation: 'Context analyzed and summarized'
            },
            {
                id: 'generate',
                name: 'Generate Continuation Note',
                description: 'Create comprehensive continuation note with all context',
                command: 'brain-manager:generate_summary(changes=${session_changes}, notes=["Continue from: ${last_action}"])',
                validation: 'Continuation note generated'
            },
            {
                id: 'save_state',
                name: 'Save to State Table',
                description: 'Persist continuation data for next session',
                command: 'brain:state_set("continuation_note", ${continuation_data}, category="session")',
                validation: 'State saved successfully'
            },
            {
                id: 'create_artifact',
                name: 'Create User Artifact',
                description: 'Create visible artifact for user to copy',
                validation: 'Artifact created and visible to user'
            },
            {
                id: 'save_obsidian',
                name: 'Save to Obsidian',
                description: 'Create permanent note in Obsidian vault',
                command: 'brain:obsidian_note("create", title="Continuation ${today}", content=${continuation_content})',
                validation: 'Obsidian note created'
            }
        ],
        metadata: {
            priority: 'high',
            category: 'session',
            tags: ['continuation', 'context', 'handover']
        }
    },
    {
        id: 'error-recovery',
        name: 'Error Recovery Protocol',
        description: 'Systematic error handling and recovery',
        triggers: [
            { type: 'error', pattern: 'tool error' },
            { type: 'error', pattern: 'file not found' },
            { type: 'error', pattern: 'permission denied' },
            { type: 'error', pattern: 'command failed' }
        ],
        steps: [
            {
                id: 'diagnose',
                name: 'Diagnose Error',
                description: 'Identify error type and potential causes',
                validation: 'Error diagnosed and categorized'
            },
            {
                id: 'check_bag',
                name: 'Check Bag of Tricks',
                description: 'Look for relevant troubleshooting steps',
                command: 'brain:state_get("bag_of_tricks", category="system")',
                validation: 'Troubleshooting steps identified'
            },
            {
                id: 'attempt_fix',
                name: 'Attempt Automatic Fix',
                description: 'Try to resolve error automatically',
                validation: 'Fix attempted'
            },
            {
                id: 'fallback',
                name: 'Execute Fallback Strategy',
                description: 'Use alternative approach if fix failed',
                conditional: 'context.fix_failed',
                validation: 'Fallback executed'
            },
            {
                id: 'report',
                name: 'Report to User',
                description: 'Explain error and resolution to user',
                validation: 'User informed of status'
            }
        ],
        metadata: {
            priority: 'high',
            category: 'system',
            tags: ['error', 'recovery', 'troubleshooting']
        }
    },
    {
        id: 'find-location',
        name: 'Find Location Protocol',
        description: 'Systematic approach to finding files and locations',
        triggers: [
            { type: 'phrase', pattern: 'where is' },
            { type: 'phrase', pattern: 'find file' },
            { type: 'phrase', pattern: 'locate' },
            { type: 'error', pattern: 'not found' }
        ],
        steps: [
            {
                id: 'check_state',
                name: 'Check State Table',
                description: 'Look for location in critical_locations',
                command: 'brain:state_get("critical_locations", category="system")',
                validation: 'State table checked'
            },
            {
                id: 'smart_help',
                name: 'Use Smart Help',
                description: 'Get context-aware location suggestions',
                command: 'smart-help:smart_help(context="looking for ${target}")',
                validation: 'Smart help suggestions received'
            },
            {
                id: 'arch_search',
                name: 'Search Architecture Docs',
                description: 'Look in architectural documentation',
                command: 'mcp-architecture:arch_find_document("${target}")',
                validation: 'Architecture docs searched'
            },
            {
                id: 'file_search',
                name: 'Search Filesystem',
                description: 'Perform filesystem search if needed',
                command: 'filesystem:search_files(path="/Users/bard/Code", pattern="${target}")',
                validation: 'Filesystem searched',
                conditional: 'context.not_found'
            },
            {
                id: 'update_state',
                name: 'Update State Table',
                description: 'Save found location for future use',
                command: 'brain:state_set("critical_locations", ${updated_locations}, category="system")',
                validation: 'Location saved for future reference'
            }
        ],
        metadata: {
            priority: 'medium',
            category: 'system',
            tags: ['search', 'location', 'discovery']
        }
    },
    {
        id: 'create-project',
        name: 'Create New Project Protocol',
        description: 'Complete project creation with Git, testing, and Brain integration',
        triggers: [
            { type: 'phrase', pattern: 'create project' },
            { type: 'phrase', pattern: 'new project' },
            { type: 'phrase', pattern: 'start project' }
        ],
        steps: [
            {
                id: 'create_structure',
                name: 'Create Project Structure',
                description: 'Set up directory and initial files',
                command: 'brain-manager:create_project(projectName="${project_name}", projectType="${project_type}")',
                validation: 'Project structure created'
            },
            {
                id: 'init_git',
                name: 'Initialize Git Repository',
                description: 'Create git repo and initial commit',
                command: 'git:git_init(path="/Users/bard/Code/${project_name}")',
                validation: 'Git repository initialized'
            },
            {
                id: 'create_github',
                name: 'Create GitHub Repository',
                description: 'Create remote repository on GitHub',
                command: 'system:system_exec("gh repo create ${project_name} --public")',
                validation: 'GitHub repository created'
            },
            {
                id: 'update_architecture',
                name: 'Update Architecture Index',
                description: 'Add project to Master Architecture Index',
                validation: 'Architecture documentation updated'
            },
            {
                id: 'update_brain',
                name: 'Register in Brain',
                description: 'Add project to Brain memory',
                command: 'brain:brain_remember("project_${project_name}", ${project_data})',
                validation: 'Project registered in Brain'
            },
            {
                id: 'create_readme',
                name: 'Create Documentation',
                description: 'Generate README and initial docs',
                validation: 'Documentation created'
            }
        ],
        metadata: {
            priority: 'medium',
            category: 'development',
            tags: ['project', 'creation', 'setup']
        }
    },
    {
        id: 'todo-management',
        name: 'Todo Management Protocol',
        description: 'Systematic task management and tracking',
        triggers: [
            { type: 'phrase', pattern: 'add todo' },
            { type: 'phrase', pattern: 'check todos' },
            { type: 'phrase', pattern: 'what should i do' },
            { type: 'phrase', pattern: 'task list' }
        ],
        steps: [
            {
                id: 'check_current',
                name: 'Check Current Todos',
                description: 'Review existing tasks and priorities',
                command: 'todo-manager:todo_list(project="${current_project}")',
                validation: 'Current todos reviewed'
            },
            {
                id: 'add_new',
                name: 'Add New Todo',
                description: 'Create new task if needed',
                command: 'todo-manager:todo_add(project="${project}", title="${task_title}", priority="${priority}")',
                validation: 'New todo added',
                conditional: 'context.adding_todo'
            },
            {
                id: 'prioritize',
                name: 'Review Priorities',
                description: 'Ensure tasks are properly prioritized',
                command: 'todo-manager:todo_summary()',
                validation: 'Priorities reviewed'
            },
            {
                id: 'suggest_next',
                name: 'Suggest Next Action',
                description: 'Recommend what to work on next',
                validation: 'Next action suggested'
            }
        ],
        metadata: {
            priority: 'low',
            category: 'productivity',
            tags: ['todo', 'tasks', 'planning']
        }
    }
];
//# sourceMappingURL=protocol-definitions.js.map