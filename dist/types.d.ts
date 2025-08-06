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
export declare class ActiveProtocol {
    id: string;
    protocol: ProtocolDefinition;
    context: Context;
    startedAt: Date;
    completedSteps: Set<string>;
    stepResults: Map<string, any>;
    constructor(protocol: ProtocolDefinition, context: Context);
    getNextStep(): ProtocolStep | null;
    completeStep(stepId: string, result?: any): void;
    isStepComplete(stepId: string): boolean;
    getProgress(): Progress;
    private getCurrentStepIndex;
    private evaluateCondition;
    toJSON(): any;
    static fromJSON(data: any, protocol: ProtocolDefinition): ActiveProtocol;
}
//# sourceMappingURL=types.d.ts.map