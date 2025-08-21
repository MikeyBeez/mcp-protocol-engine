import { ActiveProtocol, ProtocolDefinition } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

export class StateManager {
  private dataDir: string;
  private activeProtocolsFile: string;
  private historyFile: string;

  constructor() {
    // Use a simple file-based storage instead of SQLite
    // Use __dirname to get the directory of this file, then go up to project root
    const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
    this.dataDir = path.join(projectRoot, 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.activeProtocolsFile = path.join(this.dataDir, 'active-protocols.json');
    this.historyFile = path.join(this.dataDir, 'protocol-history.json');
    
    this.initializeFiles();
  }

  private initializeFiles(): void {
    if (!fs.existsSync(this.activeProtocolsFile)) {
      fs.writeFileSync(this.activeProtocolsFile, '[]');
    }
    if (!fs.existsSync(this.historyFile)) {
      fs.writeFileSync(this.historyFile, '[]');
    }
  }

  saveActiveProtocol(protocol: ActiveProtocol): void {
    const protocols = this.loadActiveProtocolsData();
    const index = protocols.findIndex(p => p.id === protocol.id);
    
    const data = protocol.toJSON();
    
    if (index >= 0) {
      protocols[index] = data;
    } else {
      protocols.push(data);
    }
    
    fs.writeFileSync(this.activeProtocolsFile, JSON.stringify(protocols, null, 2));
  }

  updateActiveProtocol(protocol: ActiveProtocol): void {
    this.saveActiveProtocol(protocol);
  }

  loadActiveProtocols(): ActiveProtocol[] {
    // For now, return empty array since we need protocol definitions to reconstruct
    // In a real implementation, would need access to protocol registry
    return [];
  }

  private loadActiveProtocolsData(): any[] {
    try {
      const data = fs.readFileSync(this.activeProtocolsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  completeProtocol(protocolId: string, success: boolean = true): void {
    const protocols = this.loadActiveProtocolsData();
    const protocol = protocols.find(p => p.id === protocolId);
    
    if (protocol) {
      // Add to history
      const history = this.loadHistory();
      history.push({
        ...protocol,
        completedAt: new Date().toISOString(),
        success
      });
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
      
      // Remove from active
      const remaining = protocols.filter(p => p.id !== protocolId);
      fs.writeFileSync(this.activeProtocolsFile, JSON.stringify(remaining, null, 2));
    }
  }

  private loadHistory(): any[] {
    try {
      const data = fs.readFileSync(this.historyFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  recordPattern(pattern: string, protocolId: string): void {
    // Simple pattern tracking in memory for now
    // Could be extended to file storage
  }

  getProtocolStatistics(): any {
    const history = this.loadHistory();
    const active = this.loadActiveProtocolsData();
    
    const stats = {
      totalExecutions: history.length,
      activeProtocols: active.length,
      successRate: history.length > 0 
        ? (history.filter(h => h.success).length / history.length * 100).toFixed(1)
        : 0,
      recentProtocols: history.slice(-5).reverse()
    };
    
    return stats;
  }

  cleanup(): void {
    // Remove old active protocols (older than 24 hours)
    const protocols = this.loadActiveProtocolsData();
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    
    const filtered = protocols.filter(p => {
      const startTime = new Date(p.startedAt).getTime();
      return startTime > cutoff;
    });
    
    if (filtered.length !== protocols.length) {
      fs.writeFileSync(this.activeProtocolsFile, JSON.stringify(filtered, null, 2));
    }
  }

  close(): void {
    // No database to close with file-based storage
  }
}
