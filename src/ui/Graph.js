const d3 = require('d3');

const DESTINATION_ID = '*';

class Graph {
	constructor({nodules, patches, uiElement}) {
		this.nodules = nodules;
		this.patches = patches;
		this.elementId = uiElement.id;
	}

	getCollectedGraphData() {
		const nodes = [];
		const links = [];

		let groupNo = 0;

		// add device destination node
		nodes.push({
			id: DESTINATION_ID,
			group: groupNo++
		});

		this.nodules.forEach((nodule) => {
			nodes.push({
				id: nodule.name,
				group: groupNo
			});
		});

		this.patches.forEach((patch) => {

			const target = patch.to !== null ? patch.to.name : DESTINATION_ID;

			links.push({
				source: patch.from.name,
				target,
				value: 1
			});
		});

		return {
			nodes,
			links
		};
	}

	refresh() {
		const elementId = this.elementId;
		const graph = this.getCollectedGraphData();

		console.log(graph);

		const radius = 60;

		const svg = d3.select("#" + elementId),
		    width = + svg.attr("width"),
		    height = + svg.attr("height");

		// first lets clear everything
		svg.html("");

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
		    	.attr("marker-end", "url(#arrowhead)");

	  	const node = svg.append("g")
		  	.attr("class", "nodes")
		    .selectAll("circle")
		    .data(graph.nodes)
		    .enter().append("g")
		    	.attr("width", 2*radius)
		    	.attr("height", 2*radius);

			node.append("circle")
					.attr("r", radius)
					.attr("fill", function(d) { 
						return color(d.group);
					})
					.call(d3.drag()
						.on("start", dragstarted)
						.on("drag", dragged)
						.on("end", dragended));

		    node.append("text")
		    	.text(function(d) { return d.id; })
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
		    .force("charge", d3.forceManyBody()
		    	.strength(-1000)
		    )
		    .force("center", d3.forceCenter(width / 2, height / 2));

		function ticked() {
			link
			    .attr("x1", function(d) { return d.source.x; })
			    .attr("y1", function(d) { return d.source.y; })
			    .attr("x2", function(d) { return d.target.x; })
			    .attr("y2", function(d) { return d.target.y; });

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
	}
}

export default Graph;