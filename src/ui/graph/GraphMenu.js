const d3 = require('d3');

import Factory from '../../core/Factory';

class GraphMenu {
	constructor(graph) {
		this.elementId = graph.elementId;
		this.graph = graph;
	}

	// TODO: own class for Menu
	refresh() {
		const elementId = this.elementId;
		const menu = d3.select('#' + elementId + '>.menu');
		const selectNoduleFromFactory = menu.append('select')
			.attr('id', 'select-nodule')
			.style('font-size', '2em');
			//.style('position', 'relative')
			//.style('top', '50%')
			//.style('left', '50%');
		const Factory = modular.Factory;
		const allNodules = Factory.collectType(Factory.Types.NODULE).names;
		allNodules.forEach((noduleFactoryName) => {
			const option = selectNoduleFromFactory.append('option')
				.html(noduleFactoryName)
				.attr('value', noduleFactoryName);
			console.log(option);
		});

		// + button
		menu.append('button')
			.style('margin-left', '1em')
			.style('font-size', '2em')
			.html('(+)')
			.on('click', this.graph.eventHandler.onAddClick.bind(this.graph.eventHandler));

		// - button 
		menu.append('button')
			.style('margin-left', '1em')
			.style('font-size', '2em')
			.html('(-)')
			.on('click', this.graph.eventHandler.onSubClick.bind(this.graph.eventHandler));	

		// edit button 
		menu.append('button')
			.style('margin-left', '1em')
			.style('font-size', '2em')
			.html('(edit)')
			.attr('id', 'edit-button')
			.on('click', this.graph.eventHandler.onEditClick.bind(this.graph.eventHandler));		
	}
}

export default GraphMenu;