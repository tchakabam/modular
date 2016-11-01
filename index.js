const Module = require('./src/core/Module').default;
const Node = require('./src/core/Node').default;
const Context = require('./src/core/Context').default;

const Oscillator = require('./src/base/Oscillator').default;

module.exports = {
	Context,
	Oscillator,
	Node,
	Module,
};