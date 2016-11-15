const Nodule = require('./src/core/Nodule').default;
const Context = require('./src/core/Context').default;
const Oscillator = require('./src/base/Oscillator').default;

import Gain from './src/base/NativeGain';
import Knob from './src/core/Knob';

module.exports = {
	Context,
	Oscillator,
	Gain,
	Nodule,
	Knob
};