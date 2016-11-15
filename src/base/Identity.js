import Nodule from '../core/Nodule';

class Identity extends Nodule {

	constructor(name) {
		super(name || 'Identity');
	}

	tdtf(inSample/*, time, knobsDataHash, knobBufferOffset*/) {
		return inSample;
	}
}

export default Identity;