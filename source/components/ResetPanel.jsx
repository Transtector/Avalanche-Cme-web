/**
 * ResetPanel.jsx
 * james.brunner@smithsmicrowave.com
 *
 * Component to handle CME device resets
 */
 'use strict';

var React = require('react');

var Constants = require('../Constants');
var Actions = require('../Actions');

var InputGroup = require('./InputGroup');

var classNames = require('classnames');

var ResetPanel = React.createClass({

	getInitialState: function () {

		return { 
			recoveryMode: false,
			factoryReset: false,
			powerOff: false
		};
	},

	render: function() {

		return (
			<InputGroup title='Restart' id='settings-restart'>

				<div className='input-group-cluster no-border'>

					<div className='checkbox-wrapper'>
						<label htmlFor='recoveryMode'>		
							<input id='recoveryMode'
								type='checkbox'
								checked={this.state.recoveryMode}
								onChange={this._update} />
							Restart in Recovery Mode
						</label>
					</div>

					<div className='checkbox-wrapper'>
						<label htmlFor='factoryReset'>
							<input id='factoryReset'
								type='checkbox'
								checked={this.state.factoryReset}
								onChange={this._update} />
							Reset Configuration to Factory Defaults
						</label>
					</div>

					<div className='checkbox-wrapper'>
						<label htmlFor='powerOff'>
							<input id='powerOff'
								type='checkbox'
								checked={this.state.powerOff}
								onChange={this._update} />
							Power Down the CME Device
						</label>
					</div>

				</div>

				<div className="input-group-buttons">
					<button className='btn full-width' 
							onClick={this._restart}>Restart</button>
				</div>
			</InputGroup>
		);
	},

	_update: function(e) {
		var obj = {};
			obj[e.target.id] = e.target.checked;

		this.setState(obj);
	},

	_restart: function() {
		var msg = 'The CME device will be ' + (this.state.powerOff ? 'shut down' : 'restarted') + '.';
		msg += '\n\nOk to continue?\n\n';

		if (confirm(msg)){
			Actions.restart(this.state.powerOff, this.state.recoveryMode, this.state.factoryReset);
		}
	}
});

module.exports = ResetPanel;