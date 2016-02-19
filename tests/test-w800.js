var should = require("should"),
	_ = require("underscore"),
	SerialPort = require("./MockSerialPort").SerialPort,
	x10 = require("x10"),
	X10Address = x10.Address,
	X10Command = x10.Command,
	Receiver = require("../lib/w800").Receiver;

describe("Receiver", function () {
	var serialPort, receiver;

	serialPort = new SerialPort("/path/to/fake/usb");
	receiver = new Receiver(serialPort, function (err) {
        "test error".should.equal(err);
	});
	serialPort.emit("error", "test error");
	serialPort = new SerialPort("/path/to/fake/usb");
	receiver = new Receiver(serialPort, function (err) {
		(typeof err).should.equal("undefined");
	});

	it("responds to a handshake request.", function (done) {
		serialPort = new SerialPort("/path/to/fake/usb");
		receiver = new Receiver(serialPort, function (err) {
		    should.not.exist(err);
			receiver.isReady.should.equal(true);
			done();
		});
		// echo back a 0x29 indicating the W800 is on line.
		serialPort.emit("open");
		serialPort.emit("data", [0x29]);
	});

	it("decodes the sampled RF stream into a stream of X10 packets", function (done) {
		serialPort = new SerialPort("/path/to/fake/usb");
		receiver = new Receiver(serialPort, function () {
			receiver.isReady.should.equal(true);
			receiver.on("data", function (data) {
			    should.exist(data);
				data.should.deepEqual(new Buffer([0b00011110, 0b11100001, 0b00100110, 0b11011001]));
				// data.should.deepEqual([new X10Address("A16"), new X10Command("OFF")]);
				done();
			});
		});
		// send 0x29 to indicate the W800 is online
		serialPort.emit("open");
		serialPort.emit("data", new Buffer([0x29]));
		// send A-16 OFF from the fake serial port
		// the message is repeated six times when I press a remote button
		serialPort.emit("data", new Buffer([0b01100100, 0b10011011, 0b01111000, 0b10000111]));
	});
});

