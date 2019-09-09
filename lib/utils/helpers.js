export function enrichApiError(error) {
  const { body: { reason = '' } = {} } = error;
  if (error.output && reason) { // the error is from SG Elasticsearch plugin
    error.output.payload.message = reason;
  }
  return error;
}
