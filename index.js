import Knob from './src/core/Knob';
import Factory from './src/core/Factory';
import Context from './src/core/Context';
import Nodule from './src/core/Nodule';
import Monitor from './src/core/Monitor';

// Factory entry point
require('./src/base/all');
require('./src/ui/monitors/all');

module.exports = {
	Context,
	Nodule,
	Knob,
	Factory,
	Monitor,
	create: (name, options, type = Factory.Types.NODULE) => {
		return Factory.createInstance({name, type, options});
	},
	show: (name, options) => {
		return Factory.createInstance({name, type: Factory.Types.MONITOR, options});
	},
	patch: Nodule.patch,
	unpatch: Nodule.unpatch,
	patchToDevice: Context.patchToDevice,
	checkForPatch: Context.checkForPatch,
	refreshUI: Context.refreshUI,
	setUIElement: Context.setUIElement
};