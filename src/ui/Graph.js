const d3 = window.d3 = require('d3');

const DESTINATION_ID = '*';

const Events = {
	CLICK: "click",
	DRAGSTARTED: "dragstarted",
	DRAGENDED: "dragended"
}

import Context from '../core/Context';

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
	}

	getCollectedGraphData() {
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
		menu.append('button')
			.style('margin-left', '1em')
			.style('font-size', '2em')
			.html('Add nodule')
			.on('click', Graph.onAddNoduleClick);
	}

	static onAddNoduleClick(e) {
		//console.log(selectNoduleFromFactory);

		var nodule;

		nodule = d3.selectAll('#select-nodule > option').nodes().filter(function(option) {
			return option.selected;
		})[0].value;
		
		modular.create(nodule);
		modular.Context.refreshUI();
	}

	refresh() {
		const elementId = this.elementId;
		const graph = this.getCollectedGraphData();

		console.log(graph);

		const radius = 30;

		const menu = d3.select('#' + elementId + '>.menu');

		if (menu.node().innerHTML.length === 0) {
			this.setupMenu();
		}

		const svg = d3.select("#" + elementId + '>div>svg'),
		    width = + svg.attr("width"),
		    height = + svg.attr("height");

		// first lets clear everything
		svg.html("");

		svg.style("background-color", "#004358");

		svg.append("defs").append("marker")
		    .attr("id", "arrowhead")
		    .attr("refX", radius) /*must be smarter way to calculate shift*/
		    .attr("refY", 2)
		    .attr("markerWidth", 12)
		    .attr("markerHeight", 8)
		    .attr("orient", "auto")
		    .append("path")
		        .attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead

		const color = d3.scaleOrdinal(d3.schemeCategory20);

	  	const link = svg.append("g")
		    .attr("class", "links")
			.selectAll("line")
			.data(graph.links)
			.enter().append("line")
		    	.attr("stroke-width", 2)
		    	//.attr("stroke", "#BEDB39")
		    	.attr("marker-end", "url(#arrowhead)");

	  	const halo = svg.append("g")
		    .attr("class", "links")
			.selectAll("line")
			.data(graph.halos)
			.enter().append("line")
				.style("stroke-dasharray", ("3, 3"))
		    	.attr("stroke-width", 2)
		    	//.attr("stroke", "red")
		    	.attr("marker-end", "url(#arrowhead)");

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
					.attr("fill", function(d) { 
						//return color(d.group);
						if (d.group === 0) {
							return "#FD7400";		
						} else {
							return "#FFE11A";
						}
					})
					.attr('nodule-name', function(d) { return d.id; })
					.on("click", onCircleClick)
					.call(d3.drag()
						.on("start", dragstarted)
						.on("drag", dragged)
						.on("end", dragended));

		    node.append("text")
		    	.text(function(d) { return d.id; })
		    		.attr('nodule-name', function(d) { return d.id; })
					.attr("text-anchor", "middle")
					.attr("stroke", "#000")
					.attr("font-size", "1em")
					.attr("font-family", "Helvetica")
					.attr("dy", ".3em")
					.attr("x", "50%")
					.attr("y", "50%");

		const simulation = d3.forceSimulation()
		    .nodes(graph.nodes)
		    .on("tick", ticked)
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

		function ticked() {

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

		function dragstarted(d) {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		function dragended(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}

		function onCircleClick(e) {
			console.log(e);

			const circles = svg.selectAll('circle');

			const circle = d3.select(svg.selectAll('circle').nodes().filter(function(elem) {
				console.log(elem.attributes['nodule-name'].value);
				return elem.attributes['nodule-name'].value ===  e.id;
			})[0]);

			circles.classed('node-selected', false);
			circle.classed('node-selected', true);

			getController(e).handle(Events.CLICK);
		}

		function getController(obj) {
			return graph.controllers[obj.id];
		}
	}
}

export default Graph;