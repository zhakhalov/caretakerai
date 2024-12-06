# Building an Mathematical Problem-Solving Assistant with @caretaker/agent

Agentic applications allow AI to interact with users and adapt to complex tasks in dynamic ways. This example demonstrates building an intelligent calculator using the `@caretaker/agent` framework, showcasing how AI can handle calculations while offering clear, step-by-step explanations.

## Overview

The `@caretaker/agent` framework empowers developers to create sophisticated, AI-powered applications capable of tackling complex challenges through multi-pass reasoning. Our Intelligent Calculator example highlights this capability by effectively handling intricate mathematical expressions such as:

```
(78 - 13) / (21 * 32 + 18)
```

To illustrate how this works in practice, consider the following interaction log, where the AI agent processes a user's request to solve the expression step by step:

```xml
<Observation>
data:
  say:
    reply: solve (78 - 13) / (21 * 32 + 18) for me

</Observation>
<Thought>
The user has requested to solve the expression (78 - 13) / (21 * 32 + 18).

To solve this, I need to follow the order of operations (PEMDAS):
1. Calculate the expressions within the parentheses.
2. Calculate the multiplication and addition within the denominator.
3. Finally, perform the division.

Remaining steps:
1. Solve the expression (78 - 13).
2. Calculate (21 * 32 + 18).
3. Divide the results from step 1 and step 2.

I'll first calculate (78 - 13).
</Thought>

<Action>
query {
  subtract(input: {left: 78, right: 13}) {
    result
  }
}
</Action>
<Observation>
data:
  subtract:
    result: 65

</Observation>
<Thought>
The result of the expression (78 - 13) is 65.

Next, I need to calculate the denominator, which is (21 * 32 + 18):
1. First, calculate 21 * 32.
2. Then, add 18 to that result.

I'll start by calculating 21 * 32.
</Thought>

<Action>
query {
  multiply(input: {left: 21, right: 32}) {
    result
  }
}
</Action>
<Observation>
data:
  multiply:
    result: 672

</Observation>
<Thought>
The result of the multiplication (21 * 32) is 672.

Now, I will calculate the denominator by adding 18 to this result:
1. Add 672 and 18 to get the final denominator.

I'll perform this addition now.
</Thought>

<Action>
query {
  add(input: {left: 672, right: 18}) {
    result
  }
}
</Action>
<Observation>
data:
  add:
    result: 690

</Observation>
<Thought>
The result of the expression (21 * 32 + 18) is 690.

Now that I have both the numerator and denominator:
- Numerator: 65
- Denominator: 690

I will now perform the division (65 / 690) to get the final result.
</Thought>

<Action>
query {
  divide(input: {left: 65, right: 690}) {
    result
  }
}
</Action>
<Observation>
data:
  divide:
    result: 0.09420289855072464

</Observation>
```

This step-by-step process showcases how the AI agent deconstructs and solves problems in a manner similar to a skilled mathematician, making each step transparent to the user. By explaining its thought process, the agent not only solves the problem but also enhances the user's understanding of mathematical principles. This project is a prime example of how agentic applications can blend computational efficiency with pedagogical clarity, providing both practical solutions and an interactive learning experience. Through tools like these, we can open doors to a wide array of applications—from educational software that adapts to each student's learning pace, to intelligent assistants that offer real-time problem-solving insights.

## Objective Structure

In the `@caretaker/agent` framework, defining clear objectives is essential for guiding an AI agent's behavior. Our Intelligent Calculator demonstrates this with a structured, three-part approach that establishes precise boundaries and expectations.

### 1. Identity Statement
```
You are a Mathematical Problem-Solving Assistant that helps users with calculations.
```
This initial statement sets the stage by defining the agent's primary role and purpose. Establishing a clear identity at the outset ensures the AI maintains its intended focus and behavior throughout user interactions, much like a concise job description.

### 2. Core Responsibilities
```
**Your responsibilities:**
1. Help users solve mathematical problems step by step.
2. Use mathematical operations (add, subtract, multiply, divide) for all calculations.
3. Follow PEMDAS (Order of Operations) strictly:
   - Parentheses
   - Multiplication and Division (left to right)
   - Addition and Subtraction (left to right)
4. Show your work by:
   - Breaking down complex expressions
   - Explaining each step
   - Using mathematical operations to verify results
5. Communicate clearly with the user about each step.
6. End the session when the user says "Thank you!" with the final result.
```
This section delineates the agent's specific tasks and rules, breaking down responsibilities into prioritized, specific, and actionable steps. Each responsibility aligns with operations available in the TypeDefs, ensuring the agent's actions are both logical and predictable.

### 3. Behavioral Guidelines
```
**Remember to:**
- Start with a friendly introduction.
- Validate inputs before calculations.
- Explain your problem-solving approach.
- Handle errors gracefully (e.g., division by zero, invalid inputs).
```
These guidelines dictate the agent's interaction style and error management strategy. By setting protocols for user engagement and error handling, they ensure a consistent, safe, and reassuring experience for users.

### Why This Structure Matters

This structured approach to defining objectives is effective because it provides:

1. **Clarity**: Differentiates each section's purpose, aiding the AI in understanding its role.
2. **Completeness**: Covers both functionality (what to do) and expected behavior (how to do it).
3. **Hierarchy**: Outlines a clear priority from overall identity to specific tasks and guidelines.
4. **Actionability**: Directly maps to operations defined in TypeDefs, fostering reliable execution.

Using this framework to build agentic applications ensures that your AI remains focused, logical, and user-friendly, ultimately leading to more reliable and predictable behavior in solving complex problems.

## TypeDefs: Defining Agent Capabilities

In the `@caretaker/agent` framework, GraphQL schema definitions, or TypeDefs, serve as a crucial contract between your application and the AI agent. They outline the specific operations the agent can perform and define how these operations interact with the world around them.

### Core Operations

The TypeDefs specify the fundamental mathematical operations available to our calculator:

```graphql
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
```

### Understanding the Operations

1. **Query Operations**
   - Define the calculator's computational abilities.
   - Each operation takes two numerical inputs and yields a result.
   - Conform to mathematical conventions, ensuring consistency and reliability.

2. **Mutation Operations**
   - Allow for dynamic user interaction via the `say` mutation.
   - Enable the agent to articulate its reasoning and handle conversational exchanges effectively.

### The Power of Documentation

Think of the AI as a developer exploring your system in real-time. Just as human developers rely on comprehensive API documentation, the AI uses your GraphQL docstrings to comprehend and interact with the application effectively.

```graphql
type Query {
  """
  Adds two numbers together.
  """
  add(input: OperationInput!): CalculationResult!
}
```

GraphQL docstrings (wrapped in `"""`) are critical for several reasons:
- They serve as real-time guides for the AI, detailing what each operation entails.
- They help the AI determine the most suitable operation for a given task.
- They establish clear boundaries for how operations should be used.
- They enhance the AI's decision-making process by providing context and clarity.

By ensuring that your TypeDefs are transparent and thoroughly documented:
- The AI gains a better understanding of your system's full range of capabilities.
- The AI's operation selection becomes more precise and informed.
- The quality of problem-solving improves markedly, reducing errors and misunderstandings.

Writing detailed, intentional documentation is akin to preparing an experienced developer to interact with your API for the first time, ensuring seamless integration and maximizing the potential of your system's capabilities.

## Resolvers: Implementing Agent Capabilities

Resolvers are the functional core of your application, providing the actual implementation for the operations defined in your TypeDefs. They serve as the bridge between the AI's decision-making framework and practical execution, ensuring that calculations and interactions are carried out correctly and efficiently within the `@caretaker/agent` framework.

### Implementation Example

Here’s an example of how resolvers are structured:

```typescript
const agent = new Agent({
  // ... other configuration ...
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
```

### Resolver Best Practices

1. **Maintain Atomicity in Implementations**
   Each resolver should focus on a single task as defined by the TypeDefs. Keeping operations atomic ensures predictable and reliable behavior by avoiding mixed responsibilities.

   ```typescript
   add: (_, { input: { left, right } }) => ({
     result: left + right
   })
   ```

2. **Implement Robust Error Handling**
   Anticipate potential errors and provide clear feedback, which assists the AI in understanding what went wrong and adjusting its reasoning and actions accordingly.

   ```typescript
   divide: (_, { input: { left, right } }) => {
     if (right === 0) {
       throw new Error('Division by zero is not allowed');
     }
     return { result: left / right };
   }
   ```

3. **Align Implementations with TypeDef Contracts**
   Ensure resolvers return data according to the shape and format specified by the corresponding TypeDefs. Incorrect return shapes are not permissible by GraphQL and will be communicated back to the AI, ensuring adherence to expected data contracts.

   ```typescript
   // TypeDef specifies:
   // add(input: OperationInput!): CalculationResult!

   // Hence, the resolver must return:
   add: (_, { input }) => ({
     result: input.left + input.right
   })
   ```

By adhering to these principles, resolvers effectively translate defined operations into reliable executions, empowering your AI-driven calculator to function both accurately and efficiently. This alignment helps maintain the integrity of your application's design, ensuring that the AI interacts with users in an intelligent, responsive manner that mimics human-like problem-solving skills.

## Conclusion
Building an intelligent calculator with the `@caretaker/agent` framework reveals the capacity for agentic applications to tackle complex tasks while providing user-friendly interactions. By setting clear objectives and capabilities, AI can handle intricate calculations and explain its logic clearly. This approach showcases AI's ability to offer educational value and dynamic interaction, applicable across many fields. From education to finance, the principles demonstrated here lay the foundation for creating AI solutions that not only solve problems but also enhance user comprehension. As developers refine these methods, we unlock new possibilities for intelligent, adaptable AI behavior to address various challenges.