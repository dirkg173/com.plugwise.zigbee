'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class Plug extends ZigBeeDevice {

	onMeshInit() {
		this.printNode();
		this.enableDebug();

		if (this.hasCapability('onoff')) this.registerCapability('onoff', 'genOnOff');
		if (this.hasCapability('meter_power')) {
			this.registerCapability('meter_power', 'seMetering', {
				get: 'currentSummDelivered',
				reportParser(value) {
					this.log('value: ', value);
					return Buffer.from(value).readUIntBE(0, 2) / 1000;
				},
				report: 'currentSummDelivered',
				getOpts: {
					getOnStart: true,
				},

			});
		}

		if (this.hasCapability('meter_received')) {
			this.registerCapability('meter_received', 'seMetering', {
				get: 'currentSummReceived',
				reportParser(value) {
					this.log('value: ', value);
					return Buffer.from(value).readUIntBE(0, 2) / 1000;
				},
				report: 'currentSummReceived',
				getOpts: {
					getOnStart: true,
				},
			});
		}

		if (this.hasCapability('measure_power')) {
			this.registerCapability('measure_power', 'seMetering', {
				get: 'instantaneousDemand',
				reportParser(value) {
					if (value < 0) return;
					return value / 10;
				},
				report: 'instantaneousDemand',
				getOpts: {
					getOnStart: true,
				},
			});
		}

		if (this.hasCapability('alarm_poweroverload')) {
			this.registerCapability('alarm_poweroverload', 'haElectricalMeasurement', {
				get: 'acActivePowerOverload',
				reportParser(value) {
					return value === 1;
				},
				report: 'acActivePowerOverload',
				getOpts: {
					getOnStart: true,
					pollInterval: 300000,
				},
			});
		}
		// Report is send if status is changed or after 5 min
		this.registerAttrReportListener('genOnOff', 'onOff', 1, 300, 1, data => {
			// this.log('onOff', data);
			this.setCapabilityValue('onoff', data === 1);
		}, 0);

		// measure_power
		// Report is send if status is changed with min of 2 Watt or after 5 min
		this.registerAttrReportListener('seMetering', 'instantaneousDemand', 10, 300, 10, value => {
			const parsedValue = value / 10;
			if (value < 0) return;
			// this.log('instantaneousDemand', value, parsedValue);
			this.setCapabilityValue('measure_power', parsedValue);
		}, 0);

		// meter_power
		// Report is send in 10 min. Can not be changed.
		this.registerAttrReportListener('seMetering', 'currentSummDelivered', 600, 600, [null, null], value => {
			const parsedValue = Buffer.from(value).readUIntBE(0, 2) / 1000;
			// this.log('currentSummDelivered', value, parsedValue);
			this.setCapabilityValue('meter_power', parsedValue);
		}, 0);

		// meter_received
		// Report is send in 10 min. Can not be changed.
		this.registerAttrReportListener('seMetering', 'currentSummReceived', 600, 600, [null, null], value => {
			const parsedValue = Buffer.from(value).readUIntBE(0, 2) / 1000;
			// this.log('currentSummReceived', value, parsedValue);
			const test = this.getCapabilityValue('meter_received');
			this.log('previous meter_received value :', test);
			if (value !== test) {
				this.meter_receivedTrigger.trigger(this, { Received: parsedValue }, null)
					.then(this.log)
					.catch(this.error);
				this.setCapabilityValue('meter_received', parsedValue);
			}
		}, 0);

		this.meter_receivedTrigger = new Homey.FlowCardTriggerDevice('Power_received_changed')
			.register()
			.registerRunListener((args, state) => {
				this.log(args, state);
				return Promise.resolve(args.meter_received_number === state.meter_received_number);
			});

		this.power_overloadTrigger = new Homey.FlowCardTriggerDevice('poweroverload_changed')
			.register()
			.registerRunListener((args, state) => {
				this.log(args, state);
				return Promise.resolve(args.poweroverload_changed === state.poweroverload_changed);
			});

	}

}

module.exports = Plug;


// [ManagerDrivers] [Plug] [0] ZigBeeDevice has been inited
// [ManagerDrivers] [Plug] [0] ------------------------------------------
// [ManagerDrivers] [Plug] [0] Node: 93b551bd-51ef-438f-8d33-ba7d51dc7e20
// [ManagerDrivers] [Plug] [0] - Battery: false
// [ManagerDrivers] [Plug] [0] - Endpoints: 0
// [ManagerDrivers] [Plug] [0] -- Clusters:
// [ManagerDrivers] [Plug] [0] --- zapp
// [ManagerDrivers] [Plug] [0] --- genBasic
// [ManagerDrivers] [Plug] [0] ---- cid : genBasic
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- zclVersion : 1
// [ManagerDrivers] [Plug] [0] ---- appVersion : 4
// [ManagerDrivers] [Plug] [0] ---- manufacturerName : Plugwise
// [ManagerDrivers] [Plug] [0] ---- modelId : 160-01
// [ManagerDrivers] [Plug] [0] ---- powerSource : 1
// [ManagerDrivers] [Plug] [0] --- genIdentify
// [ManagerDrivers] [Plug] [0] ---- cid : genIdentify
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- identifyTime : 0
// [ManagerDrivers] [Plug] [0] --- genGroups
// [ManagerDrivers] [Plug] [0] ---- cid : genGroups
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- nameSupport : 0
// [ManagerDrivers] [Plug] [0] --- genScenes
// [ManagerDrivers] [Plug] [0] ---- cid : genScenes
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- count : 0
// [ManagerDrivers] [Plug] [0] ---- currentScene : 0
// [ManagerDrivers] [Plug] [0] ---- currentGroup : 0
// [ManagerDrivers] [Plug] [0] ---- sceneValid : 0
// [ManagerDrivers] [Plug] [0] ---- nameSupport : 0
// [ManagerDrivers] [Plug] [0] --- genOnOff
// [ManagerDrivers] [Plug] [0] ---- cid : genOnOff
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- onOff : 0
// [ManagerDrivers] [Plug] [0] --- genAlarms
// [ManagerDrivers] [Plug] [0] ---- cid : genAlarms
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] --- genTime
// [ManagerDrivers] [Plug] [0] ---- cid : genTime
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] --- genOta
// [ManagerDrivers] [Plug] [0] ---- cid : genOta
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] --- seMetering
// [ManagerDrivers] [Plug] [0] ---- cid : seMetering
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- currentSummDelivered : [ 0, 0 ]
// [ManagerDrivers] [Plug] [0] ---- currentSummReceived : [ 0, 0 ]
// [ManagerDrivers] [Plug] [0] ---- status : 0
// [ManagerDrivers] [Plug] [0] ---- unitOfMeasure : 0
// [ManagerDrivers] [Plug] [0] ---- multiplier : 1
// [ManagerDrivers] [Plug] [0] ---- divisor : 10000
// [ManagerDrivers] [Plug] [0] ---- summaFormatting : 0
// [ManagerDrivers] [Plug] [0] ---- demandFormatting : 0
// [ManagerDrivers] [Plug] [0] ---- meteringDeviceType : 0
// [ManagerDrivers] [Plug] [0] ---- instantaneousDemand : -2
// [ManagerDrivers] [Plug] [0] --- haElectricalMeasurement
// [ManagerDrivers] [Plug] [0] ---- cid : haElectricalMeasurement
// [ManagerDrivers] [Plug] [0] ---- sid : attrs
// [ManagerDrivers] [Plug] [0] ---- measurementType : 1
// [ManagerDrivers] [Plug] [0] ---- totalActivePower : -2
// [ManagerDrivers] [Plug] [0] ---- powerMultiplier : 4294901760
// [ManagerDrivers] [Plug] [0] ---- powerDivisor : 4294967040
// [ManagerDrivers] [Plug] [0] ---- acAlarmsMask : 4
// [ManagerDrivers] [Plug] [0] ---- acActivePowerOverload : 0
// [ManagerDrivers] [Plug] [0] ------------------------------------------
