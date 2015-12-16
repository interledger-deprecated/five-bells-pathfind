'use strict'

var extractKeys = function (obj) {
  const keys = []
  for (let key in obj) {
    Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key)
  }
  return keys
}

var sorter = function (a, b) {
  return parseFloat(a) - parseFloat(b)
}

var findPaths = function (map, start, end, infinity) {
  infinity = infinity || Infinity

  const costs = {}
  const open = {'0': [start]}
  const predecessors = {}
  let keys

  function addToOpen (cost, vertex) {
    const key = '' + cost
    if (!open[key]) open[key] = []
    open[key].push(vertex)
  }

  costs[start] = 0

  while (open) {
    if (!(keys = extractKeys(open)).length) break

    keys.sort(sorter)

    const key = keys[0]
    const bucket = open[key]
    const node = bucket.shift()
    const currentCost = parseFloat(key)
    const adjacentNodes = map[node] || {}

    if (!bucket.length) delete open[key]

    for (var vertex in adjacentNodes) {
      if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
        const cost = adjacentNodes[vertex]
        const totalCost = cost + currentCost
        const vertexCost = costs[vertex]

        if ((vertexCost === undefined) || (vertexCost > totalCost)) {
          costs[vertex] = totalCost
          addToOpen(totalCost, vertex)
          predecessors[vertex] = node
        }
      }
    }
  }

  if (costs[end] === undefined) {
    return null
  } else {
    return predecessors
  }
}

function extractShortest (predecessors, end) {
  const nodes = []
  let u = end

  while (u) {
    nodes.push(u)
    u = predecessors[u]
  }

  nodes.reverse()
  return nodes
}

function findShortestPath (map, nodes) {
  var start = nodes.shift()
  let end
  let predecessors
  const path = []
  let shortest

  while (nodes.length) {
    end = nodes.shift()
    predecessors = findPaths(map, start, end)

    if (predecessors) {
      shortest = extractShortest(predecessors, end)
      if (nodes.length) {
        path.push.apply(path, shortest.slice(0, -1))
      } else {
        return path.concat(shortest)
      }
    } else {
      return null
    }

    start = end
  }
}

function toArray (list, offset) {
  try {
    return Array.prototype.slice.call(list, offset)
  } catch (e) {
    var a = []
    for (var i = offset || 0, l = list.length; i < l; ++i) {
      a.push(list[i])
    }
    return a
  }
}

var Graph = function (map) {
  this.map = map
}

Graph.prototype.findShortestPath = function (start, end) {
  if (Object.prototype.toString.call(start) === '[object Array]') {
    return findShortestPath(this.map, start)
  } else if (arguments.length === 2) {
    return findShortestPath(this.map, [start, end])
  } else {
    return findShortestPath(this.map, toArray(arguments))
  }
}

Graph.findShortestPath = function (map, start, end) {
  if (Object.prototype.toString.call(start) === '[object Array]') {
    return findShortestPath(map, start)
  } else if (arguments.length === 3) {
    return findShortestPath(map, [start, end])
  } else {
    return findShortestPath(map, toArray(arguments, 1))
  }
}

exports.Graph = Graph
