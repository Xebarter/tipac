/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://tipac.co.ug', // Use environment variable or default to tipac.co.ug
    generateRobotsTxt: true, // also creates a robots.txt file
    changefreq: 'daily',
    priority: 0.7,
  };