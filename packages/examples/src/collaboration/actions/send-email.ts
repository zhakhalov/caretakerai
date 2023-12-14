
import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';

export class SendEmail extends Action {
  readonly exit = true;
  readonly kind = SendEmail.name;
  readonly description = 'This action allows the AI agent to send an email on behalf of the user. The email attributes such as body, subject, recipients, CC, BCC, and sender are provided as a JSON Input.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
        //Observation 1// The User says: Can you draft an email for the hiring manager regarding my application update?
        //Thought 1// User requires an email to be sent to the hiring manager about an update in their job application. I can draft the email and use the SendEmail action to send it.
        //Action 1// SendEmail
        {
          "body": "Attached is the updated document for my application. Thank you for considering my application.",
          "subject": "Job Application Update",
          "recipients": ["hiringmanager@xyzcorp.com"],
          "cc": ["assistant@xyzcorp.com"],
          "bcc": [],
          "sender": "user@email.com"
        }
      `)
    }
  ];

  async call({ input }: ActionInput) {
    console.log(input);

    return 'done';
  }
}