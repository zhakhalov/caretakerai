# @caretaker/agent

<p align="center">
  <em>LangChain for Engineers - Build intelligent agents that think, reason, and act.</em>
</p>

<p align="center">
  <em>A streamlined framework for developers who want results, not complexity.</em>
</p>

## Why @caretaker/agent?

Traditional LLM frameworks like `langchain` offer immense flexibility but can be overwhelming. `@caretaker/agent` provides a streamlined developer experience for building AI agents that can:

- 🤔 **Think & Reason** - Break down complex problems through structured reasoning
- 🔄 **Learn & Adapt** - Improve responses through [Reflexion](https://www.promptingguide.ai/techniques/reflexion)
- 🎯 **Execute & Verify** - Take actions and validate results
- 👥 **Interact Naturally** - Engage in clear, contextual dialogue

## Quick Example

```typescript
const agent = new Agent({
  objective: `You are a Mathematical Assistant that helps solve complex calculations.`,
  typeDefs: /* graphql */`
    type Query {
      subtract(input: OperationInput!): CalculationResult!
    }
  `,
  resolvers: {
    Query: {
      subtract: (_, { input: { left, right } }) => ({
        result: left - right
      })
    }
  },
  history: [
    new Activity({
      kind: ActivityKind.Observation,
      input: `
        data:
          say:
            reply: What is (78 - 13) / (21 * 32 + 18)?
      `,
    })
  ]
});

await agent.invoke();
```

## Key Features

### 🎯 Clear Objectives
Define your agent's purpose and behavior through structured objectives:
```markdown
You are a [Role] that [Primary Purpose].

**Your responsibilities:**
1. [Primary Task]
2. [Secondary Task]
...
```

### 📋 Type-Safe Operations
Specify available operations using GraphQL schemas:
```graphql
type Query {
  """
  Adds two numbers together
  """
  subtract(input: OperationInput!): CalculationResult!
}
```

### 🔄 Transparent Reasoning
Watch your agent's thought process in real-time:
````md
<BEGIN THOUGHT>
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
<END THOUGHT>

<BEGIN ACTION>
```graphql
query {
  subtract(input: {left: 78, right: 13}) {
    result
  }
}
```
<END ACTION>
````

## Real-World Examples

### 🧮 [Intelligent Calculator](packages/examples/0_calculator)
Mathematical problem-solving with step-by-step explanations:
```
(78 - 13) / (21 * 32 + 18)
```

### 🔍 [RAG Assistant](packages/examples/1_rag)
Information retrieval and synthesis from documents:
```
"What are the key benefits of the ReAct framework?"
```

### 📄 [Document Processor](packages/examples/2_idp)
Multi-agent system for intelligent document analysis:
```
"Extract and summarize revenue data by client"
```

## Getting Started

```bash
npm install @caretaker/agent
```

## Documentation

- [Framework Guide](packages/agent)
- [Example Applications](packages/examples)

## License

[LICENSE](LICENSE)