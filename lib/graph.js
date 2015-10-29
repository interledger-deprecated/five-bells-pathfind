'use strict'

const DEFAULT_MAX_DEPTH = 8
const DEFAULT_MAX_SEARCH_TIME = 10000 // milliseconds

class Graph {
  constructor (opts) {
    this.map = opts.map
    this.maxPathLength = opts.maxPathLength || DEFAULT_MAX_DEPTH
  }

  static * dfs_gen (map, start, end, maxDepth, maxSearchTime) {
    let startTime = Date.now()
    start = start.toString()
    end = end.toString()
    yield * (function * dfs_recur (node, visited, depth) {
      let adj = map[node]
      visited.push(node)
      for (let nextNode in adj) {
        if (nextNode === end) {
          if (depth === maxDepth) {
            yield visited.slice(0).concat(end)
          }
        } else if ((visited.indexOf(nextNode) === -1) && (depth < maxDepth)) {
          if ((Date.now() - startTime) >= maxSearchTime) {
            yield 'slow'
          }
          yield * dfs_recur(nextNode, visited.slice(0), depth + 1)
        }
      }
    })(start, [], 1)
    return 'exhausted'
  }

  static * iddfs (params) {
    for (let depth = 1; depth < params.maxPathLength; depth++) {
      yield * Graph.dfs_gen(params.map, params.start, params.end, depth, params.maxSearchTime)
    }
  }

  static findShortestPaths (params) {
    let pathGen = Graph.iddfs({
      map: params.map,
      start: params.start,
      end: params.end,
      maxSearchTime: (params.maxSearchTime || DEFAULT_MAX_SEARCH_TIME),
      maxPathLength: params.maxPathLength
    })
    let result = []
    for (let i = 1; i <= params.numPaths; i++) {
      let p = pathGen.next()
      if (p.done || p.value === 'slow') {
        break
      }
      result.push(p.value)
    }
    return result
  }

  findShortestPaths (start, end, numPaths, maxSearchTime) {
    return Graph.findShortestPaths({
      map: this.map,
      start: start,
      end: end,
      numPaths: numPaths,
      maxSearchTime: maxSearchTime,
      maxPathLength: this.maxPathLength
    })
  }
}

exports.Graph = Graph
