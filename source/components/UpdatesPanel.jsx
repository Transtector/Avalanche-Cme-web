/**
 * UpdatePanel.jsx
 * james.brunner@kaelus.com
 *
 * Handles software/firmware updates
 */
 'use strict';

var React = require('react');

var Constants = require('../Constants');
var Actions = require('../Actions');
var Store = require('../Store');

var InputGroup = require('./InputGroup');
var TextInput = require('./TextInput');
var DropTarget = require('./DropTarget');

var moment = require('moment');
var classNames = require('classnames');

var UpdatesPanel = React.createClass({

	_pollTimeout: null,
	_pollStartTime: 0,
	
	propTypes: {
		pollPeriod: React.PropTypes.number // how fast to poll in milliseconds
	},

	getDefaultProps: function() {
		return {
			pollPeriod: 10000
		}
	},
	
	getInitialState: function () {

		return { 
			updates: Store.getState().updates,
			progress: null,
			install: [],
			installing: false
		 };
	},

	componentDidMount: function() {
		Store.addChangeListener(Constants.UPDATES, this._onUpdatesChange);
		//this._startPoll();
	},

	componentWillUnmount: function() {
		this._stopPoll();
		Store.removeChangeListener(Constants.UPDATES, this._onUpdatesChange);
	},	

	render: function() {
		
		var screenClass = classNames('screen', {
			active: this.state.installing
		});

		return (
			<InputGroup title="Update" 
				onExpand={this._startPoll} 
				onCollapse={this._stopPoll}>

				{
					this.state.updates.pending.length
						? this._renderPendingUpdates()
						: this._renderAvailableUpdates()
				}

				{this._renderUpdateButtons()}

				<div className={screenClass}>&nbsp;</div>

			</InputGroup>
		);
	},

	_renderUpdateItem: function(index, source, file) {

		var item = {
			source: source,
			file: file
		}
		
		var pendingInstall = this.state.install.some(function (pending_item) {
			return pending_item.source == item.source && pending_item.file == item.file;
		});

		var key = source + '_' + index + '_' + file;

		return (
			<label key={key} htmlFor={key}>
				<input type="checkbox"
						id={key} name={source} value={file}
						onChange={this._selectUpdate}
						checked={pendingInstall} />
				{file}
			</label>
		);
	},

	_renderAvailableUpdates: function() {
		return (
			<div className='input-group-cluster no-border'>

				<label htmlFor='updates-list-usb'>External USB drive</label>
				<div id="updates-list-usb" className="radio-group">
					{this.state.updates.usb.length > 0
						? this.state.updates.usb.map(function(update, i) {
							return this._renderUpdateItem(i, 'usb', update);
						}, this)
						: <p>Nothing found</p>
					}
				</div>

				<label htmlFor='updates-list-web'>From the web</label>
				<div id="updates-list-web" className="radio-group">
					{this.state.updates.web.length > 0
						? this.state.updates.web.map(function(update, i) {
							return this._renderUpdateItem(i + 100, 'web', update);
						}, this)
						: <p>Nothing found</p>
					}
				</div>
						
				<label htmlFor='updates-list-uploaded'>Uploaded</label>
				<div id="updates-list-uploaded" className="radio-group">
					{this.state.updates.uploads.map(function(update, i) {
						return this._renderUpdateItem(i + 200, 'upload', update);
					}, this)}
				</div>

				{this._renderUploadWidget()}

			</div>
		);
	},

	_renderUploadWidget: function() {
		var progressClass = classNames({ 'active': this.state.progress });
		var progressVal = this.state.progress && (100 * (this.state.progress.value / this.state.progress.max));

		return (
			<div className='upload-widget'>
				<DropTarget onDrop={this._uploadFile}>
					<h1>Drag and drop or click here</h1>
					<h2>to upload an update (max 500 MiB)</h2>
				</DropTarget>

				 <progress className={progressClass} max="100" value={progressVal}>
					{/* Browsers that support HTML5 progress element will ignore the html
						inside `progress` element. Whereas older browsers will ignore the
						`progress` element and instead render the html inside it. */}
					<div className="progress-bar">
						<span style={{ width: progressVal + '%' }}>{progressVal}%</span>
					</div>
				</progress>
			</div>
		);
	},

	_renderPendingUpdates: function() {
		return (
			<div className='input-group-cluster no-border'>
				<label>These updates are ready</label>
				<ul className='pending-update'>
					{
						this.state.updates.pending.map(function(p, i){
							return <li key={i}>{p}</li>
						})
					}
				</ul>
				<p>These updates will be installed upon restarting the device. 
					Click Restart to proceed or Cancel to remove these updates.</p>
			</div>
		);
	},

	_renderUpdateButtons: function() {
		var pending = this.state.updates.pending || []; // list of pending update files

		if (pending.length > 0) {
			return (
				<div className="input-group-buttons">
					<button className='btn' 
							onClick={this._onCancel}>Cancel</button>

					<button className='btn' 
							onClick={this._onRestart}>Restart</button>
				</div>
			);
		} else {
			return (
				<div className="input-group-buttons">
					<button className='btn full-width' 
							onClick={this._onInstall}
							disabled={!this.state.install.length || this.state.installing}>Install</button>
				</div>
			);				
		}
	},

	_onUpdatesChange: function () {
		var _this = this,
			_newUpdates = Store.getState().updates,
			_newInstalling = this.state.installing && !_newUpdates.pending.length;

		// only setState if updates has changed...
		if (JSON.stringify(_newUpdates) == JSON.stringify(this.state.updates)) return;

		this.setState({ updates: _newUpdates, installing: _newInstalling }, function () {
			// Keep polling if we don't have pending update
			if (_this.state.updates.pending.length == 0  && _this._pollStartTime) {

				var age = moment().valueOf() - this._pollStartTime,
					period = (age >= _this.props.pollPeriod)
						? 0
						: _this.props.pollPeriod - (age % _this.props.pollPeriod)

				clearTimeout(_this._pollTimeout);
				_this._pollTimeout = null;
				_this._pollTimeout = setTimeout(_this._startPoll, period);
			}
		});
	},

	_startPoll: function () {
		this._pollStartTime = moment().valueOf();
		Actions.getUpdates();
	},

	_stopPoll: function () {
		this._pollStartTime = 0;
		clearTimeout(this._pollTimeout);
		this._pollTimeout = null;
	},

	_selectUpdate: function(e) {

		var items = this.state.install.slice(0),
			item = { source: e.target.name, file: e.target.value };

		if (e.target.checked) {
			// add the item to the install array
			items.push(item);

		} else {

			// remove the item from the install array
			var index = items.findIndex(function(install_item) {
				return install_item.source == item.source && install_item.file == item.file;
			});
			if (index > -1) {
				items.splice(index, 1);
			}
		}

		this.setState({ install: items });
	},

	_onCancel: function() {

		if (confirm("The pending updates will be removed.\n\nOk to continue?\n\n")) {
			Actions.deleteUpdate();
		}
	},

	_onRestart: function() {
		if (confirm("You will be logged out and device will restart.\n\nOk to continue?\n\n")) {
			Actions.restart();
		}
	},

	_uploadFile: function(files) {

		// 	Using simple validation here:
		// 		only a single file (first is chosen)
		// 		name must match pattern: '1500-???-v*-SWARE-CME.tgz'
		//		max size 500 MB (500*1024*1024)

		// Semver matching regex
		var re = /1500\-[0-9]{3}\-v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?-SWARE\-CME_.+\.pkg\.tgz/ig
		
		var max_size = 500 * 1024 * 1024; // 500 MiB (also checked on server)
				
		if (!files) return;

		// get the DOM form element and it's file input
		var formData = new FormData();

		// Fire an error message if any of these:
		// Note: files is a FileList not an array
		var err = '';
		for (var i = 0; i < files.length; i++) {
			if (err) break;

			if (!files[i].name.match(re)) {
				err = 'Invalid system update or update not supported on this platform.';
				break;
			}

			if (files[i].size > max_size) {
				err = 'File exceeds maximum size.';
				break;
			}

			// no errors - add to formData
			formData.append('files[]', files[i], files[i].name);
		}

		// if errors - just alert them and return
		if (err) {
			Actions.injectError(err);
			return;
		}

		// create a progress handler then do the upload
		var self = this;
		function onProgress(e) {
			if (e.lengthComputable) {
				self.setState({ progress: { value: e.loaded, max: e.total }});
			}
		}

		function onComplete() {
			// pause for effect...
			setTimeout(function () { self.setState({ progress: null })}, 1000);
		}

		Actions.uploadUpdate(formData, onProgress, onComplete);
	},

	_onInstall: function() {
		if (this.state.install.length == 0) return;

		this.setState({ installing: true });

		this.state.install.forEach(function(item) {
			Actions.installUpdate(item.source, item.file);
		});
	}
});

module.exports = UpdatesPanel;