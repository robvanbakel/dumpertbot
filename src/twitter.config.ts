import dotenv from 'dotenv';

import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const { v2: twitter } = new TwitterApi({
  appKey: process.env.APPKEY,
  appSecret: process.env.APPSECRET,
  accessToken: process.env.ACCESSTOKEN,
  accessSecret: process.env.ACCESSSECRET,
});

export default twitter;
