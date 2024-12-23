import { driver, auth } from 'neo4j-driver';
import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from 'dotenv';

config();

interface RankedTag {
  tag: string;
  description: string;
  rank: number;
}

interface RankedNote {
  content: string;
  tags: string[];
  rank: number;
}

export async function graphSearch(query: string) {
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    dimensions: 512,
  });

  const conn = driver(
    process.env.NEO4J_URI!,
    auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  );

  const session = conn.session();

  try {
    // 1. Generate embedding for the query
    console.log('Generating query embedding...');
    const queryEmbedding = await embeddings.embedQuery(query);

    // 2. Find similar tags and notes using vector search
    console.log('Finding similar tags and notes...');

    const tagResults = await session.run(
      /* cypher */`
      CALL db.index.vector.queryNodes('tags', 5, $queryVector) YIELD node, score
      RETURN node.name as tag, node.description as description, score
      `,
      { queryVector: queryEmbedding }
    );
    const noteResults = await session.run(
      /* cypher */`
      CALL db.index.vector.queryNodes('notes', 5, $queryVector) YIELD node, score
      RETURN node.content as content, score,
            [(node)-[:TAGGED_WITH]->(t) | t.name] as tags
      `,
      { queryVector: queryEmbedding }
    );

    // 3. Find related tags through common notes
    const topNoteTags = noteResults.records.flatMap(record => record.get('tags'));
    const topTags = tagResults.records.map(record => record.get('tag'));
    const allRelevantTags = [...new Set([...topTags, ...topNoteTags])];

    // Calculate connection counts for ranking
    const rankingsResult = await session.run(
      /* cypher */`
      MATCH (t:Tag)
      WHERE t.name IN $relevantTags
      OPTIONAL MATCH (t)<-[:TAGGED_WITH]-(n:Note)-[:TAGGED_WITH]->(other:Tag)
      WHERE other.name IN $relevantTags
      WITH t.name as tag, t.description as description,
           COUNT(DISTINCT n) as connections
      RETURN
        tag,
        description,
        connections
      `,
      { relevantTags: allRelevantTags }
    );

    // Combine and rank the tags
    const rankedTags: RankedTag[] = rankingsResult.records.map(record => {
      const connections = record.get('connections').toNumber();
      // Add 1 to connections to account for self-connection and avoid division by zero
      const rank = 1 / (connections + 1);

      return {
        tag: record.get('tag'),
        description: record.get('description'),
        rank
      };
    }).sort((a, b) => a.rank - b.rank);;

    console.log(rankedTags);

      // Get all notes and passages
   const results = await session.run(
      /* cypher */`
      // Start with our ranked tags
      WITH $tagNames as tagNames
      MATCH (t:Tag)
      WHERE t.name IN tagNames
      // Find connected notes and their source passages
      MATCH (n:Note)-[:TAGGED_WITH]->(t)
      MATCH (n)-[:EXTRACTED_FROM]->(p:Passage)-[:PART_OF]->(d:Document)
      // Collect all tags for each note
      WITH
        n,
        n.content as noteContent,
        p,
        p.content as passageContent,
        d.name as documentName,
        p.lineStart as lineStart,
        p.lineEnd as lineEnd,
        collect(DISTINCT t.name) as tags
      // Return both individual notes and notes grouped by passage
      RETURN
        noteContent,
        passageContent,
        documentName,
        lineStart,
        lineEnd,
        tags,
        p.content as passageKey // Used for grouping
      `,
      {
        tagNames: rankedTags.map(t => t.tag)
      }
    );
    // Calculate ranked notes (preserved for debugging)
    const rankedNotes = results.records
      .map(record => {
        const content = record.get('noteContent');
        const noteTags = record.get('tags') as string[];
        // Calculate sum of inverse tag ranks
        const tagRankSum = noteTags.reduce((sum, tagName) => {
          const tagRank = rankedTags.find(t => t.tag === tagName)?.rank ?? 1;
          return sum + (1 / (tagRank + 1));
        }, 0);
        const rank = 1 / tagRankSum;

        return {
          content,
          tags: noteTags,
          rank,
          passage: {
            content: record.get('passageContent'),
            documentName: record.get('documentName'),
            lineStart: record.get('lineStart'),
            lineEnd: record.get('lineEnd'),
          }
        };
      })
      .sort((a, b) => a.rank - b.rank);

    console.log('Ranked Notes:', rankedNotes);

    // Group by passage and calculate passage ranks
    const passageMap = new Map();

    results.records.forEach(record => {
      const passageKey = record.get('passageKey');
      if (!passageMap.has(passageKey)) {
        passageMap.set(passageKey, {
          content: record.get('passageContent'),
          documentName: record.get('documentName'),
          lineStart: record.get('lineStart'),
          lineEnd: record.get('lineEnd'),
          notes: []
        });
      }

      const noteRank = 1 / record.get('tags').reduce((sum: number, tagName: string) => {
        const tagRank = rankedTags.find(t => t.tag === tagName)?.rank ?? 1;
        return sum + (1 / (tagRank + 1));
      }, 0);

      passageMap.get(passageKey).notes.push({
        content: record.get('noteContent'),
        tags: record.get('tags'),
        rank: noteRank
      });
    });

    const rankedPassages = Array.from(passageMap.values())
      .map(passage => ({
        ...passage,
        rank: passage.notes.reduce((product, note) => product * note.rank, 1)
      }))
      .sort((a, b) => a.rank - b.rank);

    console.log('Ranked Passages:\n', JSON.stringify(rankedPassages.slice(0, 3), null, 2));
  } finally {
    await session.close();
    await conn.close();
  }
}

graphSearch('how to create chat completion in python');

// ... imports and config remain the same ...
export async function simplePassageSearch(query: string) {
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    dimensions: 512,
  });
    const conn = driver(
    process.env.NEO4J_URI!,
    auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  );
    const session = conn.session();
    try {
    // 1. Generate embedding for the query
    console.log('Generating query embedding...');
    const queryEmbedding = await embeddings.embedQuery(query);
      // 2. Find similar passages using vector search
    console.log('Finding similar passages...');
    const results = await session.run(
      /* cypher */`
      CALL db.index.vector.queryNodes('passages', 5, $queryVector) YIELD node, score
      RETURN
        node.content as content,
        node.lineStart as lineStart,
        node.lineEnd as lineEnd,
        [(node)-[:PART_OF]->(d:Document) | d.name][0] as documentName,
        score
      ORDER BY score DESC
      `,
      { queryVector: queryEmbedding }
    );
      const passages = results.records.map(record => ({
      content: record.get('content'),
      documentName: record.get('documentName'),
      lineStart: record.get('lineStart'),
      lineEnd: record.get('lineEnd'),
      score: record.get('score')
    }));
      console.log('Similar Passages:', JSON.stringify(passages, null, 2));
    return passages;
    } finally {
    await session.close();
    await conn.close();
  }
}

// simplePassageSearch('how to create chat completion in python');