# QnA Example

This QnA example demonstrates how to set up a question-and-answer system using the `@caretaker/agent` framework along with `langchain` for language model integration and retrieval capabilities.

## Overview

The main components of this example are:

- `Agent`: The core entity that orchestrates the QnA process.
- `OpenAI`: The language model used for generating responses and understanding queries.
- `Search`: An action that performs text searches within a knowledge base and returns results.
- `SimpleOptimizer`: An optimizer that ensures the word count of activities does not exceed a certain limit.

## Setup

To run this example, you need to have a retriever set up. The retriever can be created from documents using `fromDocuments` or loaded from an existing index using `fromExistingIndex`. The documents should be placed in the `qna/docs` directory.

## Running the Example
- Add PDF files to `docs/` directory so the agent can index them.
- Execute `npm start:qna` from `examples` package root to start the QnA agent. The agent will use the provided retriever to search for answers to user queries and optimize the conversation flow based on the defined objectives.

**Note:** `OPENAI_API_KEY` should be supplied in `.env` file in `examples` package root

## Objectives

The agent aims to:

1. Help the user with finding information.
2. Search no more than 7 times before providing the answer.
3. Ensure subsequent searches are different from one another.
4. Prefer multiple searches to answer complex questions.

For more details on how the `Search` action and the retriever are implemented, refer to `search.ts` and `retriever.ts` respectively.
