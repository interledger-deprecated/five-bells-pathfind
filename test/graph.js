'use strict';

let assert = require('assert');

describe('Graph', function() {
    describe('#findShortestPaths', function() {

        const Graph = require('../lib/graph.js').Graph;

        let map = {};

        map["USD"] = {};
        map["USD"]["JPY"] = 1;
        map["USD"]["BTC"] = 1;
        map["USD"]["XRP"] = 1;
        map["USD"]["TED"] = 1;
        map["TED"] = {};
        map["TED"]["ALI"] = 1;
        //map["TED"]["BOB"] = 1;
        map["XRP"] = {};
        map["XRP"]["XAU"] = 1;
        map["XRP"]["ALI"] = 1;
        map["XAU"] = {};
        map["XAU"]["ALI"] = 1;
        map["ALI"] = {};
        map["ALI"]["BOB"] = 1;
        map["ALI"]["TED"] = 1;

        const graph = new Graph(map);
        const paths = graph.findShortestPaths("USD","BOB",5);

        it('should find 3 paths in the simple graph', function(){
            assert.equal(paths.length, 3);
        });

        const randomgraph = require('randomgraph');

        const assetCount = 400;
        const rg = randomgraph.BarabasiAlbert(assetCount,80,1);
        const bigEdgeMap = {};
        rg.edges.forEach(function(e, i) {
            let source = e.source;
            if (bigEdgeMap[source] === undefined) {
                bigEdgeMap[source] = {};
            }
            bigEdgeMap[source][e.target] = 1;
        });

        const bigGraph = new Graph(bigEdgeMap);
        const startTime = Date.now();
        const bgPaths = bigGraph.findShortestPaths(1,71,100);
        console.info("found " + bgPaths.length + " paths in:" + (Date.now() - startTime));
        it('should find at least 100 paths in the random graph', function() {
            assert.equal(bgPaths.length,100);
        });

    });
});
