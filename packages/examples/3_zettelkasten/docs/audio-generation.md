Audio generation
================

Learn how to generate audio from a text or audio prompt.

In addition to generating [text](/docs/guides/text-generation) and [images](/docs/guides/images), some [models](/docs/models) enable you to generate a spoken audio response to a prompt, and to use audio inputs to prompt the model. Audio inputs can contain richer data than text alone, allowing the model to detect tone, inflection, and other nuances within the input.

You can use these audio capabilities to:

*   Generate a spoken audio summary of a body of text (text in, audio out)
*   Perform sentiment analysis on a recording (audio in, text out)
*   Async speech to speech interactions with a model (audio in, audio out)

OpenAI provides other models for simple [speech to text](/docs/guides/speech-to-text) and [text to speech](/docs/guides/text-to-speech) - when your task requires those conversions (and not dynamic content from a model), the TTS and STT models will be more performant and cost-efficient.

Quickstart
----------

To generate audio or use audio as an input, you can use the [chat completions endpoint](/docs/api-reference/chat/) in the REST API, as seen in the examples below. You can either use the [REST API](/docs/api-reference) from the HTTP client of your choice, or use one of OpenAI's [official SDKs](/docs/libraries) for your preferred programming language.

Audio output from model

Create a human-like audio response to a prompt

```javascript
import { writeFileSync } from "node:fs";
import OpenAI from "openai";

const openai = new OpenAI();

// Generate an audio response to the given prompt
const response = await openai.chat.completions.create({
  model: "gpt-4o-audio-preview",
  modalities: ["text", "audio"],
  audio: { voice: "alloy", format: "wav" },
  messages: [
    {
      role: "user",
      content: "Is a golden retriever a good family dog?"
    }
  ]
});

// Inspect returned data
console.log(response.choices[0]);

// Write audio data to a file
writeFileSync(
  "dog.wav",
  Buffer.from(response.choices[0].message.audio.data, 'base64'),
  { encoding: "utf-8" }
);
```

```python
import base64
from openai import OpenAI

client = OpenAI()

completion = client.chat.completions.create(
    model="gpt-4o-audio-preview",
    modalities=["text", "audio"],
    audio={"voice": "alloy", "format": "wav"},
    messages=[
        {
            "role": "user",
            "content": "Is a golden retriever a good family dog?"
        }
    ]
)

print(completion.choices[0])

wav_bytes = base64.b64decode(completion.choices[0].message.audio.data)
with open("dog.wav", "wb") as f:
    f.write(wav_bytes)
```

```bash
curl "https://api.openai.com/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
      "model": "gpt-4o-audio-preview",
      "modalities": ["text", "audio"],
      "audio": { "voice": "alloy", "format": "wav" },
      "messages": [
        {
          "role": "user",
          "content": "Is a golden retriever a good family dog?"
        }
      ]
    }'
```

Audio input to model

Use audio inputs for prompting a model

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

// Fetch an audio file and convert it to a base64 string
const url = "https://openaiassets.blob.core.windows.net/$web/API/docs/audio/alloy.wav";
const audioResponse = await fetch(url);
const buffer = await audioResponse.arrayBuffer();
const base64str = Buffer.from(buffer).toString("base64");

const response = await openai.chat.completions.create({
  model: "gpt-4o-audio-preview",
  modalities: ["text", "audio"],
  audio: { voice: "alloy", format: "wav" },
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What is in this recording?" },
        { type: "input_audio", input_audio: { data: base64str, format: "wav" }}
      ]
    }
  ]
});

console.log(response.choices[0]);
```

```python
import base64
import requests
from openai import OpenAI

client = OpenAI()

# Fetch the audio file and convert it to a base64 encoded string
url = "https://openaiassets.blob.core.windows.net/$web/API/docs/audio/alloy.wav"
response = requests.get(url)
response.raise_for_status()
wav_data = response.content
encoded_string = base64.b64encode(wav_data).decode('utf-8')

completion = client.chat.completions.create(
    model="gpt-4o-audio-preview",
    modalities=["text", "audio"],
    audio={"voice": "alloy", "format": "wav"},
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What is in this recording?"
                },
                {
                    "type": "input_audio",
                    "input_audio": {
                        "data": encoded_string,
                        "format": "wav"
                    }
                }
            ]
        },
    ]
)

print(completion.choices[0].message)
```

```bash
curl "https://api.openai.com/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
      "model": "gpt-4o-audio-preview",
      "modalities": ["text", "audio"],
      "audio": { "voice": "alloy", "format": "wav" },
      "messages": [
        {
          "role": "user",
          "content": [
            { "type": "text", "text": "What is in this recording?" },
            {
              "type": "input_audio",
              "input_audio": {
                "data": "<base64 bytes here>",
                "format": "wav"
              }
            }
          ]
        }
      ]
    }'
```

Multi-turn conversations
------------------------

Using audio outputs from the model as inputs to multi-turn conversations requires a generated ID that appears in the response data for an audio generation. Below is an example JSON data structure for a [message you might receive](/docs/api-reference/chat/object#chat/object-choices) from `/chat/completions`:

```json
{
  "index": 0,
  "message": {
    "role": "assistant",
    "content": null,
    "refusal": null,
    "audio": {
      "id": "audio_abc123",
      "expires_at": 1729018505,
      "data": "<bytes omitted>",
      "transcript": "Yes, golden retrievers are known to be ..."
    }
  },
  "finish_reason": "stop"
}
```

The value of `message.audio.id` above provides an identifier you can use in an `assistant` message for a new `/chat/completions` request, as in the example below.

```bash
curl "https://api.openai.com/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-4o-audio-preview",
        "modalities": ["text", "audio"],
        "audio": { "voice": "alloy", "format": "wav" },
        "messages": [
            {
                "role": "user",
                "content": "Is a golden retriever a good family dog?"
            },
            {
                "role": "assistant",
                "audio": {
                    "id": "audio_abc123"
                }
            },
            {
                "role": "user",
                "content": "Why do you say they are loyal?"
            }
        ]
    }'
```

FAQ
---

### What modalities are supported by gpt-4o-audio-preview

`gpt-4o-audio-preview` requires either audio output or audio input to be used at this time. Acceptable combinations of input and output are:

*   text in → text + audio out
*   audio in → text + audio out
*   audio in → text out
*   text + audio in → text + audio out
*   text + audio in → text out

### How is audio in Chat Completions different from the Realtime API?

The underlying GPT-4o audio model is exactly the same. The Realtime API operates the same model at lower latency.

### How do I think about audio input to the model in terms of tokens?

We are working on better tooling to expose this, but roughly one hour of audio input is equal to 128k tokens, the max context window currently supported by this model.

### How do I control which output modalities I receive?

Currently the model only programmatically allows modalities = `[“text”, “audio”]`. In the future, this parameter will give more controls.

### How does tool/function calling work?

Tool (and function) calling works the same as it does for other models in Chat Completions - [learn more](/docs/guides/function-calling).

Next steps
----------

Now that you know how to generate audio outputs and send audio inputs, there are a few other techniques you might want to master.

[

Text to speech

Use a specialized model to turn text into speech.

](/docs/guides/text-to-speech)[

Speech to text

Use a specialized model to turn audio files with speech into text.

](/docs/guides/speech-to-text)[

Realtime API

Learn to use the Realtime API to prompt a model over a WebSocket.

](/docs/guides/realtime)[

Full API reference

Check out all the options for audio generation in the API reference.

](/docs/api-reference/chat)

Was this page useful?