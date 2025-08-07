export default () => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESSKEYID;
  const secretAccessKey = process.env.AWS_SECRETACCESSKEY;

  if (!region) {
    throw new Error('AWS_REGION environment variable is required');
  }
  if (!accessKeyId) {
    throw new Error('AWS_ACCESSKEYID environment variable is required');
  }
  if (!secretAccessKey) {
    throw new Error('AWS_SECRETACCESSKEY environment variable is required');
  }

  return {
    aws: {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    },
  };
};
