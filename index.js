require('dotenv').config()
const axios = require('axios')
const htmlparser2 = require('htmlparser2')
const schedule = require('node-schedule')
const twitter = require('./twitter.config')

const FEED_URL = 'https://api-live.dumpert.nl/mobile_api/json/rss'
const MINUTES_INTERVAL = 5

let lastPubDate = new Date()

const getFeed = async (url) => {
  const res = await axios.get(url)
  const feed = htmlparser2.parseFeed(res.data)

  return feed.items
}

const getNewPosts = async (feed) => {
  const newPosts = feed.filter((post) => post.pubDate > lastPubDate)

  lastPubDate = feed[0].pubDate

  return newPosts
}

const tweetPosts = async (posts) => {
  for (const post of posts.reverse()) {
    await twitter.tweet(`${post.title} ${post.link}`)
    console.log(`${new Date().toLocaleString('nl-NL')}: Tweeted: ${post.title}`)
  }
}

const main = async () => {
  const feed = await getFeed(FEED_URL)
  const newPosts = await getNewPosts(feed)

  if (newPosts.length) {
    tweetPosts(newPosts)
  } else {
    console.log(`${new Date().toLocaleString('nl-NL')}: No new posts found`)
  }
}

schedule.scheduleJob(`*/${MINUTES_INTERVAL} * * * *`, main)
