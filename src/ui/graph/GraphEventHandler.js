import NodulePanel from '../panels/NodulePanel';

class GraphEventHandler {
	constructor(graph) {
		this.graph_ = graph;
	}

	get graph() {
		return this.graph_;
	}

	onAddClick() {
		//console.log(selectNoduleFromFactory);

		const noduleFactoryName = this.graph.getSelectMenuValue();
		
		modular.create(noduleFactoryName);
		modular.Context.refreshUI();
	}

	onSubClick() {
		//console.log(this.selectedNodeId);		
	}

	onEditClick() {
		this.graph.editing = !this.graph.editing;
		d3.select('#edit-button').classed('editing', this.graph.editing);
	}

	onCircleClick(e) {
		//console.log(e);

		function patchOrUnpatch(fromNodule, toNodule) {
			if (modular.checkForPatch(fromNodule, toNodule)) {
				modular.unpatch(fromNodule, toNodule);
			} else {
				modular.patch(fromNodule, toNodule);
			}
		}

		// update internal state
		if (this.graph.selectedNodeId && this.graph.editing) {
			const fromNodule = this.graph.getController(this.graph.selectedNodeId).getNodule();
			const toNodule = this.graph.getController(e.id).getNodule();

			patchOrUnpatch(fromNodule, toNodule);

			this.graph.refresh();
		} else {

			this.graph.updateSelectedNodeId_(e.id);
		}

		NodulePanel.refresh(document.getElementById('panel'), this.graph.getController(e.id).getNodule());
	}
}

export default GraphEventHandler;