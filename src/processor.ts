import type { Linter, AST, Rule } from 'eslint'
import * as htmlparser2 from 'htmlparser2'
import { TextRegion, type SubTextRegion } from './TextRegion'

/**
 * Regex for JavaScript MIME type strings.
 * @see https://mimesniff.spec.whatwg.org/#javascript-mime-type
 */
const JSTypeRegex = /^((application|text)\/(x-)?(ecma|java)script|text\/(javascript1\.[0-5]|(j|live)script))$/

/**
 * Regex for JSON MIME type strings.
 * @see https://mimesniff.spec.whatwg.org/#json-mime-type
 */
const JSONTypeRegex = /(\+json|^(application|text)\/json)$/

/**
 * File extensions for common CSS languages.
 */
const CSSLangExts = new Map<string, string>()
  .set('css', '.css')
  .set('less', '.less')
  .set('scss', '.scss')
  .set('sass', '.sass')
  .set('stylus', '.styl')
  .set('styl', '.styl')

const htmlProcessor = (): Linter.Processor => {
  interface Block {
    file: Linter.ProcessorFile
    region: SubTextRegion
  }

  const blocksMap = new Map<string, Block[]>()

  return {
    supportsAutofix: true,

    preprocess(srcText, srcFilename) {
      const blocks: Block[] = []
      blocksMap.set(srcFilename, blocks)

      const srcTextRegion = new TextRegion(srcText)

      let fileExtension = ''
      let offsetIndex = 0
      let text = ''

      const parser = new htmlparser2.Parser({
        onopentag(name, attributes: Partial<Record<string, string>>) {
          if (name === 'script') {
            const type = attributes.type?.trim().toLowerCase()
            if (!type || JSTypeRegex.test(type)) {
              fileExtension = '.js'
            }
            else if (type === 'module') {
              fileExtension = '.mjs'
            }
            else if (JSONTypeRegex.test(type)) {
              fileExtension = '.json'
            }
          }
          else if (name === 'style') {
            const lang = attributes.lang?.trim().toLowerCase() ?? 'css'
            fileExtension = CSSLangExts.get(lang) ?? CSSLangExts.get('css')!
          }
        },
        ontext(data) {
          if (!fileExtension) return
          let appendText = data
          if (!text) {
            offsetIndex = parser.startIndex
            if (data.startsWith('\n')) {
              offsetIndex += 1
              appendText = data.slice(1)
            }
          }
          text += appendText
        },
        onclosetag() {
          if (!fileExtension) return
          const filename = `${String(blocks.length)}${fileExtension}`
          blocks.push({
            file: { text, filename: filename },
            region: srcTextRegion.slice(offsetIndex),
          })
          fileExtension = ''
          offsetIndex = 0
          text = ''
        },
      })
      parser.write(srcText)
      parser.end()

      return blocks.map(block => block.file)
    },

    postprocess(messages, srcFilename) {
      const blocks = blocksMap.get(srcFilename)!
      blocksMap.delete(srcFilename)

      return messages.flatMap((group, index) => {
        const block = blocks[index]

        return group.map((msg) => {
          const start = block.region.getSourceLineColumn(msg.line, msg.column)
          const adjusted: Partial<typeof msg> = {
            line: start.line,
            column: start.column,
          }

          if (msg.endLine) {
            const end = block.region.getSourceLineColumn(msg.endLine, msg.endColumn ?? 1)
            adjusted.endLine = end.line
            adjusted.endColumn = end.column
          }

          const adjustFix = (fix: Rule.Fix): Rule.Fix => ({
            ...fix,
            range: fix.range.map(x => block.region.getSourceIndex(x)) as AST.Range,
          })

          if (msg.suggestions) {
            adjusted.suggestions = msg.suggestions.map(suggestion => ({
              ...suggestion,
              fix: adjustFix(suggestion.fix),
            }))
          }

          if (msg.fix) {
            adjusted.fix = adjustFix(msg.fix)
          }

          return {
            ...msg,
            ...adjusted,
          }
        })
      })
    },
  }
}

export default htmlProcessor
