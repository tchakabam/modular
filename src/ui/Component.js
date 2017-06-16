const React = require('react');
const ReactDOM = require('react-dom');

class Component extends React.Component {
	render() {
		throw new Error('modular.ui.Component is abstract');
	}

	static get renderDOM() {
		return ReactDOM.render;
	}

	static get create() {
		return React.createElement;
	}

	static refresh(container, props) {
		Component.renderDOM(
			Component.create(<Component />, props, null), 
			container
		);
	}
}

export default Component;