import axios from 'axios';
import schedule from 'node-schedule';
import { decode } from 'html-entities';
import * as htmlparser2 from 'htmlparser2';

import twitter from './twitter.config';

interface Post {
  title: string
  link: string
  pubDate: Date
}

// Define constants
const FEED_URL = 'https://api-live.dumpert.nl/mobile_api/json/rss';
const TWITTER_ID = '1295086337280876544';
const MINUTES_INTERVAL = 5;

let lastPubDate: Date;

// Function to create formatted timestamp
const getTimestamp = (timestamp: Date = new Date()) => timestamp.toLocaleString('nl-NL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Get 50 most recent posts from RSS feed
const getFeed = async (url: string): Promise<Post[]> => {
  const res = await axios.get(url);
  const feed = htmlparser2.parseFeed(res.data);

  return feed?.items as Post[];
};

// Get last tweeted ID
const getLastTweetedLink = async (): Promise<string> => {
  const lastTweet = await twitter.userTimeline(TWITTER_ID);
  // eslint-disable-next-line no-underscore-dangle
  const shortUrl = lastTweet._realData.data[0].text.split(' ').pop();

  let fullUrl: string;

  try {
    const axiosResponse = await axios.get(shortUrl);
    fullUrl = axiosResponse.request.res.responseUrl;
  } catch (error: any) {
    fullUrl = error.request.res.responseUrl;
  }

  return fullUrl;
};

// Filter out posts created after stored last pubDate, update stored last pubDate
const getNewPosts = (feed: Post[]) => {
  const newPosts = feed.filter((post) => post.pubDate > lastPubDate);

  lastPubDate = feed[0].pubDate;

  return newPosts;
};

const tweetPosts = async (posts: Post[]): Promise<void> => {
  // eslint-disable-next-line no-restricted-syntax
  for (const post of posts.reverse()) {
    // eslint-disable-next-line no-await-in-loop
    await twitter.tweet(`${decode(post.title)} ${post.link}`);

    console.log(`${getTimestamp()}: Tweeted: ${post.title}`);
  }
};

// Main function call
const main = async (): Promise<void> => {
  const feed = await getFeed(FEED_URL);

  // If lastPubDate is not set, find pubDate of last tweeted post
  if (!lastPubDate) {
    const lastTweetedLink = await getLastTweetedLink();

    feed.forEach((item: Post) => {
      if (item.link === lastTweetedLink) {
        console.log(`Last tweeted item: ${getTimestamp(item.pubDate)}: ${item.title}`);
        lastPubDate = item.pubDate;
      }
    });

    // If last tweeted post was not found, set lastPubDate to pubDate of last post
    if (!lastPubDate) {
      lastPubDate = feed[0].pubDate;
      console.log(`Last tweeted item not found, starting at ${getTimestamp(lastPubDate)}`);
    }
  }

  const newPosts = getNewPosts(feed);

  if (newPosts.length) {
    tweetPosts(newPosts);
  } else {
    console.log(`${getTimestamp()}: No new posts found`);
  }
};

// Cron job to run main function every 5 minutes
schedule.scheduleJob(`*/${MINUTES_INTERVAL} * * * *`, main);
