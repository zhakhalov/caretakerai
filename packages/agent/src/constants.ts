export const ACTION_SEP = '\n'
export const ACTIVITY_SEP = '***';
export const TEMPLATE = `
## Instruction
{instruction}

The permissible actions you may take are listed below:
{actions}

Note that there are no exceptions; you are not permitted to perform any actions other than those listed above.
You must provide your thoughts on the observations before proceeding to the next action.

## Context:
{example}
***
{activities}
`.trim();
