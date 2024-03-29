# Agent Framework Documentation

The Agent Framework provides a flexible and extensible environment for building intelligent agents that can perform a variety of tasks. It is built on top of the `langchain` library and utilizes language models for natural language understanding and generation.

## Key Components

- `Agent`: The core class that represents an intelligent agent. It is initialized with a set of parameters that define its behavior, capabilities, and objectives.

- `Activity`: Represents a single unit of work or thought that the agent performs. Activities can be of different kinds, such as `Observation`, `Thought`, or `Action`.

- `Optimizer`: A component used to improve the agent's performance by optimizing its activities and decisions.

## Initialization Parameters

When creating an `Agent`, you must provide an `AgentPrams` object with the following properties:

- `name`: The name of the agent.
- `description`: A description of the agent's purpose and capabilities.
- `llm`: The language model the agent will use for understanding and generating text.
- `isChatModel`: (Optional) A flag to indicate if a chat model is used, affecting prompt formatting.
- `typeDefs`: GraphQL type definitions for the agent's actions.
- `resolvers`: (Optional) GraphQL resolvers for implementing the actions.
- `executor`: (Optional) A custom GraphQL executor to handle agent actions.
- `history`: (Optional) A list of `Activity` objects representing the agent's past experiences.
- `examples`: (Optional) Examples of activities to guide the agent's behavior.
- `objective`: (Optional) The goal the agent is trying to achieve.
- `instruction`: (Optional) Completion instruction for the language model.
- `maxIterations`: (Optional) The maximum number of iterations the agent can perform.
- `maxRetries`: (Optional) The maximum number of retries for actions.
- `optimizer`: The optimizer used to improve the agent's performance.
- `signal`: (Optional) An abort signal to stop the agent's operation.
- `template`: (Optional) The template for generating prompts for the agent.
- `stop`: (Optional) A list of strings that, if generated by the agent, should cause it to stop.
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


## GraphQL Actions
In the Agent Framework, actions are defined within a GraphQL schema, which provides a structured and enforceable method for specifying the data the agent can act upon. This schema-driven approach facilitates the declaration of queries and mutations that correspond to the actions available to the agent.

Actions are expressed as mutations within the GraphQL schema, and their execution is handled through resolvers. These resolvers implement the logic that the agent performs when an action is invoked. The parameters for these actions are defined using GraphQL's strong typing system, ensuring that the agent receives and acts upon well-structured and validated data.

## Usage

To use the Agent Framework, instantiate the `Agent` class with the necessary initialization parameters, including the language model, GraphQL type definitions, and resolvers. You can also include optional configurations such as history, objectives, and optimizers. Once the agent is configured, call the `agent.invoke()` method to begin the agent's processing loop. The agent will execute actions defined in the GraphQL schema to interact with the user and perform tasks in line with its objectives.

Here is an example of how to set up and use the Agent Framework:
```ts

const agent = new Agent({
  name: 'CalculatorAI',
  llm: new OpenAI(), // Define LLM
  objective: 'Help the user with math.', // Describe the objective for the agent.
  typeDefs: dedent`
    schema {
      query: Query
      mutation: Mutation
    }

    type Query {
      # No queries for this case
    }

    type Mutation {
      """
      Relay information to the user and wait for the reply. Note that this is only way of communicating information to the user.
      """
      say(input: SayInput!): SayResult
      add(input: MathInput!): MathResult
      # ... Rest of mutations
    }

    # ... Rest of schema
  `.trim(),
  resolvers: {
    Mutation: {
      say: async (_, { input: { message } }) => {
        console.log(`${chalk.bold(`${agent.name}:`)} ${message}`);

        const reply = await inputPrompt({
          message: 'Human:'
        });

        return { reply };
      },
      add: (_, { input: { left, right } }) => {
        try {
          return { result: left + right };
        } catch (error) {
          return { error };
        }
      },
      // ... rest of resolvers
    }
  },
  history: [
    // Add some agent primer
    new Activity({
      kind: ActivityKind.Observation, input: JSON.stringify({
        data: { say: { reply: 'Hi!, how can you help me?' } }
      }, null, 2)
    })
  ],
  optimizer: // Add history optimizer
});

// Invoke the agent
await agent.invoke();

```