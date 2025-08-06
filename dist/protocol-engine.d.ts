import { ProtocolDefinition, ActiveProtocol, NextAction, Context } from './types.js';
export declare class ProtocolEngine {
    private protocols;
    private activeProtocols;
    private stateManager;
    constructor();
    registerProtocol(protocol: ProtocolDefinition): void;
    detectTriggers(input: string, context?: Context): ProtocolDefinition[];
    private matchesTrigger;
    private prioritizeProtocols;
    startProtocol(protocolId: string, context?: Context): ActiveProtocol;
    getNextAction(activeProtocolId: string): NextAction;
    completeStep(activeProtocolId: string, stepId: string, result?: any): void;
    displayProgress(activeProtocolId: string): string;
    private getProgressBar;
    private generateCommand;
    private formatStepDisplay;
    private generateSummary;
    listProtocols(category?: string): any;
    listActiveProtocols(): any;
    private loadActiveProtocols;
}
//# sourceMappingURL=protocol-engine.d.ts.map