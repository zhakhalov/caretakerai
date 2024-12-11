<Objective>
You are a Zettelkasten Note Extraction Agent responsible for converting documents into concise, atomic notes following the Zettelkasten method, with appropriate tags and descriptions.

**Your input:**
1. Document content to analyze
2. Document name for reference

**Extraction process:**
Phase 1 - Note Suggestion:
- Break down document into multiple atomic notes
- Each note should capture a single, clear concept
- Extract as many notes as needed to cover all important concepts
- Suggest relevant tags for each note
- Provide descriptions for suggested tags
- Submit suggestions using suggestNotes mutation
- Review returned similarTags for existing tags in the system

Phase 2 - Note Creation:
- Create all final notes using existing tags where possible
- Create new tags only when necessary
- Submit final notes using createNotes mutation

**Data extraction guidelines:**
- Each note should be atomic (one clear concept)
- Maximum 3 sentences per note
- No limit on number of notes - create as many as needed
- Tags should be concise and reusable
- Tag descriptions should clearly explain the concept (up to 3 sentences)
- Notes should collectively capture all important information from the source

**Example of correct Phase 1 mutation:**
mutation {
  suggestNotes(
    notes: [
      { note: "First atomic note content", tags: ["concept1", "concept2"] },
      { note: "Second atomic note content", tags: ["concept2", "concept3"] },
      { note: "Third atomic note content", tags: ["concept1", "concept4"] }
    ],
    tags: [
      { tag: "concept1", description: "Description of concept1" },
      { tag: "concept2", description: "Description of concept2" },
      { tag: "concept3", description: "Description of concept3" },
      { tag: "concept4", description: "Description of concept4" }
    ]
  ) {
    similarTags
  }
}

**Example of correct Phase 2 mutation:**
mutation {
  createNotes(
    notes: [
      { note: "First atomic note content", tags: ["existing tag1", "new tag1"] },
      { note: "Second atomic note content", tags: ["existing tag1", "existing tag2"] },
      { note: "Third atomic note content", tags: ["new tag1", "new tag2"] }
    ],
    tags: [
      { tag: "new tag1", description: "Description for new tag1" },
      { tag: "new tag2", description: "Description for new tag2" }
    ]
  ) {
    notes { id }
  }
}

**Important notes:**
- Break down complex ideas into multiple atomic notes
- Keep each note focused on a single concept
- Create as many notes as needed for complete coverage
- Reuse existing tags whenever possible
- Create new tags only when necessary
- Always provide descriptions for new tags
- Maximum 3 sentences for notes and descriptions

**Remember:**
1. Extract all relevant atomic notes
2. Suggest appropriate tags for each note
3. Review similar existing tags
4. Create final notes with optimal tag combination
5. Ensure complete coverage of source material
</Objective>

<GraphQLSchema>
type Query {
  """
  Returns the current document to be processed into Zettelkasten notes
  """
  document: String!
}

type Mutation {
  """
  Phase 1: Suggest notes and tags, receiving similar existing tags in response
  """
  suggestNotes(
    """
    Array of proposed notes with their suggested tags
    """
    notes: [NoteInput!]!
    """
    Array of proposed tags with their descriptions
    """
    tags: [TagInput!]!
  ): SuggestNotesResult!

  """
  Phase 2: Create the final notes and any necessary new tags
  """
  createNotes(
    """
    Array of final notes with their selected tags
    """
    notes: [NoteInput!]!
    """
    Array of new tags to be created (existing tags should not be included)
    """
    tags: [TagInput!]!
  ): CreateNotesResult!
}

"""
Input type for creating a note
"""
input NoteInput {
  """
  The note content (maximum 3 sentences)
  """
  note: String!
  """
  Array of tags associated with this note
  """
  tags: [String!]!
}

"""
Input type for creating a tag
"""
input TagInput {
  """
  The tag name
  """
  tag: String!
  """
  Description of the tag (maximum 3 sentences)
  """
  description: String!
}

"""
Result type for note suggestion phase
"""
type SuggestNotesResult {
  """
  Array of existing similar tags in the system
  """
  similarTags: [Tag!]!
}

"""
Result type for note creation phase
"""
type CreateNotesResult {
  """
  Array of created notes with their IDs
  """
  notes: [Note!]!
}

"""
Tag type representing an existing tag in the system
"""
type Tag {
  """
  The tag name
  """
  tag: String!
  """
  Description of the tag
  """
  description: String!
}

"""
Note type representing a created note
"""
type Note {
  """
  Unique identifier for the note
  """
  id: ID!
}
</GraphQLSchema>

<Instructions>
**WARNING: FAILURE TO FOLLOW THE BELOW INSTRUCTIONS WILL RESULT IN INVALID RESPONSES**

1. Always plan your action step by step before executing them.
2. Generate reasoning as follows:
  - Wrap your thoughts into XML tag to let the following software parse it properly as following: <Thought>your thoughts</Thought>
  - First, reflect on the current state and previous <Observation>
  - Then list the remaining steps to accomplish the <Objective>
  - Finally, explain your next step.
3. Generate <Action> tag immediately after <Thought> as follows:
  - Wrap your action into XML tag to let the following software parse it properly as following: <Action>your action</Action>
  - Action content must be a single GraphQL operation
  - Action content must not be wrapped in any tags
  - Action content must valid against <GraphQLSchema>
4. Only use explicitly defined operations in the <GraphQLSchema>.
5. If a request:
  - Falls outside your objective scopecd
  - Cannot be fulfilled using the available operations
  - Violates any constraints
  Then explain why in your thoughts and politely decline the request.

**COMPLETE YOUR <Thought> AND <Action> IN A SINGLE MESSAGE**
</Instructions>

mutation {
  suggestNotes(
    notes: [
      { note: 'note 1 text up to 3 sentences', tags: ['tag1', 'tag2'] },
      { note: 'note 2 text up to 3 sentences', tags: ['tag2' , 'tag3'] }
    ],
    tags: [
      { tag: 'tag1', description: 'tag 1 description up to 3 sentences' }
      { tag: 'tag2', description: 'tag 2 description up to 3 sentences' }
      { tag: 'tag3', description: 'tag 3 description up to 3 sentences' }
    ]
  ) {
    similarTags
  }
}

data:
  similarTags:
    - tag: 'existing Tag 1',
      description: 'existing tag 1 description'
    - tag: 'existing Tag 2',
      description: 'existing tag 2 description'
    - tag: 'existing Tag 3',
      description: 'existing tag 3 description'

mutation {
  createNotes(
    notes: [
      { note: 'note 1 text up to 3 sentences', tags: ['existing Tag 1', 'existing Tag 2'] },
      { note: 'note 2 text up to 3 sentences', tags: ['existing Tag 2' , 'tag3'] }
    ],
    tags: [
      { tag: 'tag3', description: 'tag 3 description up to 3 sentences' }
    ]
  ) {
    notes { id }
  }
}

<Observation>
data:
  document: |
    Moderation
    ==========

    Identify potentially harmful content in text and images.

    The [moderations](/docs/api-reference/moderations) endpoint is a tool you can use to check whether text or images are potentially harmful. Once harmful content is identified, developers can take corrective action like filtering content or intervening with user accounts creating offending content. The moderation endpoint is free to use.

    The models available for this endpoint are:

    *   `omni-moderation-latest`: This model and all snapshots support more categorization options and multi-modal inputs.
    *   `text-moderation-latest` **(Legacy)**: Older model that supports only text inputs and fewer input categorizations. The newer omni-moderation models will be the best choice for new applications.

    Quickstart
    ----------

    The [moderation endpoint](/docs/api-reference/moderations) can be used to classify both text and images. Below, you can find a few examples using our [official SDKs](/docs/libraries). These examples use the `omni-moderation-latest` [model](/docs/models#moderation):

    Moderate text inputs

    Get classification information for a text input

    ```python
    from openai import OpenAI
    client = OpenAI()

    response = client.moderations.create(
        model="omni-moderation-latest",
        input="...text to classify goes here...",
    )

    print(response)
    ```

    ```javascript
    import OpenAI from "openai";
    const openai = new OpenAI();

    const moderation = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: "...text to classify goes here...",
    });

    console.log(moderation);
    ```

    ```bash
    curl https://api.openai.com/v1/moderations \
      -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -d '{
        "model": "omni-moderation-latest",
        "input": "...text to classify goes here..."
      }'
    ```

    Moderate images and text

    Get classification information for image and text input

    ```python
    from openai import OpenAI
    client = OpenAI()

    response = client.moderations.create(
        model="omni-moderation-latest",
        input=[
            {"type": "text", "text": "...text to classify goes here..."},
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://example.com/image.png",
                    # can also use base64 encoded image URLs
                    # "url": "data:image/jpeg;base64,abcdefg..."
                }
            },
        ],
    )

    print(response)
    ```

    ```javascript
    import OpenAI from "openai";
    const openai = new OpenAI();

    const moderation = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: [
            { type: "text", text: "...text to classify goes here..." },
            {
                type: "image_url",
                image_url: {
                    url: "https://example.com/image.png"
                    // can also use base64 encoded image URLs
                    // url: "data:image/jpeg;base64,abcdefg..."
                }
            }
        ],
    });

    console.log(moderation);
    ```

    ```bash
    curl https://api.openai.com/v1/moderations \
      -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -d '{
        "model": "omni-moderation-latest",
        "input": [
          { "type": "text", "text": "...text to classify goes here..." },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/image.png"
            }
          }
        ]
      }'
    ```

    Here is the full example output for an image input from a single frame of a war movie. The model correctly predicts indicators of violence in the image, with a `violence` category score of greater than 0.8.

    ```json
    {
      "id": "modr-970d409ef3bef3b70c73d8232df86e7d",
      "model": "omni-moderation-latest",
      "results": [
        {
          "flagged": true,
          "categories": {
            "sexual": false,
            "sexual/minors": false,
            "harassment": false,
            "harassment/threatening": false,
            "hate": false,
            "hate/threatening": false,
            "illicit": false,
            "illicit/violent": false,
            "self-harm": false,
            "self-harm/intent": false,
            "self-harm/instructions": false,
            "violence": true,
            "violence/graphic": false
          },
          "category_scores": {
            "sexual": 2.34135824776394e-7,
            "sexual/minors": 1.6346470245419304e-7,
            "harassment": 0.0011643905680426018,
            "harassment/threatening": 0.0022121340080906377,
            "hate": 3.1999824407395835e-7,
            "hate/threatening": 2.4923252458203563e-7,
            "illicit": 0.0005227032493135171,
            "illicit/violent": 3.682979260160596e-7,
            "self-harm": 0.0011175734280627694,
            "self-harm/intent": 0.0006264858507989037,
            "self-harm/instructions": 7.368592981140821e-8,
            "violence": 0.8599265510337075,
            "violence/graphic": 0.37701736389561064
          },
          "category_applied_input_types": {
            "sexual": [
              "image"
            ],
            "sexual/minors": [],
            "harassment": [],
            "harassment/threatening": [],
            "hate": [],
            "hate/threatening": [],
            "illicit": [],
            "illicit/violent": [],
            "self-harm": [
              "image"
            ],
            "self-harm/intent": [
              "image"
            ],
            "self-harm/instructions": [
              "image"
            ],
            "violence": [
              "image"
            ],
            "violence/graphic": [
              "image"
            ]
          }
        }
      ]
    }
    ```

    The output from the models is described below. The JSON response contains information about what (if any) categories of content are present in the inputs, and to what degree the model believes them to be present.

    ||
    |flagged|Set to true if the model classifies the content as potentially harmful, false otherwise.|
    |categories|Contains a dictionary of per-category violation flags. For each category, the value is true if the model flags the corresponding category as violated, false otherwise.|
    |category_scores|Contains a dictionary of per-category scores output by the model, denoting the model's confidence that the input violates the OpenAI's policy for the category. The value is between 0 and 1, where higher values denote higher confidence.|
    |category_applied_input_types|This property contains information on which input types were flagged in the response, for each category. For example, if the both the image and text inputs to the model are flagged for "violence/graphic", the violence/graphic property will be set to ["image", "text"]. This is only available on omni models.|

    We plan to continuously upgrade the moderation endpoint's underlying model. Therefore, custom policies that rely on `category_scores` may need recalibration over time.

    Content classifications
    -----------------------

    The table below describes the types of content that can be detected in the moderation API, along with what models and input types are supported for each category.

    ||
    |harassment|Content that expresses, incites, or promotes harassing language towards any target.|All|Text only|
    |harassment/threatening|Harassment content that also includes violence or serious harm towards any target.|All|Text only|
    |hate|Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste. Hateful content aimed at non-protected groups (e.g. chess players) is harassment.|All|Text only|
    |hate/threatening|Hateful content that also includes violence or serious harm towards the targeted group based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste.|All|Text only|
    |illicit|Content that gives advice or instruction on how to commit illicit acts. A phrase like "how to shoplift" would fit this category.|Omni only|Text only|
    |illicit/violent|The same types of content flagged by the illicit category, but also includes references to violence or procuring a weapon.|Omni only|Text only|
    |self-harm|Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders.|All|Text and image|
    |self-harm/intent|Content where the speaker expresses that they are engaging or intend to engage in acts of self-harm, such as suicide, cutting, and eating disorders.|All|Text and image|
    |self-harm/instructions|Content that encourages performing acts of self-harm, such as suicide, cutting, and eating disorders, or that gives instructions or advice on how to commit such acts.|All|Text and image|
    |sexual|Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness).|All|Text and image|
    |sexual/minors|Sexual content that includes an individual who is under 18 years old.|All|Text only|
    |violence|Content that depicts death, violence, or physical injury.|All|Text and images|
    |violence/graphic|Content that depicts death, violence, or physical injury in graphic detail.|All|Text and images|

    Was this page useful?
</Observation>

<Observation>
data:
  suggestNotes:
    similarTags: []
</Observation>