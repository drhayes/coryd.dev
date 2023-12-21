import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight'
import tablerIcons from 'eleventy-plugin-tabler-icons'
import pluginUnfurl from 'eleventy-plugin-unfurl'
import pluginRss from '@11ty/eleventy-plugin-rss'
import embedYouTube from 'eleventy-plugin-youtube-embed'
import postGraph from '@rknightuk/eleventy-plugin-post-graph'

import markdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItFootnote from 'markdown-it-footnote'
import htmlmin from 'html-minifier-terser'

import filters from './config/filters/index.js'
import { slugifyString } from './config/utils/index.js'
import { svgToJpeg } from './config/events/index.js'
import { tagList, tagMap, postStats } from './config/collections/index.js'
import { img } from './config/shortcodes/index.js'

import CleanCSS from 'clean-css'
import { execSync } from 'child_process'

// load .env
import dotenvFlow from 'dotenv-flow'
dotenvFlow.config()

/**
 *  @param {import("@11ty/eleventy/src/UserConfig")} eleventyConfig
 */
export default async function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight)
  eleventyConfig.addPlugin(tablerIcons)
  eleventyConfig.addPlugin(pluginUnfurl)
  eleventyConfig.addPlugin(embedYouTube, {
    modestBranding: true,
    lite: {
      'lite.css.path': 'src/assets/styles/yt-lite.css',
      'lite.js.path': 'src/assets/scripts/yt-lite.js',
    },
  })
  eleventyConfig.addPlugin(postGraph, {
    boxColorLight: '#e5e7eb',
    highlightColorLight: '#2563eb',
    textColorLight: '#1f2937',

    boxColorDark: '#374151',
    highlightColorDark: '#60a5fa',
    textColorDark: '#fff',
  })

  // quiet build output
  eleventyConfig.setQuietMode(true)
  eleventyConfig.setLiquidOptions({
    jsTruthy: true,
  })

  // tailwind watches
  eleventyConfig.addWatchTarget('./tailwind.config.js')
  eleventyConfig.addWatchTarget('./tailwind.css')

  // passthrough
  eleventyConfig.addPassthroughCopy('src/assets')
  eleventyConfig.addPassthroughCopy('_redirects')

  // enable merging of tags
  eleventyConfig.setDataDeepMerge(true)

  // create excerpts
  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: true,
    excerpt_alias: 'post_excerpt',
    excerpt_separator: '<!-- excerpt -->',
  })

  // collections
  eleventyConfig.addCollection('tagList', tagList)
  eleventyConfig.addCollection('tagMap', tagMap)
  eleventyConfig.addCollection('postStats', postStats)

  const md = markdownIt({ html: true, linkify: true })
  md.use(markdownItAnchor, {
    level: [1, 2],
    permalink: markdownItAnchor.permalink.headerLink({
      safariReaderFix: true,
      class: 'header-anchor',
    }),
  })
  md.use(markdownItFootnote)
  eleventyConfig.setLibrary('md', md)

  // filters
  eleventyConfig.addLiquidFilter('markdown', (content) => {
    if (!content) return
    return md.render(content)
  })
  Object.keys(filters).forEach((filterName) => {
    eleventyConfig.addLiquidFilter(filterName, filters[filterName])
  })
  eleventyConfig.addLiquidFilter('dateToRfc822', pluginRss.dateToRfc822)
  eleventyConfig.addLiquidFilter('absoluteUrl', pluginRss.absoluteUrl)
  eleventyConfig.addFilter('cssmin', (code) => new CleanCSS({}).minify(code).styles)
  eleventyConfig.addFilter('slugify', slugifyString)

  // shortcodes
  eleventyConfig.addShortcode('image', img)
  eleventyConfig.addShortcode('assetHash', () => Math.random())

  // transforms
  eleventyConfig.addTransform('html-minify', (content, path) => {
    if (path && path.endsWith('.html')) {
      return htmlmin.minify(content, {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        includeAutoGeneratedTags: false,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
      })
    }
    return content
  })

  // events
  eleventyConfig.on('afterBuild', svgToJpeg)
  eleventyConfig.on('eleventy.after', () => {
    execSync(`npx pagefind --site _site --glob "**/*.html"`, { encoding: 'utf-8' })
  })

  return {
    passthroughFileCopy: true,
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
  }
}
