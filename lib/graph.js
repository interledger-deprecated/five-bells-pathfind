'use strict'

const DEFAULT_MAX_DEPTH = 8
const DEFAULT_MAX_SEARCH_TIME = 10000 // milliseconds

function * dfs_gen (map, start, end, maxDepth, maxSearchTime) {
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

function * iddfs (map, start, end, maxSearchTime) {
  for (let d = 1; d < DEFAULT_MAX_DEPTH; d++) {
    yield * dfs_gen(map, start, end, d, maxSearchTime)
  }
}

class Graph {
  constructor (opts) {
    this.map = opts.map
    this.maxPathLength = opts.maxPathLength || DEFAULT_MAX_DEPTH
  }

  static findShortestPaths (map, start, end, numPaths, maxSearchTime) {
    let pathGen = iddfs(map, start, end, (maxSearchTime || DEFAULT_MAX_SEARCH_TIME))
    let result = []
    for (let i = 1; i <= numPaths; i++) {
      let p = pathGen.next()
      if (p.done || p.value === 'slow') {
        break
      }
      result.push(p.value)
    }
    return result
  }

  findShortestPaths (start, end, numPaths, maxSearchTime) {
    return Graph.findShortestPaths(this.map, start, end, numPaths, maxSearchTime)
  }
}

exports.Graph = Graph
