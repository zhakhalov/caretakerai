import { Action, ActionExample, ActionInput } from '../action';
import { Activity, ActivityKind } from '../activity';
import { ACTIVITY_SEP } from '../constants';

describe('Action', () => {
  class TestAction extends Action {
    get exit(): boolean {
      return false;
    }
    get kind(): string {
      return 'TestAction';
    }
    get description(): string {
      return 'This is a test action';
    }
    get examples(): ActionExample[] {
      return [];
    }
    execute(input: ActionInput): Promise<string> {
      return Promise.resolve('TestAction executed');
    }
  }

  let action: TestAction;
  let input: ActionInput;

  beforeEach(() => {
    action = new TestAction();
    input = {
      input: 'test',
      agent: null,
    };
    const activity1 = new Activity({ kind: ActivityKind.Observation, input: 'TestObservation' });
    const activity2 = new Activity({ kind: ActivityKind.Thought, input: 'TestThought' });
    const activity3 = new Activity({ kind: ActivityKind.Action, input: 'TestAction' });
    action.examples = [
      {
        description: 'This is a test example',
        activities: [activity1, activity2, activity3]
      }
    ];
  });

  it('should have abstract properties', () => {
    expect(action.exit).toBe(false);
    expect(action.kind).toBe('TestAction');
    expect(action.description).toBe('This is a test action');
    expect(action.examples).toEqual([
      {
        description: 'This is a test example',
        activities: [activity1, activity2, activity3]
      }
    ]);
  });

  it('should execute', async () => {
    const spy = spyOn(action, 'execute');
    await action.execute(input);
    expect(spy).toHaveBeenCalledWith(input);
    spy.mockRestore();
  });

  it('should convert action to string', () => {
    const result = action.toString();
    const expected = `### TestAction\nThis is a test action\n\n#### Examples\n${activity1.toString()}\n${activity2.toString()}\n${activity3.toString()}\n`;
    expect(result).toEqual(expected);
  });
});
