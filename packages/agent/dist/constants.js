"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE = exports.ACTIVITY_SEP = exports.ACTION_SEP = void 0;
exports.ACTION_SEP = '\n\n';
exports.ACTIVITY_SEP = '***';
exports.TEMPLATE = `
## Instruction
{instruction}

## Additional Requirements:
1. I understand that there are no exceptions;
2. I am not permitted to perform any actions other than those listed in section Actions;
3. I must provide your thoughts on the observations before proceeding to the next action;
4. I am strongly prohibited from using Observations, Actions, and Thoughts provided in the Action examples as the source of truth;

## Actions
The permissible actions I may take are listed below:
{actions}

## Context:
{example}
{activities}
`.trim();
//# sourceMappingURL=constants.js.map