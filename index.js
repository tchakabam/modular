import Knob from './src/core/Knob';
import Factory from './src/core/Factory';
import Context from './src/core/Context';
import Nodule from './src/core/Nodule';
import Monitor from './src/core/Monitor';
import ui from './src/ui/all';

// Factory entry point
require('./src/base/all');
require('./src/ui/monitors/all');

module.exports = {
	/* Factory API */
	create: (name, options, type = Factory.Types.NODULE) => {
		return Factory.createInstance({name, type, options});
	},
	show: (name, options) => {
		return Factory.createInstance({name, type: Factory.Types.MONITOR, options});
	},
	Factory,
	/* Nodule API */
	patch: Nodule.patch,
	unpatch: Nodule.unpatch,
	unpatchAll: Nodule.unpatchAll,
	/* Context API */
	unregisterNodule: Context.unregisterNodule,
	patchToDevice: Context.patchToDevice,
	checkForPatch: Context.checkForPatch,
	refresh: Context.refresh,
	setContainer: Context.setContainer
};