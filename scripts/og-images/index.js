import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import matter from 'gray-matter'
import slugify from 'slugify'
import { Liquid } from 'liquidjs'
import { DateTime } from 'luxon'
import { fileURLToPath } from 'url'

const FILE_NAME = fileURLToPath(import.meta.url)
const DIR_NAME = path.dirname(FILE_NAME)

const baseDir = path.join(DIR_NAME, '../../src/posts')
const outputDir = path.join(DIR_NAME, '../../src/assets/img/ogi/')
const engine = new Liquid({ extname: '.liquid' })

engine.registerFilter('date', (isoDateString, formatString = 'MMMM d, yyyy') => {
  const date = DateTime.fromISO(isoDateString)
  return date.isValid ? date.toFormat(formatString) : isoDateString
})

engine.registerFilter('splitLines', (input, maxCharLength) => {
  return input.split(' ').reduce((acc, cur) => {
    if (!acc.length || acc[acc.length - 1].length + cur.length + 1 > maxCharLength) {
      acc.push(cur)
    } else {
      acc[acc.length - 1] += ' ' + cur
    }
    return acc
  }, [])
})

engine.registerFilter('slugify', (input) => slugify(input, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }))

const svgToPNG = async (filePath) => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8')
    const { data } = matter(fileContent)
    const svgTemplatePath = path.resolve(DIR_NAME, 'index.liquid')
    const templateContent = await fs.readFile(svgTemplatePath, 'utf8')
    const svgContent = await engine.parseAndRender(templateContent, { preview: { data: data, date: data.date }})
    const outputFile = path.join(outputDir, `${engine.filters.slugify(data.title)}-preview.png`)

    await fs.mkdir(outputDir, { recursive: true })
    await sharp(Buffer.from(svgContent)).png().toFile(outputFile)
  } catch (error) {
    console.error('Error processing file:', error)
  }
}

const processPostDirectories = async (baseDir) => {
  try {
    const yearDirs = await fs.readdir(baseDir, { withFileTypes: true })
    for (const dirent of yearDirs) {
      if (dirent.isDirectory()) {
        const yearPath = path.join(baseDir, dirent.name)
        const markdownFiles = await fs.readdir(yearPath, { withFileTypes: true })
        for (const file of markdownFiles) {
          if (file.isFile() && file.name.endsWith('.md')) {
            const filePath = path.join(yearPath, file.name)
            await svgToPNG(filePath)
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to process directories:', error)
  }
}

const generateOgImages = async () => await processPostDirectories(baseDir)

generateOgImages()