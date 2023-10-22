import { OpenAI } from 'openai';
import { WordTokenizer } from 'natural';
import dontenv from 'dotenv';
import { tensor } from '@tensorflow/tfjs';
import { similarity } from 'ml-distance';

dontenv.config();

const text = `List data objects
DO YOU WANT TO LIST ALL OBJECTS FROM WEAVIATE?
Use the after operator.

List data objects in reverse order of creation. The data will be returned as an array of objects.

AFTER A CLASS OBJECT COUNT?
A: This Aggregate query will output a total object count in a class.

Python
JavaScript/TypeScript
Go
Java
Curl
GraphQL
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'https',
  host: 'some-endpoint.weaviate.network',
});

const response = await client.graphql
  .aggregate()
  .withClassName(<ClassName>)
  .withFields('meta { count }')
  .do();
console.log(JSON.stringify(response, null, 2));

Method and URL
Without any restrictions (across classes, default limit = 25):

GET /v1/objects

With optional query params:

GET /v1/objects?class={ClassName}&limit={limit}&include={include}

Parameters
ALL PARAMETERS BELOW ARE OPTIONAL URL QUERY PARAMETERS
Name	Type	Description
class	string	List objects by class using the class name.
limit	integer	The maximum number of data objects to return. Default 25.
offset	integer	The offset of objects returned (the starting index of the returned objects).

Cannot be used with after.
Should be used in conjunction with limit.
after	string	ID of the object after which (i.e. non-inclusive ID) objects are to be listed.

Must be used with class
Cannot be used with offset or sort.
Should be used in conjunction with limit.
include	string	Include additional information, such as classification info.

Allowed values include: classification, vector, featureProjection and other module-specific additional properties.
sort	string	Name of the property to sort by - i.e. sort=city

You can also provide multiple names – i.e. sort=country,city
order	string	Order in which to sort by.

Possible values: asc (default) and desc.
Should be used in conjunction with sort.
Paging: offset
TIP
You can use limit and offset for paging results.

The offset parameter is a flexible way to page results as it allows use with parameters such as sort. It is limited by the value of QUERY_MAXIMUM_RESULTS which sets the maximum total number of objects that can be listed using this parameter.

Get the first 10 objects:

GET /v1/objects?class=MyClass&limit=10

Get the second batch of 10 objects:

GET /v1/objects?class=MyClass&limit=10&offset=10

Get the next batch of 10 objects:

GET /v1/objects?class=MyClass&limit=10&offset=20

Exhaustive listing using a cursor: after
TIP
Available from version v1.18.0.
You can use class, limit and after for listing an entire object set from a class.
The after operator is based on the order of ids. It can therefore only be applied to list queries without sorting.
You can use the after operator to retrieve all objects from a Weaviate instance . The after operator ("Cursor API") retrieves objects of a class based on the order of ids. You can pass the id of the last retrieved object as a cursor to start the next page.

It is not possible to use the after operator without specifying a class.

For a null value similar to offset=0, set after= or after (i.e. with an empty string) in the request.

Examples
Get the first 10 objects of MyClass:

GET /v1/objects?class=MyClass&limit=10

If the last object in the retrieved set above was b1645a32-0c22-5814-8f35-58f142eadf7e, you can retrieve the next 10 objects of MyClass after it as below:

GET /v1/objects?class=MyClass&limit=10&after=b1645a32-0c22-5814-8f35-58f142eadf7e

Example sorting
TIP
You can use sort and order to sort your results.

Ascending sort by author_name:

GET /v1/objects?class=Book&sort=author_name

Descending sort by author_name:

GET /v1/objects?class=Book&sort=author_name&order=desc

Sort by by author_name, and then title.

GET /v1/objects?class=Book&sort=author_name,title

Sort by author_name, and then title with order:

GET /v1/objects?class=Book&sort=author_name,title&order=desc,asc

Response fields
The response of a GET query of a data object will give you information about all objects (or a single object). Next to general information about the data objects, like schema information and property values, meta information will be shown depending on the include fields or additional properties of your request.
REST - /v1/batch
LICENSE Weaviate issues on GitHub badge Weaviate version badge Weaviate total Docker pulls badge

Batch create objects
For sending data objects to Weaviate in bulk.

MULTI-TENANCY
The batch endpoint supports classes where multi-tenancy is enabled. For example, batch creation of objects works similarly to single object creation, by passing the tenant parameter in the object body.

Performance
TIP
Import speeds, especially for large datasets, will drastically improve when using the batching endpoint.

A few points to bear in mind:

If you use a vectorizer that improves with GPU support, make sure to enable it if possible, as it will drastically improve import.
Avoid duplicate vectors for multiple data objects.
Handle your errors. If you ignore them, it might lead to significant delays on import.
If your import slows down after a particular number of objects (e.g. 2M), check to see if the vectorCacheMaxObjects in your schema is larger than the number of objects. Also, see this example.
There are ways to improve your setup when using vectorizers, as we've shown in the Wikipedia demo dataset. Subscribe to our Announcements category on the forum to keep up-to-date as we publish more on this topic.
Method and URL
POST /v1/batch/objects[?consistency_level=ONE|QUORUM|ALL]

Parameters
The URL supports an optional consistency level query parameter:

Name	Location	Type	Description
consistency_level	query param	string	Optional consistency level: ONE, QUORUM (default) or ALL.
The POST body requires the following field:

Name	Type	Required	Description
objects	array of data objects	yes	Array of objects
Example request
CAUTION
In the beacon format, you need to always use localhost as the host, rather than the actual hostname. localhost refers to the fact that the beacon's target is on the same Weaviate instance, as opposed to a foreign instance.

Python
JavaScript/TypeScript
Go
Java
Curl
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

const toImport = [{
  class: 'Author',
  id: '36ddd591-2dee-4e7e-a3cc-eb86d30a4303',
  properties: {
    name: 'Jane Doe',
    writesFor: [{
      beacon: 'weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80',
    }],
  },
},
{
  class: 'Author',
  id: '36ddd591-2dee-4e7e-a3cc-eb86d30a4304',
  properties: {
    name: 'John Doe',
    writesFor: [{
      beacon: 'weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80',
    }],
  },
}];

const response = await client.batch
  .objectsBatcher()
  .withObject(toImport[0])
  .withObject(toImport[1])
  .withConsistencyLevel('ALL')  // default QUORUM
  .do();
console.log(JSON.stringify(response, null, 2));

/* The following is also possible:
const toImport = [
  client.data
    .creator()
    .withClassName('Author')
    .withId('36ddd591-2dee-4e7e-a3cc-eb86d30a4303')
    .withProperties({
      name: 'Jane Doe',
      writesFor: [{
        beacon: 'weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80',
      }],
    })
    .payload(), // note the .payload(), not .do()!
  client.data
    .creator()
    .withClassName('Author')
    .withId('36ddd591-2dee-4e7e-a3cc-eb86d30a4304')
    .withProperties({
      name: 'John Doe',
      writesFor: [{
        beacon: 'weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80',
      }],
    })
    .payload(), // note the .payload(), not .do()!
  ];

const response = await client.batch
  .objectsBatcher()
  .withObject(toImport[0])
  .withObject(toImport[1])
  .withConsistencyLevel('ALL')  // default QUORUM
  .do();
console.log(JSON.stringify(response, null, 2));
*/

Batch create objects with the Python Client
Specific documentation for the Python client can be found at weaviate-python-client.readthedocs.io. Learn more about different types of batching and tip&tricks on the Weaviate Python client page.

Batch create references
For batch adding cross-references between data objects in bulk.

Method and URL
POST /v1/batch/references

Parameters
The URL supports an optional consistency level query parameter:

Name	Location	Type	Description
consistency_level	query param	string	Optional consistency level: ONE, QUORUM (default) or ALL.
The POST body is an array of elements with the following fields:

Name	Type	Required	Description
from	Weaviate Beacon (long-form)	yes	The beacon, with the cross-reference property name at the end: weaviate://localhost/{ClassName}/{id}/{crefPropertyName}
to	Weaviate Beacon (regular)	yes	The beacon, formatted as weaviate://localhost/{ClassName}/{id}
CAUTION
In the beacon format, you need to always use localhost as the host, rather than the actual hostname. localhost refers to the fact that the beacon's target is on the same Weaviate instance, as opposed to a foreign instance.

NOTE
For backward compatibility, you can omit the class name in the short-form beacon format that is used for to. You can specify it as weaviate://localhost/{id}. This is, however, considered deprecated and will be removed with a future release, as duplicate IDs across classes could mean that this beacon is not uniquely identifiable. For the long-form beacon - used as part of from - you always need to specify the full beacon, including the reference property name.

Example request
Python
JavaScript/TypeScript
Go
Java
Curl
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

const response = await client.batch
  .referencesBatcher()
  .withReference({
    from: 'weaviate://localhost/Author/36ddd591-2dee-4e7e-a3cc-eb86d30a4303/wroteArticles',
    to: 'weaviate://localhost/Article/6bb06a43-e7f0-393e-9ecf-3c0f4e129064',
    // prior to v1.14 omit the class name as part of the 'to' beacon and specify it as weaviate://localhost/<id>
  })
  .withReference({
    from: 'weaviate://localhost/Author/36ddd591-2dee-4e7e-a3cc-eb86d30a4303/wroteArticles',
    to: 'weaviate://localhost/Article/b72912b9-e5d7-304e-a654-66dc63c55b32',
    // prior to v1.14 omit the class name as part of the 'to' beacon and specify it as weaviate://localhost/<id>
  })
  .withReference({
    from: 'weaviate://localhost/Author/36ddd591-2dee-4e7e-a3cc-eb86d30a4304/wroteArticles',
    to: 'weaviate://localhost/Article/b72912b9-e5d7-304e-a654-66dc63c55b32',
    // prior to v1.14 omit the class name as part of the 'to' beacon and specify it as weaviate://localhost/<id>
  })
  .withConsistencyLevel('ALL')  // default QUORUM
  .do();
console.log(JSON.stringify(response, null, 2));

/* This is also possible with a builder pattern:
const response = await client.batch
  .referencesBatcher()
  .withReference(
    client.batch
      .referencePayloadBuilder()
      .withFromClassName('Author')
      .withFromRefProp('wroteArticles')
      .withFromId('36ddd591-2dee-4e7e-a3cc-eb86d30a4303')
      .withToClassName('Article') // prior to v1.14 omit .withToClassName()
      .withToId('6bb06a43-e7f0-393e-9ecf-3c0f4e129064')
      .payload()
  )
  .withReference(
    client.batch
      .referencePayloadBuilder()
      .withFromClassName('Author')
      .withFromRefProp('wroteArticles')
      .withFromId('36ddd591-2dee-4e7e-a3cc-eb86d30a4303')
      .withToClassName('Article') // prior to v1.14 omit .withToClassName()
      .withToId('b72912b9-e5d7-304e-a654-66dc63c55b32')
      .payload()
  )
  .withReference(
    client.batch
      .referencePayloadBuilder()
      .withFromClassName('Author')
      .withFromRefProp('wroteArticles')
      .withFromId('36ddd591-2dee-4e7e-a3cc-eb86d30a4304')
      .withToClassName('Article') // prior to v1.14 omit .withToClassName()
      .withToId('b72912b9-e5d7-304e-a654-66dc63c55b32')
      .payload()
  )
  .withConsistencyLevel('ALL')  // default QUORUM
  .do();
console.log(JSON.stringify(response, null, 2));
*/

For detailed information and instructions of batching in Python, see the weaviate.batch.Batch documentation.

Batch delete
You can use the HTTP verb DELETE on the /v1/batch/objects endpoint to delete all objects that match a particular expression. To determine if an object is a match, a where-Filter is used. The request body takes a single filter, but will delete all objects matched. It returns the number of matched objects as well as any potential errors. Note that there is a limit to how many objects can be deleted at once using this filter, which is explained below.

Maximum number of deletes per query
There is an upper limit to how many objects can be deleted using a single query. This protects against unexpected memory surges and very-long-running requests which would be prone to client-side timeouts or network interruptions. If a filter matches many objects, only the first n elements are deleted. You can configure n by setting QUERY_MAXIMUM_RESULTS in Weaviate's config. The default value is 10,000. Objects are deleted in the same order that they would be returned in using the same filter in a Get query. To delete more objects than the limit, run the same query multiple times, until no objects are matched anymore.

Dry-run before deletion
You can use the dry-run option to see which objects would be deleted using your specified filter, without deleting any objects yet. Depending on the configured verbosity, you will either receive the total count of affected objects, or a list of the affected IDs.

Method and URL
DELETE /v1/batch/objects[?consistency_level=ONE|QUORUM|ALL]

Parameters
The URL supports an optional consistency level query parameter:

Name	Location	Type	Description
consistency_level	query param	string	Optional consistency level: ONE, QUORUM (default) or ALL.
The body requires the following fields:

Name	Type	Required	Description
match	object	yes	Object outlining how to find the objects to be deleted (see example below)
output	string	no	Optional verbosity level, minimal (default) or verbose
dryRun	bool	no	If true, objects will not be deleted yet, but merely listed. Defaults to false.
A request body in detail
{
  "match": {
    "class": "<ClassName>",  # required
    "where": { /* where filter object */ },  # required
  },
  "output": "<output verbosity>",  # Optional, one of "minimal" or "verbose". Defaults to "minimal".
  "dryRun": <bool>  # Optional. If true, objects will not be deleted yet, but merely listed. Defaults to "false".
}

Possible values for output:

Value	Effect
minimal	The result only includes counts. Information about objects is omitted if the deletes were successful. Only if an error occurred, will the object be described.
verbose	The result lists all affected objects with their ID and deletion status, including both successful and unsuccessful deletes.
A response body in detail
{
  "match": {
    "class": "<ClassName>",        # matches the request
    "where": { /* where filter object */ },  # matches the request
  },
  "output": "<output verbosity>",  # matches the request
  "dryRun": <bool>,
  "results": {
    "matches": "<int>",            # how many objects were matched by the filter
    "limit": "<int>",              # the most amount of objects that can be deleted in a single query, matches QUERY_MAXIMUM_RESULTS
    "successful": "<int>",         # how many objects were successfully deleted in this round
    "failed": "<int>",             # how many objects should have been deleted but could not be deleted
    "objects": [{                  # one JSON object per weaviate object
      "id": "<id>",                # this successfully deleted object would be omitted with output=minimal
      "status": "SUCCESS",         # possible status values are: "SUCCESS", "FAILED", "DRYRUN"
      "error": null
    }, {
      "id": "<id>",                # this error object will always be listed, even with output=minimal
      "status": "FAILED",
      "errors": {
         "error": [{
             "message": "<error-string>"
         }]
      }
    }]
  }
}

Example request
Python
JavaScript/TypeScript
Go
Java
Curl
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

const response = await client.batch
  .objectsBatchDeleter()
  .withClassName('Article')
  .withOutput('verbose')
  .withDryRun(false)
  .withWhere({
    operator: 'GreaterThan',
    path: ['_creationTimeUnix'],
    valueText: '1651514874263',
  })
  .withConsistencyLevel('ALL')  // default QUORUM
  .do();

console.log(JSON.stringify(response, null, 2));

Error handling
When sending a batch request to your Weaviate instance, it could be the case that an error occurs. This can be caused by several reasons, for example that the connection to Weaviate is lost or that there is a mistake in a single data object that you are trying to add.

You can check if an error occurred, and of what kind.

A batch request will always return an HTTP 200 status code when the batch request was successful. That means that the batch was successfully sent to Weaviate, and there were no issues with the connection or processing of the batch, and the request was not malformed (4xx status code). However, with a 200 status code, there might still be individual failures of the data objects which are not contained in the response. Thus, a 200 status code does not guarantee that each batch item has been added/created. An example of an error on an individual data object that might be unnoticed by sending a batch request without checking the individual results is this: adding an object to the batch that is in conflict with the schema (for example a non-existing class name).

The following Python code can be used to handle errors on individual data objects in the batch.

import weaviate

client = weaviate.Client("http://localhost:8080")


def check_batch_result(results: dict):
  """
  Check batch results for errors.

  Parameters
  ----------
  results : dict
      The Weaviate batch creation return value, i.e. returned value of the client.batch.create_objects().
  """

  if results is not None:
    for result in results:
      if 'result' in result and 'errors' in result['result']:
        if 'error' in result['result']['errors']:
          print(result['result']['errors']['error'])

object_to_add = {
    "name": "Jane Doe",
    "writesFor": [{
        "beacon": "weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80"
    }]
}

with client.batch(batch_size=100, callback=check_batch_result) as batch:
  batch.add_data_object(object_to_add, "Author", "36ddd591-2dee-4e7e-a3cc-eb86d30a4303")

This can also be applied to adding references in batch. Note that sending batches, especially references, skips some validations at the object and reference level. Adding this validation on single data objects like above makes it less likely for errors to go undiscovered.

More resources
For additional information, try these sources.

Frequently Asked Questions
Weaviate Community Forum
Knowledge base of old issues
Stackoverflow
Weaviate slack channel`


const client = new OpenAI()

function slidingWindow(arr: string[], windowSize: number, overlap: number) {
  const output = [];

  for (let i = 0; i < arr.length - windowSize + 1; i += (windowSize - overlap)) {
    output.push(arr.slice(i, i + windowSize));
  }

  return output;
}

async function main() {
  // Split long test to 512 word long chunks
  const words = new WordTokenizer().tokenize(text)!;
  const slices = slidingWindow(words, 512, 0); // Looks like overlap does not help

  const { data } = await client.embeddings.create({
    model: 'text-embedding-ada-002',
    input: [
      text,
      ...(slices.map(w => w.join(' ')))
    ]
  });

  const [{ embedding }, ...embeddings] = data;

  // calculate weighted centroid for slices
  const weights = tensor(slices.map(t => t.length));
  const centroid = tensor(embeddings.map(({ embedding }) => embedding))
    .mul(weights.reshape([-1, 1]))
    .div(weights.sum())
    .mean(0)
    .arraySync();

  // Lets find similarity of weighted centroid and whole text embedding
  console.log(similarity.cosine(embedding, centroid));
}

main();