const chunk = (arr, size) => {
  const results = [];
  while (arr.length) {
    results.push(arr.splice(0, size));
  }

  return results;
};

const mergeResponses = responses =>
  responses.reduce(
    (result, { FailedRecordCount, Records }) => ({
      FailedRecordCount: result.FailedRecordCount + FailedRecordCount,
      Records: result.Records.concat(Records)
    }),
    {
      FailedRecordCount: 0,
      Records: []
    }
  );

const success = response => ({
  statusCode: 200,
  body: JSON.stringify(response),
  headers: { "Content-Type": "application/json" }
});

const fail = ({ statusCode = 500, code, message }) => ({
  statusCode,
  body: JSON.stringify({ code, message }),
  headers: { "Content-Type": "application/json" }
});

module.exports = { chunk, mergeResponses, success, fail };
