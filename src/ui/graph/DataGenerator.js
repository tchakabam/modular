import Context from '../../core/Context';
import DataController from './DataController';

const DESTINATION_ID = '*';

class DataGenerator {
	constructor({nodules, patches}) {
		this.nodules = nodules;
		this.patches = patches;

		this.data_ = null;
	}

	get(refresh) {
		refresh && this.run();
		return this.data_;
	}

	run() {
		const controllers = {};
		const nodes = [];
		const links = [];
		const halos = [];

		let groupNo = 0;

		// add device destination node
		nodes.push({
			id: DESTINATION_ID,
			group: groupNo++
		});
		controllers[DESTINATION_ID] = new DataController({
			debug: () => {
				console.debug(Context.getOrCreateDefaultAudioContext().destination);
			},
			getKnobs: () => [],
			getParams: () => []
		}, true);

		const linkedNodes = [];
		function insertIntoLinkedNodesOnce(name) {
			if (linkedNodes.indexOf(name) >= 0) { 
				linkedNodes.push(name); 
			}
		};

		const unlinkedNodes = [];
		this.nodules.forEach((nodule) => { 
			nodule.isUnplugged && unlinkedNodes.push(nodule.name) 
		});

		this.nodules.forEach((nodule) => {
			nodes.push({
				id: nodule.name,
				group: groupNo
			});
			controllers[nodule.name] = new DataController(nodule);
		});

		this.patches.forEach((patch) => {

			const target = patch.to !== null ? patch.to.name : DESTINATION_ID;
			const source = patch.from.name;

			links.push({
				source,
				target,
				value: 1,
				group: groupNo,
				knobName: patch.knobName
			});

			insertIntoLinkedNodesOnce(source);
			insertIntoLinkedNodesOnce(target);
		});

		unlinkedNodes.forEach((nodeName) => {

			halos.push({
				source: nodeName,
				target: DESTINATION_ID,
				value: 1
			});
		});

		this.data_ = {
			linkedNodes,
			unlinkedNodes,
			halos,
			nodes,
			links,
			controllers
		};
	}
}

export default DataGenerator;