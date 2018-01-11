const d3 = require('d3');

import DataGenerator from './DataGenerator';
import DataController from './DataController';
import GraphMenu from './GraphMenu';
import GraphEventHandler from './GraphEventHandler';

const RADIUS = 30;

class Graph {
  constructor({nodules, patches, container}) {

    // make read-only hook
    this.elementId = container.id;
    // make r/w hook
    this.editing_ =  false;

    this.svg_ = null;
    this.graphData_ = null;
    this.selectedNodeId_ = null;

    this.dataGenerator_ = new DataGenerator({nodules, patches});
    this.eventHandler_ = new GraphEventHandler(this);
    this.menu_ = new GraphMenu(this);
  }

  get eventHandler() {
    return this.eventHandler_;
  }

  get isEditing() {
    return this.editing_;
  }

  get isNodeSelected() {
    return this.selectedNodeId_ !== null;
  }

  get isDestinationSelected() {
    return this.getController(this.selectedNodeId).isDestination;
  }

  isDestinationNodeId(id) {
    return this.getController(id).isDestination;
  }

  set selectedNodeId(id) {
    this.selectedNodeId_ = id;
  }

  get selectedNodeId() {
    return this.selectedNodeId_;
  }

  setEditing(v) {
    this.editing_ = v;
  }

  getSelectMenuValue() {
    return d3.selectAll('#select-nodule > option')
      .nodes().filter(function(option) {
        return option.selected;
    })[0].value;
  }

  getSelectedNodule() {
    return this.getController(this.selectedNodeId).getNodule();
  }

  getNoduleByNodeId(id) {
    return this.getController(id).getNodule();
  }

  updateSelectedNodeId_(id) {
    if (this.selectedNodeId === id) {
      this.selectedNodeId = null;
    } else {
      this.selectedNodeId = id;
    }

    this.getAllCircles().selectAll('circle').classed('node-selected', false);
    this.getCircleById(id).select('circle').classed('node-selected', !!this.selectedNodeId);

    // propagate to controller
    if (this.selectedNodeId) {
      this.getController(id).handle(DataController.Events.CLICK);
    }
  }

  getCircleById(id) {
    // iterate over all graph nodes
    const circle = d3.select(this.svg_.selectAll('g.nodule').nodes().filter(function(elem) {
      console.log(elem.attributes['nodule-name'].value);
      return elem.attributes['nodule-name'].value ===  id;
    })[0]);
    return circle;
  }

  getAllCircles() {
    return this.svg_.selectAll('g.nodule');
  }

  getController(id) {
    const {graphData_} = this;
    return graphData_.controllers[id];
  }

  refreshMenu_() {
    const elementId = this.elementId;
    const menu = d3.select('#' + elementId + '> .menu');
    if (menu.node().innerHTML.length === 0) {
      this.menu_.refresh();
    }
  }

  refresh() {

    this.refreshMenu_();

    this.dataGenerator_.run();

    const radius = RADIUS;
    const elementId = this.elementId;
    const graph = this.graphData_ = this.dataGenerator_.get();

    const svg = this.svg_ = d3.select("#" + elementId + '>div>svg');
    const width = + svg.attr("width");
    const height = + svg.attr("height");

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
          .attr("class", "nodule")
          .on("click", this.eventHandler.onNodeClick.bind(this.eventHandler))
          .attr('nodule-name', function(d) { return d.id; })
          .attr("width", 2 * radius)
          .attr("height", 2 * radius);

      node.append("circle")
        .attr("r", radius)
        .classed('node-is-destination', function(d) { return d.group === 0; })
        .call(d3.drag()
          .on("start", onDragStarted)
          .on("drag", onDragged)
          .on("end", onDragEnded));

        node.append("text")
          .text(function(d) { return d.id.toUpperCase(); })
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