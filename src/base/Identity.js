import Nodule from '../core/Nodule';
import Factory from '../core/Factory';

class Identity extends Nodule {

	constructor({name} = {}) {
		super(name || 'Identity');
	}

	tdtf(inSample) {
		return inSample;
	}
}

Factory.define(Identity, {
	name: 'Identity',
	type: Factory.Types.NODULE
});

export default Identity;