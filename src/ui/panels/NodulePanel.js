const React = require('react');

import Panel from '../Panel';
import Component from '../Component';
import KnobPanel from './KnobPanel';

class NodulePanel extends Panel {

	render() {
		const label = this.props.data.nodule.name;
		const knobs = this.props.data.nodule.getKnobs();
		return (
			<div>
				<label>{label}</label>
				{Array.from(knobs).map((el) =>
				    (<div key={el[0]}>
				    	<label>{el[1].id}</label>
				    	<KnobPanel data={{knob: el[1]}} />
				    </div>)
				)}
			</div>
		);
	}

	static refresh(container, nodule) {
		Component.renderDOM(
			Component.create(NodulePanel, {
				data: {nodule}
			}, null),
			container
		);
	}
}

export default NodulePanel;