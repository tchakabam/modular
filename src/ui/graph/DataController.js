const Events = {
	CLICK: "click",
	DRAGSTARTED: "drag-started",
	DRAGENDED: "drag-ended"
}

class DataController {

	constructor(nodule, isDestination = false) {
		// TODO: detect / verify expectations of some-sort of model interface !
		this.nodule_ = nodule;
		this.isDestination_ = isDestination;
	}

	static get Events() {
		return Events;
	}

	get isDestination() {
		return this.isDestination_;
	}

	getNodule() {
		return this.nodule_;
	}

	handle(eventType) {
		switch(eventType) {
		case Events.CLICK:
			if (typeof this.getNodule().debug === 'function') {
				this.getNodule().debug();	
			} else {
				console.error('no debug function found in data model!');
			}
			break;
		}
	}
}

export default DataController;