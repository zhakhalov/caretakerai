# Agent Framework Documentation

The Agent Framework provides a flexible and extensible environment for building intelligent agents that can perform a variety of tasks. It is built on top of the `langchain` library and utilizes language models for natural language understanding and generation.

## Key Components

- `Agent`: The core class that represents an intelligent agent. It is initialized with a set of parameters that define its behavior, capabilities, and objectives.

- `Activity`: Represents a single unit of work or thought that the agent performs. Activities can be of different kinds, such as `Observation`, `Thought`, or `Action`.

- `Action`: A subclass of `Activity` that represents a concrete action the agent can take.

- `Optimizer`: A component used to improve the agent's performance by optimizing its activities and decisions.

## Initialization Parameters

When creating an `Agent`, you must provide an `AgentPrams` object with the following properties:

- `name`: The name of the agent.
- `llm`: The language model the agent will use for understanding and generating text.
- `actions`: A list of `Action` objects that the agent can perform.
- `description`: (Optional) A description of the agent's purpose and capabilities.
- `history`: (Optional) A list of `Activity` objects representing the agent's past experiences.
- `examples`: (Optional) Examples of activities to guide the agent's behavior.
- `constraints`: (Optional) A list of constraints that the agent must adhere to.
- `objective`: (Optional) The goal the agent is trying to achieve.
- `thoughtSuffix`: (Optional) A suffix to append to thoughts in the agent's output.
- `actionSuffix`: (Optional) A suffix to append to actions in the agent's output.
- `maxIterations`: (Optional) The maximum number of iterations the agent can perform in a single run.
- `maxRetries`: (Optional) The maximum number of retries for actions.
- `optimizer`: The optimizer used to improve the agent's performance.
- `template`: (Optional) The template for generating prompts for the agent.
- `logger`: (Optional) The logger the agent will use for outputting information.

## Objective
The `objective` parameter defines the goal or purpose that the Agent is trying to achieve. It is a guiding force for the Agent's behavior and decision-making process. When initializing an Agent, you can optionally provide an objective to inform the Agent's actions and ensure they align with the desired outcomes. Here is an example of how an objective might be set:

```typescript
const agent = new Agent({
  // ... other parameters
  objective: `Help the user with math calculations using specific actions.`,
});
```

The objective will be included in the Agent's prompt template to provide context to the language model, ensuring that the Agent's interactions are focused and relevant to the goal.


## Action
Actions are the mechanisms through which an AI agent interacts with the application and its environment. They are the operational components that translate the agent's decisions into executable tasks. Each action extends from an abstract `Action` class, which provides a common structure and ensures compatibility with the agent framework.

Here's an example of an `Action` subclass:

```typescript
import { Action, ActionInput } from '@caretaker/agent';

export class Say extends Action {
  async call(input: ActionInput): Promise<void> {
    // Logic to perform the action, e.g., output a message
    console.log(input.params.message);
  }
}
```

In this `Say` action example, the `call` method is where the action's specific behavior is implemented. When an agent decides to use the `Say` action, it will call this method, passing in the necessary parameters.

Actions are defined and added to the agent's configuration, allowing the agent to use them during its processing loop. They serve as the bridge between the AI's decision-making capabilities and the application's functional operations, enabling the agent to perform tasks such as communicating with the user or calculating results.

The parameters for actions are defined using JSON Schema, which provides a clear and enforceable structure for the data that an action can accept. This ensures that the agent and the actions it performs can interact with consistent and validated data formats.

For example, in the `Say` action from `@say.ts`, the parameters are defined as follows:

```typescript
const SayParamsSchema = z.object({
  message: z.string().describe('message to say to the user'),
}).describe('Parameters for Say action');
```

This schema is then converted to a JSON Schema, which is used by the `Say` action to validate the parameters before the action is executed:

```typescript
const SayParamsJsonSchema = zodToJsonSchema(SayParamsSchema, 'SayParamsSchema')
  .definitions!.SayParamsSchema as JSONSchema;
```

The use of JSON Schema in action parameters allows for the automatic validation of inputs, ensuring that only the correct data types and structures are passed to the action's `call` method. This is crucial for maintaining the integrity of the agent's operations and preventing runtime errors due to invalid data.


The `Multiply` action example above demonstrates how to define an action with input parameters and a return type using Zod schemas and TypeScript. The `params` property is assigned a JSON Schema that is generated from the Zod schema, which is used for runtime validation of the action's input parameters. The `call` method implements the logic to multiply an array of numbers, which are provided as input parameters, and returns the multiplication result. This action can be used by the agent to perform multiplication operations as part of its task execution.


```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

// Define the parameters schema using Zod for the Multiply action
const MultiplyParamsSchema = z.array(z.number()).describe('Array of numbers to multiply');
// Infer the TypeScript type from the Zod schema
type MultiplyParams = z.infer<typeof MultiplyParamsSchema>;
// Convert the Zod schema to a JSON Schema for runtime validation
const MultiplyParamsJsonSchema = zodToJsonSchema(MultiplyParamsSchema, 'MultiplyParamsSchema')
  .definitions!.MultiplyParamsSchema as JSONSchema;

// Define the result schema using Zod for the Multiply action
const MultiplyResultSchema = z.number().describe('The result of the multiplication');
// Infer the TypeScript type from the Zod schema
type MultiplyResult = z.infer<typeof MultiplyResultSchema>;
// Convert the Zod schema to a JSON Schema for runtime validation
const MultiplyResultJsonSchema = zodToJsonSchema(MultiplyResultSchema, 'MultiplyResultSchema')
  .definitions!.MultiplyResultSchema as JSONSchema;

// Multiply action class definition
export class Multiply extends Action<MultiplyParams, MultiplyResult> {
  // Assign the JSON Schema to the params and result properties
  readonly params = MultiplyParamsJsonSchema;
  readonly result = MultiplyResultJsonSchema;
  // Define whether this action should signal the agent to exit
  readonly exit = false;
  // Define the kind of action, which is the class name
  readonly kind = Multiply.name;
  // Provide a description for the action
  readonly description = 'Multiply the numbers and provide you with the result.';
  // Provide examples of usage (optional)
  readonly examples = [];

  // The call method is invoked by the agent when this action is performed
  async call({ params }: ActionInput<MultiplyParams>): Promise<MultiplyResult> {
    // Implement the action logic: multiply the numbers provided in params
    return params.reduce((acc, n) => acc * n, 1);
  }
}
```

## Usage

To use the Agent Framework, create an instance of the `Agent` class with the necessary parameters, including the language model, actions, and any optional configurations such as history, objectives, and optimizers. Then, invoke the `agent.invoke()` method to start the agent's processing loop. The agent will utilize the provided actions, such as `Say` to communicate with the user or `Multiply` to perform multiplication tasks, to fulfill its objectives within the given constraints.

```typescript
import { Agent, Activity, ActivityKind } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';

const llm = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 256,
});

const agent = new Agent({
  name: 'CalculatorAI',
  description: 'An agent that performs arithmetic operations',
  llm,
  actions: [
    new Say(),
    // ... other actions
  ],
  history: [
    new Activity({ kind: ActivityKind.Observation, input: 'The user says: How can you help me?' })
  ],
  // ... other parameters
});

await agent.invoke();
```

