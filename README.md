# Five Bells Pathfind [![Circle CI](https://circleci.com/gh/ripple/five-bells-pathfind/tree/master.svg?style=svg&circle-token=c95a5cf56eb70f8af03ea5c03cf21c9e7c3f8f3c)](https://circleci.com/gh/ripple/five-bells-pathfind/tree/master)

> A reference implementation of an Interledger pathfinder

You can see the pathfinder in action as part of the [`five-bells-demo`](https://github.com/ripple/five-bells-demo)!

## Algorithm

This library includes a network crawler, graph search algorithm implementation and rate quoting client. 

The crawler uses APIs on the [`five-bells-ledger`](https://github.com/ripple/five-bells-ledger) and [`five-bells-trader`](https://github.com/ripple/five-bells-trader) to find other nodes in the network based on a given starting point.

This library uses [Iterative Deepening Depth-First Search](https://en.wikipedia.org/wiki/Iterative_deepening_depth-first_search) to find the shortest paths from the sending ledger to the receiving ledger.

The rate quoting client requests quotes from the traders involved in a given path starting with the trader closest to the recipient and working backwards.