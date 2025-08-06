import { ActiveProtocol } from './types.js';
export declare class StateManager {
    private dataDir;
    private activeProtocolsFile;
    private historyFile;
    constructor();
    private initializeFiles;
    saveActiveProtocol(protocol: ActiveProtocol): void;
    updateActiveProtocol(protocol: ActiveProtocol): void;
    loadActiveProtocols(): ActiveProtocol[];
    private loadActiveProtocolsData;
    completeProtocol(protocolId: string, success?: boolean): void;
    private loadHistory;
    recordPattern(pattern: string, protocolId: string): void;
    getProtocolStatistics(): any;
    cleanup(): void;
    close(): void;
}
//# sourceMappingURL=state-manager.d.ts.map