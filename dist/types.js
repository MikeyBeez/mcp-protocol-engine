export class ActiveProtocol {
    id;
    protocol;
    context;
    startedAt;
    completedSteps;
    stepResults;
    constructor(protocol, context) {
        this.id = `${protocol.id}_${Date.now()}`;
        this.protocol = protocol;
        this.context = context;
        this.startedAt = new Date();
        this.completedSteps = new Set();
        this.stepResults = new Map();
    }
    getNextStep() {
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
    completeStep(stepId, result) {
        this.completedSteps.add(stepId);
        if (result !== undefined) {
            this.stepResults.set(stepId, result);
        }
    }
    isStepComplete(stepId) {
        return this.completedSteps.has(stepId);
    }
    getProgress() {
        return {
            total: this.protocol.steps.length,
            completed: this.completedSteps.size,
            currentIndex: this.getCurrentStepIndex()
        };
    }
    getCurrentStepIndex() {
        for (let i = 0; i < this.protocol.steps.length; i++) {
            if (!this.completedSteps.has(this.protocol.steps[i].id)) {
                return i;
            }
        }
        return this.protocol.steps.length;
    }
    evaluateCondition(condition) {
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
    toJSON() {
        return {
            id: this.id,
            protocolId: this.protocol.id,
            context: this.context,
            startedAt: this.startedAt,
            completedSteps: Array.from(this.completedSteps),
            stepResults: Object.fromEntries(this.stepResults)
        };
    }
    static fromJSON(data, protocol) {
        const active = new ActiveProtocol(protocol, data.context);
        active.id = data.id;
        active.startedAt = new Date(data.startedAt);
        active.completedSteps = new Set(data.completedSteps);
        active.stepResults = new Map(Object.entries(data.stepResults || {}));
        return active;
    }
}
//# sourceMappingURL=types.js.map