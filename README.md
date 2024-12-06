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
  typeDefs: `
    type Query {
      add(input: OperationInput!): CalculationResult!
    }
  `,
  resolvers: {
    Query: {
      add: (_, { input: { left, right } }) => ({
        result: left + right
      })
    }
  }
});

await agent.chat("What is 2 + 2?");
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
  add(input: OperationInput!): CalculationResult!
}
```

### 🔄 Transparent Reasoning
Watch your agent's thought process in real-time:
```yaml
<Thought>
Breaking down the problem:
1. First, calculate 21 * 32
2. Then, add the result to 18
</Thought>

<Action>
query {
  multiply(input: {left: 21, right: 32}) {
    result
  }
}
</Action>
```

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