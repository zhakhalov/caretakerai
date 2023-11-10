import dedent from 'dedent';
import { Action, ActionInput, Activity, ActivityKind, Agent } from '@caretaker/agent';

export class Collaborate extends Action {
  readonly exit = false;
  readonly kind = Collaborate.name;
  readonly description = 'Use this action to employ another AI agent.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
  //Observation 1// The search results revealed these pieces of information:
  UserProfileDataExtractor(uuid: 88d85160-0566-4f0c-8f75-b08387de0b12) - specializes in extracting information from user profiles and their professional experience.
  [...]
  JobProfileDataExtractor(uuid: 6827f475-e6be-4bb0-91a4-df4b83cdb972) - specializes in extracting job descriptions and their requirements.
  //Thought 1// UserProfileDataExtractor would be a beneficial tool for gathering specific information about the user's qualifications, experience, and skills. JobProfileDataExtractor, on the other hand, can provide information about the Senior Software Developer position at XYZ corporation. I'll initiate collaboration with both these agents.
  //Action 1// Collaborate
  88d85160-0566-4f0c-8f75-b08387de0b12
  Gather the user's qualifications, experience, and skills.
      `)
    }
  ]

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
