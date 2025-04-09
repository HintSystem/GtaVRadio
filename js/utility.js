export class SeededPRNG {
    constructor(seed) {
        /** @type {number} - Equal seed values will deterministically generate the same set of pseudo random numbers */
        this.seed = seed
        /** @type {number} - The index determines which number to generate from the pseudo random set, making it possible to always generate the same number */
        this.index = 0
    }

    /**
     * Generates a pseudo random number from 0 to 4294967295 (0xFFFFFFFF) based on `seed` and `index`.
     * @returns {number}
     */
    generate() {
        // Simple hash function (xorshift-style)
        let value = this.seed ^ this.index
        value = (value ^ (value >>> 21)) * 0x45d9f3b
        value = (value ^ (value >>> 15)) * 0x45d9f3b
        value = value ^ (value >>> 13)

        return value >>> 0
    }

    /**
     * Generates a pseudo random number and increments `index` by 1
     * @returns {number} value from 0 to 4294967295 (0xFFFFFFFF)
     */
    next() {
        const value = this.generate()
        this.index++
        return value
    }

    /**
     * Converts generated number to a float from 0 to 1
     * @returns {number}
     */
    toFloat(number) { return number / 0xFFFFFFFF }
}

/** Draw pool for selecting random indexes while also avoiding repetitiveness */
class IndexDrawPool {
    /**
     * @param {number} sourceSize - The length of the array to create an IndexDrawPool for
     * @param {number} dontRepeatFor - The amount of consecutive indexes to guarantee uniqueness for
     */
    constructor(sourceSize, dontRepeatFor = 8) {
        /** @type {number[]} - Available indexes that have not been used in the last `dontRepeatFor` draws */
        this.draw = [...Array(sourceSize).keys()]
        /** @type {number[]} - Queue with recently used indexes */
        this.discard = []
        /** @type {number} - Number of recent indexes to exclude from selection */
        this.dontRepeatFor = dontRepeatFor
    }

    /**
     * Returns a non-repeating index from the pool using the given random integer
     * @param {number} randomInteger - Random integer greater than 0 where maximum value is also greater than `sourceSize`
     * @returns {number|null} Unique index from 0 to `sourceSize - 1` or null if all options are exhausted 
     */
    next(randomInteger) {
        if (this.draw.length === 0) return null

        const randomIndex = randomInteger % this.draw.length
        const selected = this.draw.splice(randomIndex, 1)[0]
        this.discard.push(selected)

        if (this.discard.length > this.dontRepeatFor) {
            const index = this.discard.shift()
            this.draw.push(index)
        }

        return selected
    }
}

export class IndexDrawPoolManager {
    /** @type {Map<string, IndexDrawPool>} - Stores mutliple IndexDrawPools by `id` */
    map

    constructor() { this.map = new Map() }

    /**
     * Returns an index from 0 to `sourceSize - 1` that is guaranteed to be unique for the last `dontRepeatFor` indexes.
     * Initializes a new IndexDrawPool identified by `id` if not already present.
     * 
     * @param {string} id - Identifier for getting the IndexDrawPool
     * @param {number} sourceSize - The length of the array to get an index for
     * @param {number} randomInteger - Random integer greater than 0
     * @param {number} dontRepeatFor - The amount of consecutive indexes to guarantee uniqueness for (limited by `sourceSize`)
     * @returns {number} A unique index for the array
     */
    nextUniqueIndex(id, sourceSize, randomInteger, dontRepeatFor = 8) {
        if (!this.map.has(id)) {
            this.map.set(id, new IndexDrawPool(sourceSize, Math.min(dontRepeatFor, sourceSize-1)))
        }

        const indexQueue = this.map.get(id)
        return indexQueue.next(randomInteger)
    }
}