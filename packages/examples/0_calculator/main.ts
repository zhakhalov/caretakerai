import chalk from 'chalk';
import yaml from 'yaml';
import { config } from 'dotenv';
import inputPrompt from '@inquirer/input';
import { ChatOpenAI } from '@langchain/openai';
import { ActivityKind, Agent } from '@caretakerai/agent';
import { LengthTransformer, RemoveErrorActivitiesTransformer } from '@caretakerai/filters';

config();

const objective = `
You are a Mathematical Problem-Solving Assistant that helps users with calculations.

Your responsibilities:
1. Help users solve mathematical problems step by step
2. Use mathematical operations (add, subtract, multiply, divide) for all calculations
3. Follow PEMDAS (Order of Operations) strictly:
   - Parentheses
   - Exponents
   - Multiplication and Division (left to right)
   - Addition and Subtraction (left to right)
4. Show your work by:
   - Breaking down complex expressions
   - Explaining each step
   - Using mathematical operations to verify results
5. Communicate clearly with the user about each step
6. End the session when user says "Thank you!" with the final result

Remember to:
- Start with a friendly introduction
- Validate inputs before calculations
- Explain your problem-solving approach
- Handle errors gracefully (division by zero, invalid inputs)
`.trim();

const typeDefs = /* GraphQL */`
type Query {
  """
  Adds two numbers
  """
  add(input: OperationInput!): CalculationResult!

  """
  Subtracts two numbers
  """
  subtract(input: OperationInput!): CalculationResult!

  """
  Multiplies two numbers
  """
  multiply(input: OperationInput!): CalculationResult!

  """
  Divides two numbers
  """
  divide(input: OperationInput!): CalculationResult!
}

type Mutation {
  """
  Sends a message to the user and waits for their response
  """
  say(message: String!): UserResponse!
}

"""
Input for mathematical operations
"""
input OperationInput {
  """
  First number in the operation
  """
  left: Float!

  """
  Second number in the operation
  """
  right: Float!
}

"""
Result of a mathematical calculation
"""
type CalculationResult {
  """
  The result of the calculation
  """
  result: Float!
}

"""
Response from user interaction
"""
type UserResponse {
  """
  The user's reply to the message
  """
  reply: String!
}
`.trim();

// Configure LLM model
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  callbacks: [{ handleLLMStart: (_, [prompt]) => {
    console.log(prompt)
  } }]
});

// Configure agentic application
const agent = new Agent({
  llm, // Language model instance for processing queries
  objective, // Define agent's behavior and responsibilities (from objective string above)
  maxRetries: 3, // Number of retry attempts for failed operations or LLM completions
  typeDefs, // GraphQL schema defining available operations
  examples: [],
  inputTransformers: [
    new RemoveErrorActivitiesTransformer(), // Forget interactions that resulted in syntax or execution errors
    new LengthTransformer(16), // Limit interaction history to 16 activities
  ],
  // Initialize conversation greeting the agent
  history: [
    {
      kind: ActivityKind.Observation,
      input: yaml.stringify({
        data: {
          say: {
            reply: 'Hi!, how can you help me?',
          },
        },
      }),
    },
  ],

  // Implementation of GraphQL operations
  resolvers: {
    Query: {
      add: (_, { input: { left, right } }) => ({
        result: left + right
      }),
      subtract: (_, { input: { left, right } }) => ({
        result: left - right
      }),
      multiply: (_, { input: { left, right } }) => ({
        result: left * right
      }),
      divide: (_, { input: { left, right } }) => ({
        result: left / right
      }),
    },
    Mutation: {
      say: async (_, { message }) => {
        console.log(`${chalk.bold(`CalculatorAI:`)} ${message}`);
        const reply = await inputPrompt({
          message: 'Human:'
        });
        return { reply };
      },
    }
  },
});

// Start application
async function main() {
  await agent.invoke();
}

main();
