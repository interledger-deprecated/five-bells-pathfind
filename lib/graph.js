'use strict'

const MAX_DEPTH = 7
const DEFAULT_MAX_SEARCH_TIME = 10000 // milliseconds

function * dfs_gen (map, start, end, maxDepth, maxSearchTime) {
  let startTime = Date.now()
  start = start.toString()
  end = end.toString()
  yield * (function * dfs_recur (node, visited, depth) {
    let adj = map[node]
    visited.push(node)
    for (let nextNode in adj) {
      if ((nextNode === end) && (depth === maxDepth)) {
        yield visited.slice(0).concat(end)
      } else if ((visited.indexOf(nextNode) === -1) && (depth <= maxDepth)) {
        if ((Date.now() - startTime) >= maxSearchTime) {
          yield 'slow'
        }
        yield * dfs_recur(nextNode, visited.slice(0), depth + 1)
      }
    }
  })(start, [], 0)
  return 'exhausted'
}

function * iddfs (map, start, end, maxSearchTime) {
  for (let d = 1; d < MAX_DEPTH; d++) {
    yield * dfs_gen(map, start, end, d, maxSearchTime)
  }
}

function findShortestPaths (map, start, end, numPaths, maxSearchTime) {
  let pathGen = iddfs(map, start, end, (maxSearchTime || DEFAULT_MAX_SEARCH_TIME))
  let result = []
  for (let i = 1; i <= numPaths; i++) {
    let p = pathGen.next()
    if (p.done || p.value === 'slow') { break }
    result.push(p.value)
  }
  return result
}

function Graph (map) {
  this.map = map
}

Graph.prototype.findShortestPaths = function (start, end, numPaths, maxSearchTime) {
  return findShortestPaths(this.map, start, end, numPaths, maxSearchTime)
}

Graph.findShortestPaths = function (map, start, end, numPaths, maxSearchTime) {
  return findShortestPaths(map, start, end, numPaths, maxSearchTime)
}

exports.Graph = Graph
