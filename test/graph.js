/* eslint-env node, mocha */
'use strict'

const expect = require('chai').expect
const randomgraph = require('randomgraph')
const Graph = require('../lib/graph.js').Graph

describe('Graph', function () {
  describe('.findShortestPaths()', function () {
    beforeEach(function () {
      this.fourNodeMap = {}
      const fourNodes = ['A', 'B', 'C', 'D']
      for (let node1 in fourNodes) {
        this.fourNodeMap[fourNodes[node1]] = {}
        for (let node2 = node1; node2 < fourNodes.length; node2++) {
          this.fourNodeMap[fourNodes[node1]][fourNodes[node2]] = 1
        }
      }

      // This has paths A->B, A->C->B, A->D->E->B
      this.multiplePathMap = {}
      this.multiplePathMap['A'] = {}
      this.multiplePathMap['C'] = {}
      this.multiplePathMap['D'] = {}
      this.multiplePathMap['E'] = {}
      this.multiplePathMap['A']['C'] = 1
      this.multiplePathMap['C']['B'] = 1
      this.multiplePathMap['A']['D'] = 1
      this.multiplePathMap['D']['E'] = 1
      this.multiplePathMap['E']['B'] = 1
      // this.multiplePathMap['A']['B'] = 1

      this.simpleMap = {}
      this.simpleMap['A'] = {}
      this.simpleMap['B'] = {}
      this.simpleMap['C'] = {}
      this.simpleMap['D'] = {}
      this.simpleMap['E'] = {}
      this.simpleMap['F'] = {}
      this.simpleMap['G'] = {}
      this.simpleMap['A']['B'] = 1
      this.simpleMap['B']['C'] = 1
      this.simpleMap['C']['D'] = 1
      this.simpleMap['E']['F'] = 1
      this.simpleMap['A']['C'] = 1
      this.simpleMap['A']['G'] = 1
      this.simpleMap['G']['F'] = 1
      this.simpleMap['F']['E'] = 1
      this.simpleMap['E']['D'] = 1

      const rg = randomgraph.BarabasiAlbert(400, 80, 1)
      this.bigRandomMap = {}
      for (let edge of rg.edges) {
        let source = edge.source
        if (this.bigRandomMap[source] == null) {
          this.bigRandomMap[source] = {}
        }
        this.bigRandomMap[source][edge.target] = 1
      }
    })

    it('should find the shortest path in a fully connected 4-node graph', function () {
      const graph = new Graph({map: this.fourNodeMap})
      const paths = graph.findShortestPaths('A', 'D', 1)
      expect(paths).to.have.length(1)
      expect(paths[0]).to.deep.equal(['A', 'D'])
    })

    it('should find the shortest path in a partially connected 4-node graph', function () {
      delete this.fourNodeMap['A']['D']
      const graph = new Graph({map: this.fourNodeMap})
      const paths = graph.findShortestPaths('A', 'D', 1)
      expect(paths).to.have.length(1)
      expect(paths[0]).to.deep.equal(['A', 'B', 'D'])
    })

    it('should find the shortest path even when there are multiple valid paths', function () {
      const graph = new Graph({map: this.multiplePathMap})
      const paths = graph.findShortestPaths('A', 'B', 1)
      expect(paths[0]).to.deep.equal(['A', 'C', 'B'])
    })

    it('should find 3 paths in the simple graph', function () {
      const graph = new Graph({map: this.simpleMap})
      const paths = graph.findShortestPaths('A', 'D', 5)
      expect(paths).to.have.length(3)
    })

    it('should order paths by length if multiple are found', function () {
      const graph = new Graph({map: this.simpleMap})
      const paths = graph.findShortestPaths('A', 'D', 5)
      expect(paths).to.have.length(3)
      expect(paths[0].length).to.be.lessThan(paths[1].length)
      expect(paths[1].length).to.be.lessThan(paths[2].length)
    })

    it('should find only the shortest path if asked for just one path', function () {
      const graph = new Graph({map: this.simpleMap})
      const paths = graph.findShortestPaths('A', 'D', 1)
      expect(paths).to.have.length(1)
      expect(paths[0]).to.deep.equal(['A', 'C', 'D'])
    })

    it('should find at least 100 paths in the random graph', function () {
      const graph = new Graph({map: this.bigRandomMap})
      const paths = graph.findShortestPaths(1, 71, 100)
      expect(paths).to.have.length(100)
    })
  })
})
