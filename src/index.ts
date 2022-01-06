require('dotenv').config()
const axios = require('axios')
const htmlparser2 = require('htmlparser2')
const schedule = require('node-schedule')

import twitter from './twitter.config'

type Post = {
  title: string
  link: string
  pubDate: Date
}

// Define constants
const FEED_URL = 'https://api-live.dumpert.nl/mobile_api/json/rss'
const MINUTES_INTERVAL = 5

// When starting server, set last pubDate to current time
let lastPubDate = new Date()

// Function to create formatted timestamp
const timestamp = (timestamp: Date = new Date()) => {
  return timestamp.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Get 50 most recent posts from RSS feed
const getFeed = async (url: string) => {
  const res = await axios.get(url)
  const feed = htmlparser2.parseFeed(res.data)

  return feed.items
}

// Filter out posts created after stored last pubDate, update stored last pubDate
const getNewPosts = async (feed: Post[]) => {
  const newPosts = feed.filter((post) => post.pubDate > lastPubDate)

  lastPubDate = feed[0].pubDate

  return newPosts
}

// Tweet new posts in reverse order (old to new)
const tweetPosts = async (posts: Post[]) => {
  for (const post of posts.reverse()) {
    await twitter.tweet(`${post.title} ${post.link}`)
    console.log(`${timestamp()}: Tweeted: ${post.title}`)
  }
}

// Main function call
const main = async () => {
  const feed = await getFeed(FEED_URL)
  const newPosts = await getNewPosts(feed)

  if (newPosts.length) {
    tweetPosts(newPosts)
  } else {
    console.log(`${timestamp()}: No new posts found`)
  }
}

// Cron job to run main function every 5 minutes
schedule.scheduleJob(`*/${MINUTES_INTERVAL} * * * *`, main)
