// For deploying to Vercel

import { toLambda } from "probot-serverless-now";
import app from "./index";
export default toLambda(app);
