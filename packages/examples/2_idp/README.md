# Calculator Example

This Calculator example demonstrates how to set up a simple calculator using the `@caretaker/agent` framework along with `langchain` for language model integration and arithmetic operations.

## Overview

The main components of this example are:

- `Agent`: The core entity that orchestrates the calculation process.
- `OpenAI`: The language model used for generating responses and performing calculations.
- `Say`, `Sum`, `Multiply`, `Subtract`, `Divide`: Actions that perform arithmetic operations.
- `SimpleOptimizer`: An optimizer that ensures the word count of activities does not exceed a certain limit.

## Setup

To run this example, you need to set up the environment with the necessary dependencies. Ensure that you have installed the `@caretaker/agent` and `langchain` packages.

## Running the Example

Execute `npm start:calculator` from `examples` package root to start the Calculator agent. The agent will use the provided actions to perform arithmetic operations and optimize the conversation flow based on the defined objectives.

**Note:** `OPENAI_API_KEY` should be supplied in `.env` file in `examples` package root

## Objectives

The agent aims to:

1. Help the user with math.
2. Use actions for calculations.
3. Follow the Order of Operations: PEMDAS.

For more details on how the arithmetic actions are implemented, refer to their respective `.ts` files in the `actions` directory.

