const d3 = require('d3');

import NodulePanel from '../panels/NodulePanel';

const PANEL_SELECTOR = "div.panel";

function patchOrUnpatch(fromNodule, toNodule, knobName) {

	if (this.graph.isDestinationSelected) {
		modular.patchToDevice(fromNodule);
		return;
	}

	if (modular.checkForPatch(fromNodule, toNodule)) {
		modular.unpatch(fromNodule, toNodule, knobName);
	} else {
		modular.patch(fromNodule, toNodule, knobName);
	}
}

class GraphEventHandler {
	constructor(graph) {
		this.graph_ = graph;
		this.panel_ = null;
		this.panelEl_ = document.querySelector(PANEL_SELECTOR);
	}

	get graph() {
		return this.graph_;
	}

	get panel() {
		return this.panel_;
	}

	get panelContainer() {
		return this.panelEl_;
	}

	get panelState() {
		return this.panel.state;
	}

	onAddClick() {
		const noduleFactoryName = this.graph.getSelectMenuValue();
		modular.create(noduleFactoryName);
		modular.refresh();
	}

	onSubClick() {
		const selectedNodule = this.graph.getSelectedNodule();
		modular.unpatchAll(selectedNodule);
		modular.unregisterNodule(selectedNodule);
		modular.refresh();
	}

	onEditClick() {
		this.graph.setEditing(!this.graph.isEditing);
		d3.select('#edit-button').classed('editing', this.graph.isEditing);
		console.log('set edit mode:', this.graph.isEditing);
	}

	onNodeClick(e) {
		if (this.graph.isNodeSelected && this.graph.isEditing) {

			// has destination been clicked?
			if (this.graph.isDestinationNodeId(e.id)) {
				console.warn('Destination node can not be a signal source');
				return;
			}

			const toNodule = this.graph.getSelectedNodule();
			const fromNodule = this.graph.getNoduleByNodeId(e.id);
			const knobName = this.panelState.selectedKnobName;

			patchOrUnpatch.call(this, fromNodule, toNodule, knobName);

			this.graph.refresh();
		} else {

			this.graph.updateSelectedNodeId_(e.id);
		}

		const panel = this.panel_ = NodulePanel.refresh(
			this.panelContainer,
			this.graph.getNoduleByNodeId(e.id)
		);
	}
}

export default GraphEventHandler;