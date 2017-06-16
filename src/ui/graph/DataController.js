const Events = {
	CLICK: "click",
	DRAGSTARTED: "drag-started",
	DRAGENDED: "drag-ended"
}

class DataController {

	constructor(nodule) {
		// TODO: detect / verify expectations of some-sort of model interface !
		this.nodule_ = nodule;
	}

	static get Events() {
		return Events;
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
				console.error('no debug function found in model!');
			}
			break;
		}
	}
}

export default DataController;