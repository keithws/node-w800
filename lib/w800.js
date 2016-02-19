var serialport = require('serialport'),
	SerialPort = serialport.SerialPort,
	util = require('util'),
	events = require('events'),
	x10 = require('x10'),
	X10Address = x10.Address,
	X10Command = x10.Command;


var HANDSHAKE_REQUEST = [0xF0, 0x29],
	HANDSHAKE_RESPONSE = [0x29];


/**
 * @class The Receiver object represents a member of the W800 family of RF receivers.
 * @augments EventEmitter
 * @param {String} port This is the serial port the cm11a is connected to.
 * @param {function} function A function to be called when the interface is ready to communicate.
 * @property receiveBuffer An array holding the current bytes received from the W800.
 * @property {SerialPort} sp The serial port object used to communicate with the W800.
 */
function Receiver(port, callback) {
	events.EventEmitter.call(this);

	callback = callback || function () {};

	var receiver = this;

	this.isReady = false;
	this.receiveBuffer = [];

	if (typeof port === 'object') {
		this.sp = port;
	} else { 
		this.sp = new SerialPort(port, {
			baudRate: 4800,
			parity: 'none',
			dataBits: 8,
			stopBits: 1,
			bufferSize: 1,
			parser: serialport.parsers.byteLength(4)
		});
	}

	this.sp.on("error", function (string) {
		callback(string);
	});

	this.sp.on("data", function (data) {
		receiver.emit("data", data);
	});

	this.sp.on("open", function () {
		// TODO find out why my device does not appear to respond to the handshake
		receiver.handshake(callback);
	});

	if ( !(this instanceof Receiver) ) {
		return new Receiver( port, callback );
	}

}
util.inherits(Receiver, events.EventEmitter);


/**
 * Initiate a handshake with the W800 and verify the response
 * @param {function} callback A function to be called when the W800 has responded.
 */
Receiver.prototype.handshake = function (callback) {
	var receiver = this;

	this.once("handshake", callback);
	this.sp.once("data", function (data) {

		// expects a 1 byte response
		if (data.length === 1) {

			if (data[0] === HANDSHAKE_RESPONSE[0]) {
				receiver.isReady = true;
				receiver.emit("handshake");
			} else {
				callback(new Error("Invalid response: " + data));
			}

		} else {
			callback(new Error("Invalid response length, " + data.length));
		}
	});
	this.sp.write(HANDSHAKE_REQUEST, function(err, results) {
		if (err) {
			callback(err);
		}
	});
};

module.exports = {
	Receiver: Receiver
};
