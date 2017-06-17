const React = require('react');

import Panel from '../Panel';
import Component from '../Component';
import KnobPanel from './KnobPanel';

class NodulePanel extends Panel {

	constructor() {
		super();
		this.state = {
			selectedKnob: null,
			selectedKnobName: null,
		};
	}

	onClickTargetButton(data, e) {
		let {knob, name} = data;

		if (this.state.selectedKnob === knob) {
			knob = null;
			name = null;
		}

		this.setState({
			selectedKnob: knob,
			selectedKnobName: name
		});
	}

	render() {
		const name = this.props.data.nodule.name;
		const knobs = this.props.data.nodule.getKnobs();
		const params = this.props.data.nodule.getParams();
		return (
			<div>
				<label>Nodule name: {name}</label>
				<ul>
				{knobs.map((el, i) =>
				    (
				    <li key={el[0]} className="param">
				    	<div>
					    	<p>
					    		<label>Parameter: {params[i]}</label>
					    		<span>&nbsp;</span>
					    		<button style={{backgroundColor: (this.state.selectedKnob === el[1]) ? 'red' : 'blue'}} onClick={this.onClickTargetButton.bind(this, {knob: el[1], name: el[0]})}>(target)</button>
					    	</p>
					    	<KnobPanel data={{knob: el[1]}} />
				    	</div>
				    </li>
				    )
				)}
				</ul>
			</div>
		);
	}

	static refresh(container, nodule) {
		return Component.renderDOM(
			Component.create(NodulePanel, {
				data: {nodule}
			}, null),
			container
		);
	}
}

export default NodulePanel;