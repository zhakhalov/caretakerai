"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const prompts_1 = require("langchain/prompts");
const runnable_1 = require("langchain/schema/runnable");
const output_parser_1 = require("langchain/schema/output_parser");
const action_1 = require("./action");
const constants_1 = require("./constants");
const activity_1 = require("./activity");
class Agent {
    static parseActivities(input) {
        return input
            .split('\n//')
            .filter(text => text)
            .map(text => `//${text.replace(/^\/\//, '').trim()}`)
            .map(text => activity_1.Activity.parse(text.trim()));
    }
    constructor(params) {
        const { actions } = params;
        if (!actions.length) {
            throw new Error('Actions list must be non empty');
        }
        Object.assign(this, Agent.defaults, params);
    }
    appendActivity(...experience) {
        experience.forEach(e => console.log(e.toString()));
        this.activities.push(...experience);
    }
    async complete(experienceTemplate) {
        const activities = await this.optimizer.optimize(this.activities);
        const completion = await runnable_1.RunnableSequence.from([
            this.template,
            this.llm.bind({ stop: this.stop }),
            new output_parser_1.StringOutputParser(),
        ]).invoke({
            instruction: this.instruction,
            actions: this.actions.map((a, index) => `${index + 1}. ${a.toString()}`).join(constants_1.ACTION_SEP),
            example: this.example.map(e => e.toString()).join(`\n`),
            activities: [...activities, experienceTemplate].map(e => e.toString()).join(`\n`),
        }, {
            callbacks: [
                {
                    handleLLMStart: (llm, prompts) => {
                    }
                }
            ]
        });
        return Agent.parseActivities(experienceTemplate.toString() + completion.trim());
    }
    async think(latestActivity) {
        this.appendActivity(...(await this.complete(new activity_1.Activity({
            kind: activity_1.ActivityKind.Thought,
            order: latestActivity.order,
            input: '',
        }))));
    }
    async act(latestActivity) {
        this.appendActivity(...(await this.complete(new activity_1.Activity({
            kind: activity_1.ActivityKind.Action,
            order: latestActivity.order,
            input: '',
        }))));
    }
    async execute(latestActivity) {
        const { kind, input } = action_1.Action.parse(latestActivity.input);
        const action = this.actions.find(a => a.kind === kind);
        if (!action) {
            throw new Error(`Action "${kind}" is not permitted.`);
        }
        const observation = await action.execute({ agent: this, input });
        this.appendActivity(new activity_1.Activity({
            kind: activity_1.ActivityKind.Observation,
            order: latestActivity.order + 1,
            input: observation,
        }));
        if (action.exit) {
            return observation;
        }
    }
    async invoke() {
        var _a;
        if (!this.activities.length) {
            throw new Error('Activity list must not be empty.');
        }
        if (((_a = this.activities.at(-1)) === null || _a === void 0 ? void 0 : _a.kind) !== activity_1.ActivityKind.Observation) {
            throw new Error('Lastest experience must be of Observation kind');
        }
        while (true) {
            const latestActivity = this.activities.at(-1);
            if (latestActivity.kind === activity_1.ActivityKind.Observation) {
                await this.think(latestActivity);
            }
            else if (latestActivity.kind === activity_1.ActivityKind.Thought) {
                await this.act(latestActivity);
            }
            else if (latestActivity.kind === activity_1.ActivityKind.Action) {
                const result = await this.execute(latestActivity);
                if (result) {
                    return result;
                }
            }
            else {
                throw new Error(`Activity "${latestActivity.kind}" is not permitted.`);
            }
        }
    }
}
exports.Agent = Agent;
Agent.defaults = {
    template: prompts_1.PromptTemplate.fromTemplate(constants_1.TEMPLATE),
    stop: [`//${activity_1.ActivityKind.Observation}`],
    activities: [],
    example: []
};
//# sourceMappingURL=agent.js.map