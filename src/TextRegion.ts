export class TextRegion {
  lineLengths: number[]

  constructor(textOrLineLengths: string | number[]) {
    if (Array.isArray(textOrLineLengths)) {
      this.lineLengths = textOrLineLengths
    }
    else {
      this.lineLengths = textOrLineLengths.split('\n').map(line => line.length)
    }
  }

  slice(startIndex: number) {
    return new SubTextRegion(this, startIndex)
  }

  /**
   * @param index 0-based index
   * @returns 1-based line and column
   */
  getLineColumn(index: number) {
    let line = 0
    while (index > this.lineLengths[line]) {
      index -= this.lineLengths[line] + 1
      line++
    }
    return {
      line: line + 1,
      column: index + 1,
    }
  }

  /**
   * @param line 1-based line
   * @param column 1-based column
   * @returns 0-based index
   */
  getIndex(line: number, column: number) {
    return this.lineLengths.slice(0, line - 1).reduce((a, b) => a + b + 1, 0) + column - 1
  }
}

export class SubTextRegion extends TextRegion {
  source: TextRegion
  startIndex: number

  constructor(source: TextRegion, startIndex: number) {
    const { line, column } = source.getLineColumn(startIndex)

    const lineLengths = source.lineLengths.slice(line - 1)
    lineLengths[0] -= column - 1
    super(lineLengths)

    this.source = source
    this.startIndex = startIndex
  }

  /**
   * @param line 1-based line
   * @param column 1-based column
   * @returns 1-based line and column in the source region
   */
  getSourceLineColumn(line: number, column: number) {
    const index = this.getIndex(line, column) + this.startIndex
    return this.source.getLineColumn(index)
  }

  getSourceIndex(index: number) {
    return this.startIndex + index
  }
}
