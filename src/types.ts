export interface ProtocolDefinition {
  id: string;
  name: string;
  description: string;
  triggers: TriggerCondition[];
  steps: ProtocolStep[];
  metadata: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    tags: string[];
  };
}

export interface TriggerCondition {
  type: 'phrase' | 'event' | 'state' | 'error';
  pattern: string | RegExp;
  context?: string;
}

export interface ProtocolStep {
  id: string;
  name: string;
  description?: string;
  command?: string;
  validation?: string;
  conditional?: string;
  substeps?: ProtocolStep[];
}

export interface Context {
  [key: string]: any;
  event?: string;
  state?: string;
  error?: string;
  project?: string;
  commit_message?: string;
  last_action?: string;
  session_changes?: string[];
}

export interface Progress {
  total: number;
  completed: number;
  currentIndex: number;
}

export interface NextAction {
  type: 'execute' | 'complete';
  step?: ProtocolStep;
  command?: string;
  progress?: Progress;
  message?: string;
  display?: string;
  summary?: string;
}

export class ActiveProtocol {
  id: string;
  protocol: ProtocolDefinition;
  context: Context;
  startedAt: Date;
  completedSteps: Set<string>;
  stepResults: Map<string, any>;

  constructor(protocol: ProtocolDefinition, context: Context) {
    this.id = `${protocol.id}_${Date.now()}`;
    this.protocol = protocol;
    this.context = context;
    this.startedAt = new Date();
    this.completedSteps = new Set();
    this.stepResults = new Map();
  }

  getNextStep(): ProtocolStep | null {
    for (const step of this.protocol.steps) {
      if (!this.completedSteps.has(step.id)) {
        // Check if conditional step should be skipped
        if (step.conditional && !this.evaluateCondition(step.conditional)) {
          this.completedSteps.add(step.id);
          continue;
        }
        return step;
      }
    }
    return null;
  }

  completeStep(stepId: string, result?: any): void {
    this.completedSteps.add(stepId);
    if (result !== undefined) {
      this.stepResults.set(stepId, result);
    }
  }

  isStepComplete(stepId: string): boolean {
    return this.completedSteps.has(stepId);
  }

  getProgress(): Progress {
    return {
      total: this.protocol.steps.length,
      completed: this.completedSteps.size,
      currentIndex: this.getCurrentStepIndex()
    };
  }

  private getCurrentStepIndex(): number {
    for (let i = 0; i < this.protocol.steps.length; i++) {
      if (!this.completedSteps.has(this.protocol.steps[i].id)) {
        return i;
      }
    }
    return this.protocol.steps.length;
  }

  private evaluateCondition(condition: string): boolean {
    // Simple condition evaluation
    // Could be enhanced with more complex logic
    if (condition === 'file_exists') {
      // Would need to check if file exists
      return true;
    }
    if (condition.startsWith('context.')) {
      const key = condition.substring(8);
      return !!this.context[key];
    }
    return true;
  }

  toJSON(): any {
    return {
      id: this.id,
      protocolId: this.protocol.id,
      context: this.context,
      startedAt: this.startedAt,
      completedSteps: Array.from(this.completedSteps),
      stepResults: Object.fromEntries(this.stepResults)
    };
  }

  static fromJSON(data: any, protocol: ProtocolDefinition): ActiveProtocol {
    const active = new ActiveProtocol(protocol, data.context);
    active.id = data.id;
    active.startedAt = new Date(data.startedAt);
    active.completedSteps = new Set(data.completedSteps);
    active.stepResults = new Map(Object.entries(data.stepResults || {}));
    return active;
  }
}
