const ALLOW_DEFINE_OVERLOADS = false;

const staticNodules = new Map();
const staticMonitors = new Map();

function getMapForType(type) {
	let map;
	switch (type) {
	case Factory.Types.MONITOR:
		map = staticMonitors;
		break;
	case Factory.Types.NODULE:
		map = staticNodules
		break;
	default:
		throw new Error('Factory doesn`t know type: ' + type);
	}
	return map;
}

class Factory {

	static define(clazz, {name, type}) {
		let map = getMapForType(type);
		if (!ALLOW_DEFINE_OVERLOADS && map.has(name)) {
			throw new Error('Factory: Define overloads not allowed: ' + name);
		}
		map.set(name, clazz);
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
		return map.get(name);	
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

	static get Types() {
		return {
			MONITOR: 'Monitor',
			NODULE: 'Nodule'
		}
	}
}

export default Factory;