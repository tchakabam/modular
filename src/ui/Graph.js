import Context from '../core/Context';
const d3 = require('d3');

const DESTINATION_ID = '*';

const Events = {
	CLICK: "click",
	DRAGSTARTED: "drag-started",
	DRAGENDED: "drag-ended"
}

class Controller {

	constructor(model) {
		// TODO: detect / verify expectations of some-sort of model interface !

		this.model_ = model;
	}

	get model() {
		return this.model_;
	}

	handle(eventType) {
		switch(eventType) {
		case Events.CLICK:
			if (typeof this.model.debug === 'function') {
				this.model.debug();	
			} else {
				console.error('no debug function found in model!');
			}
			break;
		}
	}
}

class Graph {
	constructor({nodules, patches, uiElement}) {
		this.nodules = nodules;
		this.patches = patches;
		this.elementId = uiElement.id;
		this.collectedGraphData = null;
		this.svg = null;
		this.selectedNodeId_ = null;
		this.editing =  false;
	}

	set selectedNodeId(id) {
		this.selectedNodeId_ = id;
	}

	get selectedNodeId() {
		return this.selectedNodeId_;
	}

	generateCollectedGraphData() {
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
		controllers[DESTINATION_ID] = new Controller({
			debug: () => {
				console.debug(Context.getOrCreateDefaultAudioContext().destination);
			}
		});

		const linkedNodes = [];
		function insertIntoLinkedNodesOnce(name) {
			if (linkedNodes.indexOf(name) >= 0) { 
				linkedNodes.push(name); 
			}
		};

		const unlinkedNodes = [];
		this.nodules.forEach((nodule) => { unlinkedNodes.push(nodule.name) });

		function spliceUnlinkedNodesByName(name) {
			let index = unlinkedNodes.indexOf(name);
			if (index >= 0) {
				unlinkedNodes.splice(index, 1);
			}
		};

		this.nodules.forEach((nodule) => {
			nodes.push({
				id: nodule.name,
				group: groupNo
			});
			controllers[nodule.name] = new Controller(nodule);
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

			spliceUnlinkedNodesByName(source);
			spliceUnlinkedNodesByName(target);
		});

		unlinkedNodes.forEach((nodeName) => {

			halos.push({
				source: nodeName,
				target: DESTINATION_ID,
				value: 1
			});
		});

		return {
			linkedNodes,
			unlinkedNodes,
			halos,
			nodes,
			links,
			controllers
		};
	}

	// TODO: own class for Menu
	setupMenu() {
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
			.on('click', this.onAddClick.bind(this));

		// - button 
		menu.append('button')
			.style('margin-left', '1em')
			.style('font-size', '2em')
			.html('(-)')
			.on('click', this.onSubClick.bind(this));	

		// edit button 
		menu.append('button')
			.style('margin-left', '1em')
			.style('font-size', '2em')
			.html('(edit)')
			.attr('id', 'edit-button')
			.on('click', this.onEditClick.bind(this));		
	}

	getSelectMenuValue() {
		return d3.selectAll('#select-nodule > option')
			.nodes().filter(function(option) {
				return option.selected;
		})[0].value;
	}

	onAddClick() {
		//console.log(selectNoduleFromFactory);

		const noduleFactoryName = this.getSelectMenuValue();
		
		modular.create(noduleFactoryName);
		modular.Context.refreshUI();
	}

	onSubClick() {

		//console.log(this.selectedNodeId);

		
	}

	onEditClick() {
		this.editing = !this.editing;
		d3.select('#edit-button').classed('editing', this.editing);
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
		if (this.selectedNodeId && this.editing) {
			const fromNodule = this.getController(this.selectedNodeId).model;
			const toNodule = this.getController(e.id).model;

			patchOrUnpatch(fromNodule, toNodule);

			this.refresh();
			return;
		}

		if (this.selectedNodeId === e.id) {
			this.selectedNodeId = null;
		} else {
			this.selectedNodeId = e.id;
		}

		// update styles
		this.getAllD3Circles().classed('node-selected', false);
		this.getD3CircleById(e.id).classed('node-selected', !!this.selectedNodeId);

		// propagate to controller
		if (this.selectedNodeId) {
			this.getController(e).handle(Events.CLICK);
		}
	}

	getD3CircleById(id) {
		const circle = d3.select(this.svg.selectAll('circle').nodes().filter(function(elem) {
			console.log(elem.attributes['nodule-name'].value);
			return elem.attributes['nodule-name'].value ===  id;
		})[0]);
		return circle;
	}

	getAllD3Circles() {
		return this.svg.selectAll('circle');
	}

	getController(obj) {
		const {collectedGraphData} = this;
		return collectedGraphData.controllers[obj.id || obj];
	}

	refresh() {
		const radius = 30;
		const elementId = this.elementId;
		const graph = this.collectedGraphData = this.generateCollectedGraphData();

		console.log(graph);

		const menu = d3.select('#' + elementId + '>.menu');

		if (menu.node().innerHTML.length === 0) {
			this.setupMenu();
		}

		const svg = this.svg = d3.select("#" + elementId + '>div>svg'),
		    width = + svg.attr("width"),
		    height = + svg.attr("height");

		// first lets clear everything
	 	svg.html("");

		// defs
		svg.append("defs").append("marker")
		    .attr("id", "arrowhead")
		    .attr("refX", radius) /*must be smarter way to calculate shift*/
		    .attr("refY", 2)
		    .attr("markerWidth", 12)
		    .attr("markerHeight", 8)
		    .attr("orient", "auto")
		    .append("path")
		        .attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead

		// ???
		//const color = d3.scaleOrdinal(d3.schemeCategory20);

		// links
	  	const link = svg.append("g")
		    .attr("class", "links")
			.selectAll("line")
			.data(graph.links)
			.enter().append("line")
		    	.attr("stroke-width", 2)
		    	//.attr("stroke", "#BEDB39")
		    	.attr("marker-end", "url(#arrowhead)");

		// halo-links
	  	const halo = svg.append("g")
		    .attr("class", "links")
			.selectAll("line")
			.data(graph.halos)
			.enter().append("line")
				.style("stroke-dasharray", ("3, 3"))
		    	.attr("stroke-width", 2)
		    	//.attr("stroke", "red")
		    	.attr("marker-end", "url(#arrowhead)");

		// labels
	  	const label = svg.append("g")
		    .attr("class", "labels")
			.selectAll("text")
			.data(graph.links)
			.enter().append("text")
	    		.text(function(d) { return d.knobName || '+'; })
	    		.attr("text-anchor", "middle")
	    		.attr("y", "50%")
	    		.attr("x", "50%")
	    		.attr("dy", ".3em")
	    		.attr("font-family", "Helvetica")
	    		.attr("font-size", "15px")
	    		.attr("stroke", "#000");

	    // nodes -> circles + text
	  	const node = svg.append("g")
		  	.attr("class", "nodes")
		    .selectAll("circle")
		    .data(graph.nodes)
		    .enter().append("g")
		    	.attr('nodule-name', function(d) { return d.id; })
		    	.attr("width", 2*radius)
		    	.attr("height", 2*radius);

			node.append("circle")
					.attr("r", radius)
					.classed('node-is-destination', function(d) { return d.group === 0; })
					.attr('nodule-name', function(d) { return d.id; })
					.on("click", this.onCircleClick.bind(this))
					.call(d3.drag()
						.on("start", onDragStarted)
						.on("drag", onDragged)
						.on("end", onDragEnded));

		    node.append("text")
		    	.text(function(d) { return d.id.toUpperCase(); })
		    		.attr('nodule-name', function(d) { return d.id; })
					.attr("text-anchor", "middle")
					.attr("stroke", "#000")
					.attr("font-size", "1em")
					.attr("font-family", "Helvetica")
					.attr("dy", ".3em")
					.attr("x", "50%")
					.attr("y", "50%");

		// Force-simulation ...
		const simulation = d3.forceSimulation()
		    .nodes(graph.nodes)
		    .on("tick", onForceSimulationTick)
		    .force("link", d3.forceLink()
		    	.id(function(d) { return d.id; })
		    	.distance(3*radius)
		    	.links(graph.links)
		    )
		    .force("halo", d3.forceLink()
		    	.id(function(d) { return d.id; })
		    	.distance(0.5*radius)
		    	.links(graph.halos)
		    )
		    .force("charge", d3.forceManyBody()
		    	.strength(-3000)
		    )
			.force("collision", d3.forceCollide(2*radius))
		    .force("center", d3.forceCenter(width / 2, height / 2));

		function onForceSimulationTick() {

			link
			    .attr("x1", function(d) { return d.source.x; })
			    .attr("y1", function(d) { return d.source.y; })
			    .attr("x2", function(d) { return d.target.x; })
			    .attr("y2", function(d) { return d.target.y; });

			halo
			    .attr("x1", function(d) { return d.source.x; })
			    .attr("y1", function(d) { return d.source.y; })
			    .attr("x2", function(d) { return d.target.x; })
			    .attr("y2", function(d) { return d.target.y; });

			label
			    .attr("x", function(d) { return d.source.x + (d.target.x - d.source.x) / 2 })
			    .attr("y", function(d) { return d.source.y + (d.target.y - d.source.y) / 2 });

			node
				.selectAll("circle")
				    .attr("cx", function(d) { return d.x; })
				    .attr("cy", function(d) { return d.y; });

			node
				.selectAll("text")
				    .attr("x", function(d) { return d.x; })
				    .attr("y", function(d) { return d.y; });
		}

		function onDragStarted(d) {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function onDragged(d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		function onDragEnded(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}
	}
}

export default Graph;