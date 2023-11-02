import { Action, ActionInput, Activity, ActivityKind, Agent } from '@caretaker/agent';

export class Collaborate extends Action {
  readonly exit = false;
  readonly kind = Collaborate.name;
  readonly description = 'Use this action to employ another AI agent.';

  constructor(
    private readonly agents: Agent[]
  ) {
    super();
  }

  async execute({ input, agent }: ActionInput): Promise<string> {
    const [agentName, ...agentInput] = input.split('\n');
    const subordinate = this.agents.find(({ name }) => name == agentName)!;
    const activities: Activity[] = JSON.parse(JSON.stringify(agent.activities)).map((o: Object) => Activity.fromObject(o));
    activities.push(new Activity({
      order: activities.at(-1)!.order + 1,
      kind: ActivityKind.Observation,
      input: `Incoming request from ${agent.name}: ${agentInput.join('\n')}`,
    }));

    subordinate.activities = activities;
    const result = await subordinate.invoke();

    return `${subordinate.name} responded with this data: ${result}`;
  }
}
