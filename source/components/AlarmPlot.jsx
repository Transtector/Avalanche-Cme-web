/**
 * AlarmPlot.jsx
 * james.brunner@kaelus.com
 *
 * Flot plot component wrapper for alarm detail waveform plots.
 */
'use strict';

var React = require('react');

var classNames = require('classnames');

// Date/time/duration calculations and formatting
var moment = require('moment');
require('moment-duration-format');

var flot = require('../flot/jquery.flot');
require('../flot/jquery.flot.resize');

var	PLOT_COLORS = {
	'VA': '#ff0000',
	'VB': '#00ff00',
	'VC': '#0000ff',
	'PIB': '#ffd42a',
	'GRID': '#cacaca',
	'FILL': 0.1
}

var AlarmPlot = React.createClass({

	propTypes: {
		id: React.PropTypes.string.isRequired,
		alarm: React.PropTypes.object.isRequired,
		tab: React.PropTypes.number.isRequired,
		zone: React.PropTypes.number.isRequired,
		onZoneChange: React.PropTypes.func.isRequired
	},

	getInitialState: function() {
		var _this = this,
			id = this.props.id;

		function beforePrint() {
			_this._updatePlot(true);
		}

		function afterPrint() {
			_this._updatePlot(true);
		}

		if (window.matchMedia) {
			var mediaQueryList = window.matchMedia('print');
			mediaQueryList.addListener(function (mql) {
				(mql.matches) ? beforePrint() : afterPrint();
			});
		} else {
			// basically a fallback for < IE11
			window.addEventListener('beforeprint', beforePrint, false);
			window.addEventListener('afterprint', afterPrint, false);
		}

		return {

			tabTraces: { // for each tab, active trace indices
				0: [ 0, 1, 2, 3 ], // Source/Utility; Vab, Vbc, Vca, PI
				1: [ 0, 1, 2, 3 ], // Power Cond; Va, Vb, Vc, PI
				2: [ 0, 1, 2 ] // Power Cond; Ia, Ib, Ic
			},

			plotOptions: {
				yaxes: [ {}, { 
					alignTicksWithAxis: 1,
					position: 'right',
					min: 0,
					max: 10
				}],
				grid: {
					margin: 2,
					backgroundColor: { colors: [ "#fff", "#eee" ] },
					color: PLOT_COLORS['GRID']
				}
			}
		}
	},

	render: function() {

		var plotWrapperClass_start = classNames('plot-wrapper start', { 'active': !this.props.zone, 'single-axis': this.props.tab == 2 }),
			plotWrapperClass_end = classNames('plot-wrapper end', { 'active': !!this.props.zone, 'single-axis': this.props.tab == 2 }),
			carousel_start = classNames({ 'active': !this.props.zone }),
			carousel_end = classNames({ 'active': !!this.props.zone });

		// Set some DOM element Id's based on the parent Alarm Detail Table id (passed in on a prop)
		var plotStart_id = this.props.id + '_0',
			plotEnd_id = this.props.id + '_1',
			plotStartAlert_id = this.props.id + '_alert_0',
			plotEndAlert_id = this.props.id + '_alert_1';

		return (
			<div id={this.props.id} className='plot-tab-content'>

				{
					this._renderLegend()
				}

				<div className={plotWrapperClass_start}>
					<div className='plot start' id={plotStart_id} ref={this._attachPlot}></div>
					<div className='alert screen' id={plotStartAlert_id} ref={this._attachAlert}>START</div>
				</div>

				<div className={plotWrapperClass_end}>
					<div className='plot end' id={plotEnd_id} ref={this._attachPlot}></div>
					<div className='alert screen' id={plotEndAlert_id} ref={this._attachAlert}>END</div>
				</div>

				<div className='carousel-handle'>
					<button title='Show event start' id='zone_0' className={carousel_start} onClick={this.props.onZoneChange}/>
					<button title='Show event end' id='zone_1' className={carousel_end} onClick={this.props.onZoneChange} />
				</div>

				{ 
					!this[plotStart_id] || !this[plotEnd_id] && <div className='loaderWrapper'><div className='loader'>Loading...</div></div>
				}

				<div className='x-axis-label'>Time To Alarm (ms) 
					
					<span className={carousel_start}>
						<span className='strong'>Alarm Start: </span>
						<span> {moment(this.props.alarm.start_ms).format("h:mm:ss.SSS a")}</span>
					</span>

					<span className={carousel_end}>
						<span className='strong'>Alarm End: </span>
						<span>{moment(this.props.alarm.end_ms).format("h:mm:ss.SSS a")}</span>
					</span>
				</div>
				
				<div className='y-axis-label left'>
					{ 
						this.props.tab !== 2 
							? 'Phase Voltage (V)' 
							: 'Phase Current (A)' 
					}
				</div>
				
				{ 
					this.props.tab !== 2 
						? <div className='y-axis-label right'>Phase Imbalance (%)</div> 
						: null 
				}
			</div>
		);
	},

	componentDidUpdate: function(prevProps, prevState) {

		// pop the start/end alerts if the zone has changed
		if (prevProps.zone !== this.props.zone) {
			this._showAlert();
		}
		this._updatePlot();
	},

	_renderLegend: function() {
		var tab = this.props.tab,
			trace0, trace1, trace2, trace3,
			cls0 = classNames('tr_0', { active: this._isActiveTrace(0) }),
			cls1 = classNames('tr_1', { active: this._isActiveTrace(1) }),
			cls2 = classNames('tr_2', { active: this._isActiveTrace(2) }),
			cls3 = classNames('tr_3', { active: this._isActiveTrace(3) });


		switch (tab) {

			case 1: // Power Conditioner Voltages - WYE connected
				trace0 = 'Va';
				trace1 = 'Vb';
				trace2 = 'Vc';
				trace3 = 'Phs. Imb.';
				break;

			case 2: // Power Conditioner Currents (no Phase Imbalance)
				trace0 = 'Ia';
				trace1 = 'Ib';
				trace2 = 'Ic';
				break;

			default: // Source/Utility Voltages - DELTA connected
				trace0 = 'Vab';
				trace1 = 'Vbc';
				trace2 = 'Vca';
				trace3 = 'Phs. Imb.';
		}

		return (
			<table className='legend'><tbody>
				<tr>
					<td><button id='tr_0' className={cls0} onClick={this._toggleTrace}>{trace0}</button></td>
					<td><button id='tr_1' className={cls1} onClick={this._toggleTrace}>{trace1}</button></td>
					<td><button id='tr_2' className={cls2} onClick={this._toggleTrace}>{trace2}</button></td>
					{ 
						trace3 
						? <td><button id='tr_3' className={cls3} onClick={this._toggleTrace}>{trace3}</button></td> 
						: null
					}
				</tr>
			</tbody></table>
		);
	},

	_toggleTrace: function(e) {
		var i = parseInt(e.target.id.split('_')[1]),
			tab = this.props.tab,
			tt = Object.assign({}, this.state.tabTraces);

			if (this._isActiveTrace(i))
				tt[tab].splice(tt[tab].indexOf(i), 1);
			else
				tt[tab].push(i);

		this.setState({ tabTraces: tt });
	},

	_isActiveTrace: function(i) {

		return this.state.tabTraces[this.props.tab].indexOf(i) > -1;
	},

	_dataSeries: function() {
		// 'zone' is the start (0) or end (1) of the alarm data
		var zone = this.props.zone,
			series = [],
			traces = [ [], [], [], [] ],

			a = this.props.alarm,

			N = a.data.ch0.s0.length, // 2X data points if start/end both included in alarm data

			step = a.step_ms, // time between points

			start_time = (a.end_ms) // if there is an end_ms to the event
				? -(N/2 - 1) * a.step_ms // just use half the data points
				: -(N - 1) * a.step_ms, // else use all points

			index_end = (a.end_ms)
				? N/2
				: N;

		// assemble live and consolidated data traces
		for (var i = 0; i < index_end; i++) {

			var t = (start_time + step * i),
				index = (a.end_ms && zone) ? i + N/2 : i,
				tabTraces = this.state.tabTraces,
				tab = this.props.tab;

			// put phase imbalance trace first, so it renders under the phase traces
			switch (tab) {

				case 1: // Power Conditioner Volts & PI
					if (this._isActiveTrace(3)) traces[0].push([ t, a.data['ch7']['s0'][index] ]); // phase imbalance
					if (this._isActiveTrace(0)) traces[1].push([ t, a.data['ch4']['s0'][index] ]); // phase A
					if (this._isActiveTrace(1)) traces[2].push([ t, a.data['ch5']['s0'][index] ]); // phase B
					if (this._isActiveTrace(2)) traces[3].push([ t, a.data['ch6']['s0'][index] ]); // phase C
					break;

				case 2: // Load Currents (no PI)
					if (this._isActiveTrace(0)) traces[0].push([ t, a.data['ch4']['s1'][index] ]); // phase A
					if (this._isActiveTrace(1)) traces[1].push([ t, a.data['ch5']['s1'][index] ]); // phase B
					if (this._isActiveTrace(2)) traces[2].push([ t, a.data['ch6']['s1'][index] ]); // phase C
					break;

				default: // Case 0:  Source Voltages & PI
					if (this._isActiveTrace(3)) traces[0].push([ t, a.data['ch3']['s0'][index] ]); // phase imbalance
					if (this._isActiveTrace(0)) traces[1].push([ t, a.data['ch0']['s0'][index] ]); // phase A
					if (this._isActiveTrace(1)) traces[2].push([ t, a.data['ch1']['s0'][index] ]); // phase B
					if (this._isActiveTrace(2)) traces[3].push([ t, a.data['ch2']['s0'][index] ]); // phase C
			}
		}

		// push data traces into flot data series
		if (this.props.tab != 2) {
			series.push({ data: traces[0], yaxis: 2, color: PLOT_COLORS['PIB'], lines: { lineWidth: 1 }, shadowSize: 0 });
			series.push({ data: traces[1], yaxis: 1, color: PLOT_COLORS['VA'] });
			series.push({ data: traces[2], yaxis: 1, color: PLOT_COLORS['VB'] });
			series.push({ data: traces[3], yaxis: 1, color: PLOT_COLORS['VC'] });
		} else {
			series.push({ data: traces[0], yaxis: 1, color: PLOT_COLORS['VA'] });
			series.push({ data: traces[1], yaxis: 1, color: PLOT_COLORS['VB'] });
			series.push({ data: traces[2], yaxis: 1, color: PLOT_COLORS['VC'] });				
		}

		return series;
	},

	_attachPlot: function(el) {

		if (el && !this[el.id]) {

			this[el.id] = el;
			el.plot = $.plot($(el), this._dataSeries(), this.state.plotOptions);
			//console.log("Created Plot " + el.id + " [ " + $(el).width() + " x " + $(el).height() + " ]");
		}
	},

	_updatePlot: function(resize) {

		var zone = this.props.zone,
			plotId = this.props.id + '_' + zone,
			plot = this[plotId].plot;

		//console.log("Updating Plot " + plotId);

		if (resize) {
			plot.resize();
		}

		plot.setData(this._dataSeries());
		plot.setupGrid();
		plot.draw();

		// got to remove active from the non-current-zone plot wrapper
		//var zoneOff = this.props.id + '_' + (zone == 0 ? '1' : '0');
		//$('#' + zoneOff).parent().removeClass('active');
	},

	_attachAlert: function(el) {
		if (el && !this[el.id]) {
			this[el.id] = el;

			var zone_id = el.id.split('_');

			zone_id = parseInt(zone_id[zone_id.length - 1]);

			if (zone_id == this.props.zone) {
				$(el).addClass('show');
				setTimeout(function() { $(el).removeClass('show'); }, 10000);
			}
		}
	},

	_showAlert: function() {

		var id = this.props.id + '_alert_' + this.props.zone;

		if (this[id]) {

			var $el = $(this[id])
			$el.removeClass('show').addClass('showAndFade');
			setTimeout(function(){ $el.removeClass('showAndFade') }, 2000);
		}
	},

});

module.exports = AlarmPlot;
