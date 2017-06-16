const React = require('react');

import Panel from '../Panel';
import Component from '../Component';

class KnobPanel extends Panel {

	constructor(props) {
		super(props);
		this.state = {
			keyboardValue: this.props.data.knob.value
		};
	}

	onChangeSlider(e) {
		this.tryUpdate(e);
	}

	onChangeKeyboard(e) {
		this.tryUpdate(e);
	}

	tryUpdate(e) {
		this.setState({
			keyboardValue: e.target.value
		});
		const value = parseFloat(e.target.value);
		if (!isNaN(value)) {
			this.props.data.knob.value = value;
		}
		this.forceUpdate();
	}

	render() {
		const {id, value, min, max, step} = this.props.data.knob;
		return (
			<div>
				<label>Knob: {id}</label>
				<input onChange={this.onChangeSlider.bind(this)} step={step} value={value} min={min} max={max} type="range"></input>
				<span>{value}</span>
				<input type="text" onChange={this.onChangeKeyboard.bind(this)} value={this.state.keyboardValue} ></input>
			</div>
		);
	}

	static refresh(container, knob) {
		Component.renderDOM(
			Component.create(KnobPanel, {
				data: {knob}
			}, null),
			container
		);
	}
}

export default KnobPanel;