export const ACTION_SEP = '\n'
export const ACTIVITY_SEP = '***';
export const TEMPLATE = `
## Instruction
{instruction}

The permissible actions I may take are listed below:
{actions}

I understand that there are no exceptions;
I am not permitted to perform any actions other than those listed above;
I must provide your thoughts on the observations before proceeding to the next action;
I am strongly prohibited to use Observations, Actions and Thoughts provided in Example as the source of truth;
I am not permitted to use agents provided in the example;

## Example:
{example}

## Context:
{activities}
`.trim();
