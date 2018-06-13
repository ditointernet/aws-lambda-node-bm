const { Kinesis } = require("aws-sdk");
const uuid = require("uuid/v4");

const { chunk, mergeResponses, success, fail } = require("./utils");

const kinesis = new Kinesis();

const STREAM_NAME = "lambda-bm";
const CHUNK_SIZE = 500;

const track = body =>
  Promise.resolve(body)
    .then(body => ({ ...JSON.parse(body), receivedAt: new Date() }))
    .then(tracking =>
      kinesis
        .putRecord({
          Data: JSON.stringify(tracking),
          PartitionKey: uuid(),
          StreamName: STREAM_NAME
        })
        .promise()
    )
    .then(response => success(response))
    .catch(err => fail(err));

const bulk = body =>
  Promise.resolve(body)
    .then(body => ({ ...JSON.parse(body), receivedAt: new Date() }))
    .then(({ Records, receivedAt }) =>
      Records.map(record => ({
        Data: JSON.stringify({ ...record, receivedAt }),
        PartitionKey: uuid()
      }))
    )
    .then(records => chunk(records, CHUNK_SIZE))
    .then(chunks =>
      chunks.map(Records =>
        kinesis.putRecords({ Records, StreamName: STREAM_NAME }).promise()
      )
    )
    .then(promises => Promise.all(promises))
    .then(responses => mergeResponses(responses))
    .then(response => success(response))
    .catch(err => fail(err));

const router = {
  "/track": track,
  "/track/bulk": bulk
};

const handler = ({ path, body }) => router[path](body);

module.exports = { handler };
