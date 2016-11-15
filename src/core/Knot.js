class Knot {
	get audioNode() {
		throw new Error('Knot is abstract');
	}

	connect(audioNode) {
		return this.audioNode.connect(audioNode);
	}
}

export default Knot;