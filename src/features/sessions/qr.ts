const VERSION = 10
const SIZE = VERSION * 4 + 17
const ECC_CODEWORDS_PER_BLOCK = 18
const BLOCK_COUNT = 4
const DATA_CODEWORDS = 274

type QrGrid = { modules: boolean[][]; functions: boolean[][] }

function gfMultiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

function reedSolomonDivisor(degree: number): number[] {
  const result = Array(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMultiply(result[j], root)
      if (j + 1 < degree) result[j] ^= result[j + 1]
    }
    root = gfMultiply(root, 2)
  }
  return result
}

function reedSolomonRemainder(data: number[], divisor: number[]): number[] {
  const result = Array(divisor.length).fill(0)
  for (const value of data) {
    const factor = value ^ result[0]
    result.shift()
    result.push(0)
    for (let i = 0; i < result.length; i += 1) result[i] ^= gfMultiply(divisor[i], factor)
  }
  return result
}

function appendBits(bits: number[], value: number, count: number) {
  for (let i = count - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1)
}

function makeCodewords(text: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(text))
  const capacityBits = DATA_CODEWORDS * 8
  if (bytes.length > 271) throw new Error('The attendance link is too long for its QR code.')
  const bits: number[] = []
  appendBits(bits, 0b0100, 4) // Byte mode
  appendBits(bits, bytes.length, 16) // Versions 10 and above use a 16-bit byte count.
  for (const byte of bytes) appendBits(bits, byte, 8)
  appendBits(bits, 0, Math.min(4, capacityBits - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)
  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0))
  }
  for (let pad = 0xec; data.length < DATA_CODEWORDS; pad ^= 0xec ^ 0x11) data.push(pad)

  const divisor = reedSolomonDivisor(ECC_CODEWORDS_PER_BLOCK)
  const shortBlockDataLength = Math.floor(DATA_CODEWORDS / BLOCK_COUNT)
  const longBlockCount = DATA_CODEWORDS % BLOCK_COUNT
  const blocks: number[][] = []
  let offset = 0
  for (let blockIndex = 0; blockIndex < BLOCK_COUNT; blockIndex += 1) {
    const blockLength = shortBlockDataLength + (blockIndex >= BLOCK_COUNT - longBlockCount ? 1 : 0)
    const block = data.slice(offset, offset + blockLength)
    offset += blockLength
    blocks.push([...block, ...reedSolomonRemainder(block, divisor)])
  }

  const result: number[] = []
  const longestDataLength = shortBlockDataLength + (longBlockCount > 0 ? 1 : 0)
  for (let index = 0; index < longestDataLength; index += 1) {
    for (const block of blocks) if (index < block.length - ECC_CODEWORDS_PER_BLOCK) result.push(block[index])
  }
  for (let index = 0; index < ECC_CODEWORDS_PER_BLOCK; index += 1) {
    for (const block of blocks) result.push(block[block.length - ECC_CODEWORDS_PER_BLOCK + index])
  }
  return result
}

function newGrid(): QrGrid {
  return {
    modules: Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false)),
    functions: Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false))
  }
}

function setFunction(grid: QrGrid, x: number, y: number, dark: boolean) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return
  grid.modules[y][x] = dark
  grid.functions[y][x] = true
}

function drawFinder(grid: QrGrid, centerX: number, centerY: number) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy))
      setFunction(grid, centerX + dx, centerY + dy, distance !== 2 && distance !== 4)
    }
  }
}

function drawAlignment(grid: QrGrid, centerX: number, centerY: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunction(grid, centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }
  }
}

function drawVersion(grid: QrGrid) {
  let remainder = VERSION
  for (let i = 0; i < 12; i += 1) remainder = (remainder << 1) ^ (((remainder >>> 11) & 1) * 0x1f25)
  const bits = (VERSION << 12) | remainder
  for (let i = 0; i < 18; i += 1) {
    const bit = ((bits >>> i) & 1) !== 0
    const a = SIZE - 11 + i % 3
    const b = Math.floor(i / 3)
    setFunction(grid, a, b, bit)
    setFunction(grid, b, a, bit)
  }
}

function drawFormat(grid: QrGrid, mask: number) {
  const data = (0b01 << 3) | mask // Error-correction level L.
  let remainder = data
  for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537)
  const bits = ((data << 10) | remainder) ^ 0x5412
  for (let i = 0; i <= 5; i += 1) setFunction(grid, 8, i, ((bits >>> i) & 1) !== 0)
  setFunction(grid, 8, 7, ((bits >>> 6) & 1) !== 0)
  setFunction(grid, 8, 8, ((bits >>> 7) & 1) !== 0)
  setFunction(grid, 7, 8, ((bits >>> 8) & 1) !== 0)
  for (let i = 9; i < 15; i += 1) setFunction(grid, 14 - i, 8, ((bits >>> i) & 1) !== 0)
  for (let i = 0; i < 8; i += 1) setFunction(grid, SIZE - 1 - i, 8, ((bits >>> i) & 1) !== 0)
  for (let i = 8; i < 15; i += 1) setFunction(grid, 8, SIZE - 15 + i, ((bits >>> i) & 1) !== 0)
  setFunction(grid, 8, SIZE - 8, true)
}

function drawFunctionPatterns(grid: QrGrid) {
  drawFinder(grid, 3, 3)
  drawFinder(grid, SIZE - 4, 3)
  drawFinder(grid, 3, SIZE - 4)
  for (const y of [6, 28, 50]) {
    for (const x of [6, 28, 50]) {
      if (!grid.functions[y][x]) drawAlignment(grid, x, y)
    }
  }
  for (let i = 0; i < SIZE; i += 1) {
    if (!grid.functions[6][i]) setFunction(grid, i, 6, i % 2 === 0)
    if (!grid.functions[i][6]) setFunction(grid, 6, i, i % 2 === 0)
  }
  drawFormat(grid, 0)
  drawVersion(grid)
}

function drawCodewords(grid: QrGrid, codewords: number[]) {
  let bitIndex = 0
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < SIZE; vert += 1) {
      const upward = ((right + 1) & 2) === 0
      const y = upward ? SIZE - 1 - vert : vert
      for (let column = 0; column < 2; column += 1) {
        const x = right - column
        if (grid.functions[y][x]) continue
        if (bitIndex < codewords.length * 8) {
          grid.modules[y][x] = ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0
          bitIndex += 1
        }
      }
    }
  }
  if (bitIndex !== codewords.length * 8) throw new Error('The attendance QR code could not be encoded.')
}

function maskCondition(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0
    case 1: return y % 2 === 0
    case 2: return x % 3 === 0
    case 3: return (x + y) % 3 === 0
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
    case 5: return (x * y) % 2 + (x * y) % 3 === 0
    case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0
    case 7: return ((x + y) % 2 + (x * y) % 3) % 2 === 0
    default: return false
  }
}

function applyMask(grid: QrGrid, mask: number) {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!grid.functions[y][x] && maskCondition(mask, x, y)) grid.modules[y][x] = !grid.modules[y][x]
    }
  }
}

function penaltyScore(grid: QrGrid): number {
  let score = 0
  const lines: string[] = []
  for (let y = 0; y < SIZE; y += 1) lines.push(grid.modules[y].map((bit) => bit ? '1' : '0').join(''))
  for (let x = 0; x < SIZE; x += 1) lines.push(grid.modules.map((row) => row[x] ? '1' : '0').join(''))
  for (const line of lines) {
    let run = 1
    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === line[i - 1]) {
        run += 1
        if (i === line.length - 1 && run >= 5) score += 3 + run - 5
      } else {
        if (run >= 5) score += 3 + run - 5
        run = 1
      }
    }
    let position = line.indexOf('10111010000')
    while (position !== -1) {
      score += 40
      position = line.indexOf('10111010000', position + 1)
    }
    position = line.indexOf('00001011101')
    while (position !== -1) {
      score += 40
      position = line.indexOf('00001011101', position + 1)
    }
  }
  for (let y = 0; y < SIZE - 1; y += 1) {
    for (let x = 0; x < SIZE - 1; x += 1) {
      const bit = grid.modules[y][x]
      if (grid.modules[y][x + 1] === bit && grid.modules[y + 1][x] === bit && grid.modules[y + 1][x + 1] === bit) score += 3
    }
  }
  let dark = 0
  for (const row of grid.modules) for (const bit of row) if (bit) dark += 1
  score += Math.floor(Math.abs(dark * 100 / (SIZE * SIZE) - 50) / 5) * 10
  return score
}

function cloneGrid(grid: QrGrid): QrGrid {
  return { modules: grid.modules.map((row) => [...row]), functions: grid.functions.map((row) => [...row]) }
}

export function encodeAttendanceQr(text: string): boolean[][] {
  const grid = newGrid()
  drawFunctionPatterns(grid)
  drawCodewords(grid, makeCodewords(text))
  let best: QrGrid | null = null
  let bestScore = Number.POSITIVE_INFINITY
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = cloneGrid(grid)
    applyMask(candidate, mask)
    drawFormat(candidate, mask)
    const score = penaltyScore(candidate)
    if (score < bestScore) {
      best = candidate
      bestScore = score
    }
  }
  if (!best) throw new Error('The attendance QR code could not be generated.')
  return best.modules
}
