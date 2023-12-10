"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = void 0;
const dedent_1 = __importDefault(require("dedent"));
const constants_1 = require("./constants");
class Action {
    toString() {
        const examples = this.examples
            .reduce((acc, { description, activities }) => (0, dedent_1.default) `
        ${acc}

        ${description !== null && description !== void 0 ? description : ''}
        ${activities.map(a => a.toString()).join(constants_1.ACTIVITY_SEP)}
      `.trim(), '');
        return (0, dedent_1.default) `
      ### ${this.kind}
      ${this.description}

      #### Examples
      ${examples}
      `.trim();
    }
    static parse(text) {
        const [kind, ...rest] = text.split('\n');
        return {
            kind: kind.trim(),
            input: rest.join('\n'),
        };
    }
}
exports.Action = Action;
//# sourceMappingURL=action.js.map