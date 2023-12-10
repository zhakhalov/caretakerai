"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const prompts_1 = require("langchain/prompts");
const runnable_1 = require("langchain/schema/runnable");
const output_parser_1 = require("langchain/schema/output_parser");
const xml_js_1 = require("xml-js");
const constants_1 = require("./constants");
const activity_1 = require("./activity");
class Agent {
    static parseActivities(text) {
        const { elements } = (0, xml_js_1.xml2js)(`<root>${text}</root>`);
        console.log(JSON.stringify(elements, null, 2));
        return elements[0].elements.map(({ name, attributes, elements }) => {
            let input = '';
            if ((elements === null || elements === void 0 ? void 0 : elements[0].type) === 'text') {
                input = elements[0].text.trim();
            }
            return activity_1.Activity.fromObject({
                kind: name,
                input: input,
                attributes: attributes,
            });
        });
    }
    constructor(params) {
        const { actions } = params;
        if (!actions.length) {
            throw new Error('Actions list must be non empty');
        }
        Object.assign(this, Agent.defaults, params);
    }
    addActivities(...experience) {
        experience.forEach(e => console.log(e.toString()));
        this.activities.push(...experience);
    }
    async complete(params) {
        const activities = await this.optimizer.optimize(this.activities);
        const completion = await runnable_1.RunnableSequence.from([
            this.template,
            this.llm.bind({ stop: this.stop }),
            new output_parser_1.StringOutputParser(),
        ]).invoke({
            instruction: this.instruction,
            actions: this.actions.map(a => a.toString()).join(constants_1.ACTION_SEP),
            activities: activities.map(a => a.toString()).join(constants_1.ACTIVITY_SEP),
            ...params
        }, {
            callbacks: [
                {
                    handleLLMStart: (llm, prompts) => {
                        console.log(prompts);
                    }
                }
            ]
        });
        return Agent.parseActivities(completion.trim());
    }
    async execute({ attributes, input }) {
        const { kind } = attributes;
        const action = this.actions.find(a => a.kind === kind);
        if (!action) {
            throw new Error(`Action "${kind}" is not permitted.`);
        }
        const observation = await action.execute({ agent: this, input });
        this.addActivities(new activity_1.Activity({
            kind: activity_1.ActivityKind.Observation,
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
            throw new Error('Latest experience must be of Observation kind');
        }
        while (true) {
            const activity = this.activities.at(-1);
            if (activity.kind === activity_1.ActivityKind.Observation) {
                this.addActivities(...(await this.complete({ footer: '<!-- Provide thought and action here -->' })));
            }
            else if (activity.kind === activity_1.ActivityKind.Thought) {
                this.addActivities(...(await this.complete({ footer: '<!-- Provide action here -->' })));
            }
            else if (activity.kind === activity_1.ActivityKind.Action) {
                const result = await this.execute(activity);
                if (result) {
                    return result;
                }
            }
            else {
                throw new Error(`Activity "${activity.kind}" is not permitted.`);
            }
        }
    }
}
exports.Agent = Agent;
Agent.defaults = {
    template: prompts_1.PromptTemplate.fromTemplate(constants_1.TEMPLATE),
    stop: [`<${activity_1.ActivityKind.Observation}>`],
    activities: [],
};
//# sourceMappingURL=agent.js.map