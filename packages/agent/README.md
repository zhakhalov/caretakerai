## Introduction

Designed specifically for developers and engineers, the `@caretaker/agent` streamlines the creation of intelligent agent applications by offering an intuitive and accessible alternative to the broader, more flexible `langchain` library. While `langchain` provides extensive capabilities for building language model-based solutions, the `@caretaker/agent` distills these functionalities into a focused environment that simplifies the development process.

With its emphasis on ease of use and rapid deployment, the `@caretaker/agent` enables developers to build AI agents that can perform complex tasks, interact naturally with users, and adapt to dynamic contexts—all while minimizing the overhead associated with configuration and integration. Based on the [ReAct framework](https://www.promptingguide.ai/techniques/react), it provides a structured approach to reasoning and action that makes AI behavior more predictable and reliable.

This framework empowers engineers to implement AI-driven solutions that are intelligent, responsive, and contextually aware, making it an ideal choice for projects ranging from document processing automation to enhanced customer support systems. With its focus on accessibility and practical functionality, the `@caretaker/agent` acts as the bridge between sophisticated language model capabilities and real-world agentic applications.

## Key Components

In the `@caretaker/agent`, there are fundamental components that form the backbone of any agentic application. These are essential for setting up the basic functionalities of an agent and ensuring it can perform its tasks effectively.

## Objective

The **Objective** is a cornerstone for guiding an agent's behavior and decision-making processes. It defines the purpose or goal the agent is striving to achieve.

Key Components of a Good Objective:

1. **Identity Statement**
- Clear definition of who/what the agent is
- Specific role and purpose
- Sets the context for all interactions

2. **Core Responsibilities**
- Detailed list of specific tasks
- Clear prioritization
- Actionable and measurable goals
- Direct mapping to available operations (TypeDefs)

3. **Behavioral Guidelines**
- Interaction style and tone
- Error handling protocols
- Best practices for engagement

### Example Structure

Here's a template for writing a good objective:

```markdown
You are a [Role/Identity] that [Primary Purpose].

**Your responsibilities:**
1. [Primary Task]
2. [Secondary Task]
3. [Additional Tasks...]
4. [Process Guidelines]
5. [Output Expectations]

**Remember to:**
- [Behavioral Guideline 1]
- [Behavioral Guideline 2]
- [Error Handling Protocol]
- [Communication Style]
```

### Best Practices

1. **Be Specific and Clear**
   - Avoid ambiguous language
   - Define concrete boundaries
   - Use actionable verbs

2. **Align with Available Operations**
   - Ensure objectives map to defined TypeDefs
   - Reference available tools and capabilities
   - Stay within system constraints

3. **Include Success Criteria**
   - Define what good performance looks like
   - Specify output formats or requirements
   - Include quality standards

4. **Address Edge Cases**
   - Include error handling guidelines
   - Specify limitations
   - Provide fallback behaviors

### Real Example

```markdown
You are a Technical Documentation Assistant that helps developers write clear and comprehensive documentation.

**Your responsibilities:**
1. Review and enhance documentation structure
2. Suggest improvements for clarity and completeness
3. Ensure consistency in terminology and formatting
4. Follow documentation best practices:
   - Use clear headings and sections
   - Include relevant examples
   - Maintain appropriate technical depth
5. Provide actionable feedback on improvements

**Remember to:**
- Maintain a professional and constructive tone
- Support suggestions with reasoning
- Handle unclear requests by asking for clarification
- Use markdown formatting for better readability
```

This structured approach ensures that your agent has clear direction, understands its boundaries, and can effectively execute its intended purpose while maintaining appropriate behavior and interaction patterns.

## TypeDefs

GraphQL **TypeDefs** specify the operations that an agent can perform. They define the structure and format of queries and mutations that the agent can handle, serving as a blueprint for its interactions.

### Benefits of GraphQL for Defining Agent Capabilities

GraphQL schema definitions, or TypeDefs, serve as a crucial contract between your application and the AI agent. They outline the specific operations the agent can perform and define how these operations interact with the world around them.

1. **Explicit Input AND Output Contracts**
  - Clearly defines not just what goes in, but what comes out
  - Helps AI understand and predict operation results
  - Enables AI to plan multi-step operations with confidence
  - Example:
  ```graphql
  type Query {
    """
    Adds two numbers together
    """
    add(input: OperationInput!): CalculationResult!
  }

  type CalculationResult {
    """
    The numerical result of the operation
    """
    result: Float!
  }
  ```

2. **Predictable Operation Results**
  - AI knows exactly what data structure to expect
  - Reduces uncertainty in operation planning
  - Allows for better error handling and fallback strategies
  - Makes it easier for AI to chain operations together

3. **Self-Documenting System**
  - Input and output schemas serve as clear contracts
  - Docstrings provide context for both parameters and return values
  - AI can understand both how to call operations and what to expect back
  - Helps AI make informed decisions about operation selection

Think of it as giving the AI both sides of the equation: not just how to ask for something, but exactly what it will get back. This complete picture makes the AI much more effective at planning and executing complex tasks.

### Best Practices

1. **Clear Documentation**
  - Use descriptive docstrings
  - Explain purpose and usage
  - Document edge cases
  - Example:
  ```graphql
  """
  Adds two numbers together and returns their sum.
  Throws an error if inputs are not valid numbers.
  """
  add(input: OperationInput!): CalculationResult!
  ```

2. **Consistent Naming**
  - Use clear, descriptive names
  - Follow GraphQL conventions
  - Maintain consistency across related operations

3. **Input/Output Types**
  - Define clear input structures
  - Specify return types explicitly
  - Use non-nullable fields where appropriate

4. **Operation Organization**
  - Group related operations
  - Separate queries and mutations
  - Use meaningful categorization

### Real Example (Calculator)

```graphql
type Query {
  """
  Adds two numbers together
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

type CalculationResult {
  """
  The result of the mathematical operation
  """
  result: Float!
}

type UserResponse {
  """
  The user's reply to the message
  """
  reply: String!
}
```

### Why Documented TypeDefs Matter for AI Agents

1. **AI Decision Making**
  - Acts as real-time guidance for the AI to select appropriate operations
  - Helps the AI understand the purpose and limitations of each operation
  - Enables the AI to make informed choices about which operations to use in different scenarios
  - Allows the AI to better map user requests to available capabilities

2. **Context Understanding**
  - Provides the AI with crucial context about operation behavior
  - Helps the AI understand expected inputs and outputs
  - Enables the AI to predict operation outcomes
  - Assists in planning multi-step solutions

3. **Error Handling**
  - Helps the AI anticipate potential failure cases
  - Guides the AI in validating inputs before operations
  - Enables the AI to provide better error explanations to users
  - Allows for graceful fallback strategies

Think of TypeDef documentation as an instruction manual that the AI actively consults while working. Just as a human developer refers to API documentation, the AI uses these docstrings to understand what tools are available and how to use them effectively. This leads to more intelligent and reliable agent behavior, fewer errors, and better user interactions.

### Resolvers: Implementing Agent Capabilities

Resolvers are the functional core of your application, providing the actual implementation for the operations defined in your TypeDefs. They serve as the bridge between the AI's decision-making framework and practical execution, ensuring that calculations and interactions are carried out correctly and efficiently within the `@caretaker/agent` framework.

### Implementation Example

Here's an example of how resolvers are structured:

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

### Activity: The Agent's Thought-Action Cycle

An **Activity** represents a fundamental unit in the agent's cognitive process. Each activity captures a specific phase in the agent's reasoning and execution cycle, forming a structured approach to problem-solving.

### Types of Activities

1. **Observation**
  - Receives and processes input data
  - Captures results of executed actions, enabling the AI to reflect on and learn from its actions ([Reflexion](https://www.promptingguide.ai/techniques/reflexion))
  - Provides feedback from user responses or system execution
  - Example:
  ```yaml
  <Observation>
  data:
    subtract:
      result: 65
  </Observation>
  ```

2. **Thought**
  - Records the agent's reasoning process
  - Plans next steps and strategies
  - Breaks down complex problems
  - Example:
  ```yaml
  <Thought>
  The result of (78 - 13) is 65.

  Next, I need to calculate (21 * 32 + 18):
  1. First, calculate 21 * 32
  2. Then, add 18 to that result
  </Thought>
  ```

3. **Action**
  - Executes specific operations
  - Implements planned decisions
  - Interacts with available resolvers
  - Example:
  ```yaml
  <Action>
  query {
    multiply(input: {left: 21, right: 32}) {
      result
    }
  }
  </Action>
  ```

This cycle of Observation → Thought → Action creates a transparent and traceable decision-making process, allowing the agent to handle complex tasks while maintaining clear reasoning and execution paths.

## Conclusion

The `@caretaker/agent` framework provides a structured, yet flexible approach to building AI-powered applications. Through its core components:

- **Objectives** define clear boundaries and expectations for agent behavior
- **TypeDefs** create explicit contracts for agent capabilities
- **Resolvers** implement the actual functionality
- **Activities** enable transparent reasoning and execution cycles

This architecture, built on proven approaches like ReAct and Reflexion, enables developers to create AI agents that are both powerful and predictable. The framework's emphasis on clear documentation, type safety, and structured interaction patterns helps ensure that AI behavior remains consistent and reliable across different use cases.

Whether you're building automated assistants, processing systems, or interactive tools, the `@caretaker/agent` framework provides the foundation needed to bridge the gap between sophisticated language models and practical applications. By following the patterns and practices outlined in this documentation, developers can create AI solutions that are not just intelligent, but also maintainable, scalable, and user-friendly.