# Five Bells Pathfind [![npm][npm-image]][npm-url] [![circle][circle-image]][circle-url] [![coveralls][coveralls-image]][coveralls-url]

[npm-image]: https://img.shields.io/npm/v/five-bells-pathfind.svg?style=flat
[npm-url]: https://npmjs.org/package/five-bells-pathfind
[circle-image]: https://circleci.com/gh/interledger/five-bells-pathfind.svg?style=shield
[circle-url]: https://circleci.com/gh/interledger/five-bells-pathfind
[coveralls-image]: https://coveralls.io/repos/interledger/five-bells-pathfind/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/interledger/five-bells-pathfind?branch=master


> A reference implementation of an Interledger pathfinder

You can see the pathfinder in action as part of the [`five-bells-demo`](https://github.com/interledger/five-bells-demo)!

## Algorithm

This library includes a network crawler, graph search algorithm implementation and rate quoting client.

The crawler uses APIs on the [`five-bells-ledger`](https://github.com/interledger/five-bells-ledger) and [`five-bells-trader`](https://github.com/interledger/five-bells-trader) to find other nodes in the network based on a given starting point.

This library uses [Iterative Deepening Depth-First Search](https://en.wikipedia.org/wiki/Iterative_deepening_depth-first_search) to find the shortest paths from the sending ledger to the receiving ledger.

The rate quoting client requests quotes from the traders involved in a given path starting with the trader closest to the recipient and working backwards.

## Browser Support

This library can be compiled with [Babel](https://babeljs.io/) using the command `npm run build`. The compiled files will be in the `babel/` folder.
