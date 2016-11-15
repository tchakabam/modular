import Nodule from '../core/Nodule';

class Identity extends Nodule {

	constructor(name) {
		super(name || 'Identity');
	}

	tdtf(inSample) {
		return inSample;
	}
}

export default Identity;