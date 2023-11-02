
import { Action, ActionInput } from '@caretaker/agent';

export class SendEmail extends Action {
  readonly exit = true;
  readonly kind = SendEmail.name;
  readonly description = 'Use this action to send an email to the hiring manager.';

  async execute({ input }: ActionInput) {
    console.log(input);

    return 'done';
  }
}