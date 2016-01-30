var should = require("should"),
	_ = require("underscore"),
	SerialPort = require("./MockSerialPort").SerialPort,
	x10 = require("x10"),
	X10Address = x10.Address,
	X10Command = x10.Command,
	Receiver = require("../w800").Receiver,

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
		receiver = new Receiver(serialPort, function () {
			receiver.isReady.should.equal(true);
			done();
		});
		// Send a F0hex - 29hex and the module will echo back a 29hex indicating it is on line.
		serialPort.emit("data", [0x29]);
	});

	it("decodes the sampled RF stream into a stream of X10 packets", function (done) {
		serialPort = new SerialPort("/path/to/fake/usb");
		receiver = new Receiver(serialPort, function () {
			receiver.isReady.should.equal(true);
			done();
		});
		receiver.on("packet", function (packet) {
			packet.should.equal([new X10Address("A16"), new X10Function("OFF")]);
		});
		// send 0x29 to indicate the W800 is online
		serialPort.emit("data", [0x29]);
		// send A-16 OFF from the fake serial port
		serialPort.emit("data", [0b10101110, 0b11101110, 0b10110101, 0b10101010, 0b11110111, 0b11010101]);
	});
});

