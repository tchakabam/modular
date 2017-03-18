import Nodule from '../core/Nodule';

const staticNodules = new Map();

function getMapForType(type) {
	let map;
	switch (type) {
	case Factory.Types.NODULE:
		map = staticNodules
		break;
	default:
		throw new Error('factory doesnt know type: ' + type);
	}
	return map;
}

class Factory {

	static define(clazz, {name, type}) {
		getMapForType(type).set(name, clazz);
		return clazz;
	}

	static collectType(type) {
		let map = getMapForType(type);
		return {
			names: Array.from(map.keys()),
			classes: Array.from(map.values())
		};
	}

	static getClass({name, type}) {
		let map = getMapForType(type);

		if (!map.has(name)) {
			throw new Error('requested class doesnt exist!');
		}
		return staticNodules.get(name);	
	}

	static createInstance({name, type, options}) {
		const Thing = Factory.getClass({name, type});
		return new Thing(options);
	}

	static hasClass({name, type}) {
		try {
			Factory.getClass({name, type});
		} catch(e) {
			return false;
		}
		return true;
	}

	/*
	static declareNodule(prototypeExt, name) {
		class N extends Nodule {
		};
		return N;
	}
	*/

	static get Types() {
		return {
			NODULE: 'Nodule'
		}
	}
}

export default Factory;