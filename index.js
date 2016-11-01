const Module = require('./src/core/Module').default;
const Nodule = require('./src/core/Nodule').default;
const Context = require('./src/core/Context').default;

const Oscillator = require('./src/base/Oscillator').default;

module.exports = {
	Context,
	Oscillator,
	Nodule,
	Module,
};