const serverless = require('serverless-http');
const app = require('../../server/server');
const { connectDB } = require('../../server/config/db');

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  // Keep MongoDB connection warm across Netlify Function invocations without hanging event loop
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  return serverlessHandler(event, context);
};
