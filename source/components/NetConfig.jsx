/**
 * NetConfig.jsx
 * james.brunner@kaelus.com
 *
 * Component to group the Cme network configuration.
 */
'use strict';

var React = require('react');

var Actions = require('../Actions');

var InputGroup = require('./InputGroup');
var TextInput = require('./TextInput');

var NetConfig = React.createClass({

	getInitialState: function() {
		return this.props.config;
	},

	render: function() {
		var changesPending = Object.keys(this.props.config).some(function(key) {
			return this.props.config[key] !== this.state[key];
		}, this);

		return (
			<InputGroup title="Network" ref="_InputGroup">
				<TextInput id="mac" name="MAC" defaultValue={this.state.mac} />

				<div className="input-group-cluster">
					<label htmlFor="dhcp">DHCP</label>
					<input
						type="checkbox"
						name="dhcp"
						id="dhcp"
						placeholder="DHCP"
						checked={this.state.dhcp}
						onChange={this._requestChange}
					/>
				</div>

				<TextInput id="address" name="IP address" 
					defaultValue={this.state.address} onBlur={this._requestChange} disabled={this.state.dhcp} />
				<TextInput id="netmask" name="Subnet mask" 
					defaultValue={this.state.netmask} onBlur={this._requestChange} disabled={this.state.dhcp} />
				<TextInput id="gateway" name="Gateway" 
					defaultValue={this.state.gateway} onBlur={this._requestChange} disabled={this.state.dhcp} />
				<TextInput id="primary"	name="Primary DNS" 
					defaultValue={this.state.primary} onBlur={this._requestChange} disabled={this.state.dhcp} />
				<TextInput id="secondary" name="Secondary DNS" className='no-border' 
					defaultValue={this.state.secondary} onBlur={this._requestChange} disabled={this.state.dhcp} />

				<div className="input-group-buttons">
					<button className='btn' 
							onClick={this._onReset}
							disabled={!changesPending}>Reset</button>
					<button className='btn' 
							onClick={this._onApply}
							disabled={!changesPending}>Apply</button>
				</div>
			</InputGroup>
		);
	},

	_onReset: function() {

		this.setState(this.props.config);
	},

	_onApply: function() {
		Actions.config({ network: this.state });
		this.refs['_InputGroup'].collapse();
	},

	_requestChange: function(event) {
		var obj = {},
			key = event.target.name,
			value = (key === 'dhcp') 
				? event.target.checked 
				: event.target.value;

		obj[key] = value;

		// reset net addresses if DHCP checked
		if (key === 'dhcp' && obj[key]) {
			var netState = this.props.config;

			obj.address = netState.address;
			obj.netmask = netState.netmask;
			obj.gateway = netState.gateway;
			obj.primary = netState.primary;
			obj.secondary = netState.secondary;
		} 

		this.setState(obj);
	}
});

module.exports = NetConfig;