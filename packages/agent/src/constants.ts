export const ACTION_SEP = '\n'
export const EXPERIENCE_SEP = '***';
export const TEMPLATE = `
{instruction}

The permissible actions you may take are listed below:
{actions}

Note that there are no exceptions; you are not permitted to perform any actions other than those listed above.
You must provide your thoughts on the observations before proceeding to the next action.

## Task 1:
{example}

## Task 2:
{experience}
`.trim();
