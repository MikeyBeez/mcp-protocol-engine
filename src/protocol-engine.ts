import { ProtocolDefinition, TriggerCondition, ProtocolStep, ActiveProtocol, NextAction, Context } from './types.js';
import { StateManager } from './state-manager.js';

export class ProtocolEngine {
  private protocols: Map<string, ProtocolDefinition> = new Map();
  private activeProtocols: Map<string, ActiveProtocol> = new Map();
  private stateManager: StateManager;

  constructor() {
    this.stateManager = new StateManager();
    this.loadActiveProtocols();
  }

  registerProtocol(protocol: ProtocolDefinition): void {
    this.protocols.set(protocol.id, protocol);
  }

  detectTriggers(input: string, context: Context = {}): ProtocolDefinition[] {
    const triggered: ProtocolDefinition[] = [];
    const normalizedInput = input.toLowerCase();
    
    for (const protocol of this.protocols.values()) {
      for (const trigger of protocol.triggers) {
        if (this.matchesTrigger(normalizedInput, context, trigger)) {
          triggered.push(protocol);
          break;
        }
      }
    }
    
    return this.prioritizeProtocols(triggered);
  }

  private matchesTrigger(input: string, context: Context, trigger: TriggerCondition): boolean {
    switch (trigger.type) {
      case 'phrase':
        if (typeof trigger.pattern === 'string') {
          return input.includes(trigger.pattern.toLowerCase());
        } else {
          return trigger.pattern.test(input);
        }
      
      case 'event':
        return context.event === trigger.pattern;
      
      case 'state':
        return context.state === trigger.pattern;
      
      case 'error':
        return context.error?.includes(String(trigger.pattern)) || false;
      
      default:
        return false;
    }
  }

  private prioritizeProtocols(protocols: ProtocolDefinition[]): ProtocolDefinition[] {
    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    
    return protocols.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.metadata.priority);
      const bPriority = priorityOrder.indexOf(b.metadata.priority);
      return aPriority - bPriority;
    });
  }

  startProtocol(protocolId: string, context: Context = {}): ActiveProtocol {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error(`Protocol ${protocolId} not found`);
    }

    const active = new ActiveProtocol(protocol, context);
    this.activeProtocols.set(active.id, active);
    
    // Save to state for persistence
    this.stateManager.saveActiveProtocol(active);
    
    return active;
  }

  getNextAction(activeProtocolId: string): NextAction {
    const active = this.activeProtocols.get(activeProtocolId);
    if (!active) {
      throw new Error(`Active protocol ${activeProtocolId} not found`);
    }

    const nextStep = active.getNextStep();
    if (!nextStep) {
      return { 
        type: 'complete', 
        message: `✅ Protocol "${active.protocol.name}" completed!`,
        summary: this.generateSummary(active)
      };
    }

    return {
      type: 'execute',
      step: nextStep,
      command: this.generateCommand(nextStep, active.context),
      progress: active.getProgress(),
      display: this.formatStepDisplay(nextStep, active)
    };
  }

  completeStep(activeProtocolId: string, stepId: string, result?: any): void {
    const active = this.activeProtocols.get(activeProtocolId);
    if (!active) {
      throw new Error(`Active protocol ${activeProtocolId} not found`);
    }

    active.completeStep(stepId, result);
    this.stateManager.updateActiveProtocol(active);
  }

  displayProgress(activeProtocolId: string): string {
    const active = this.activeProtocols.get(activeProtocolId);
    if (!active) {
      return '❌ No active protocol with that ID';
    }

    const progress = active.getProgress();
    const steps = active.protocol.steps;
    
    let display = `\n📋 **${active.protocol.name}**\n`;
    display += `${this.getProgressBar(progress.completed, progress.total)}\n`;
    display += `Progress: ${progress.completed}/${progress.total} steps\n\n`;

    steps.forEach((step, index) => {
      const status = active.isStepComplete(step.id) ? '✅' : 
                     index === progress.currentIndex ? '🔄' : '⏳';
      display += `${status} Step ${index + 1}: ${step.name}\n`;
      
      if (index === progress.currentIndex) {
        if (step.description) {
          display += `   📝 ${step.description}\n`;
        }
        if (step.command) {
          display += `   > ${this.generateCommand(step, active.context)}\n`;
        }
      }
    });

    return display;
  }

  private getProgressBar(completed: number, total: number): string {
    const percentage = Math.round((completed / total) * 100);
    const filled = Math.round((completed / total) * 20);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
  }

  private generateCommand(step: ProtocolStep, context: Context): string {
    if (!step.command) return '';

    let command = step.command;
    
    // Replace variables with context values
    command = command.replace(/\${(\w+)}/g, (match, variable) => {
      return context[variable] || match;
    });

    // Add today's date if needed
    const today = new Date().toISOString().split('T')[0];
    command = command.replace(/\${today}/g, today);

    return command;
  }

  private formatStepDisplay(step: ProtocolStep, active: ActiveProtocol): string {
    let display = `\n🎯 **Next Step: ${step.name}**\n`;
    
    if (step.description) {
      display += `📝 ${step.description}\n`;
    }
    
    if (step.command) {
      display += `\n**Command to execute:**\n`;
      display += `\`\`\`\n${this.generateCommand(step, active.context)}\n\`\`\`\n`;
    }
    
    if (step.validation) {
      display += `\n✔️ **Validation:** ${step.validation}\n`;
    }
    
    return display;
  }

  private generateSummary(active: ActiveProtocol): string {
    const duration = Date.now() - active.startedAt.getTime();
    const minutes = Math.round(duration / 60000);
    
    let summary = `\n## Protocol Execution Summary\n\n`;
    summary += `**Protocol:** ${active.protocol.name}\n`;
    summary += `**Duration:** ${minutes} minutes\n`;
    summary += `**Steps Completed:** ${active.completedSteps.size}/${active.protocol.steps.length}\n\n`;
    
    if (active.stepResults.size > 0) {
      summary += `### Results\n`;
      active.stepResults.forEach((result, stepId) => {
        const step = active.protocol.steps.find(s => s.id === stepId);
        if (step) {
          summary += `- **${step.name}:** ${JSON.stringify(result)}\n`;
        }
      });
    }
    
    return summary;
  }

  listProtocols(category?: string): any {
    const protocols = Array.from(this.protocols.values());
    const filtered = category 
      ? protocols.filter(p => p.metadata.category === category)
      : protocols;
    
    return filtered.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      triggers: p.triggers.map(t => 
        typeof t.pattern === 'string' ? t.pattern : 'custom pattern'
      ),
      steps: p.steps.length,
      priority: p.metadata.priority,
      category: p.metadata.category
    }));
  }

  listActiveProtocols(): any {
    return Array.from(this.activeProtocols.values()).map(active => ({
      id: active.id,
      protocolName: active.protocol.name,
      startedAt: active.startedAt,
      progress: active.getProgress(),
      currentStep: active.getNextStep()?.name || 'Complete'
    }));
  }

  private loadActiveProtocols(): void {
    const saved = this.stateManager.loadActiveProtocols();
    saved.forEach(active => {
      this.activeProtocols.set(active.id, active);
    });
  }
}
