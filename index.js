import Knob from './src/core/Knob';
import Factory from './src/core/Factory';
import Context from './src/core/Context';
import Nodule from './src/core/Nodule';

// Factory entry point
require('./src/base/all');

module.exports = {
	Context,
	Nodule,
	Knob,
	Factory,
	create: (name, options, type = Factory.Types.NODULE) => {
		return Factory.createInstance({name, type, options});
	},
	patchToDevice: Context.patchToDevice,
	patch: Nodule.patch,
	unpatch: Nodule.unpatch,
	refreshUI: Context.refreshUI,
	setUIElement: Context.setUIElement
};