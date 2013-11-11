var chai = require('chai');
var sinonChai = require("sinon-chai");
var sinon = require('sinon');
var SandboxedModule = require('sandboxed-module');
chai.use(sinonChai);

var libpath = (process.env['FUNCTION_FLOW_COV'] ? 'lib-cov/' : 'lib/');

// The Lib we want to test
var ZabbixSender = require('../../' + libpath + 'ZabbixSender.js');

chai.Assertion.includeStack = true; // defaults to false
var expect = chai.expect;

describe('constructer()', function() {
	it('checking default options', function() {
		var sender = new ZabbixSender();
		expect(sender.options).to.be.deep.equal({
			config : undefined,
			bin : 'zabbix_sender',
			hostname : '-',
			port : undefined
		});
	});
});

describe('ZabbixSender.send()', function() {
	var endSpy;
	var execStub;
	var ZabbixSenderFakeExec;

	beforeEach(function() {
		endSpy = sinon.spy();
		execStub = sinon.stub().returns({
			stdin : {
				end : endSpy
			}
		});

		ZabbixSenderFakeExec = SandboxedModule.require(
				'../../' + libpath + 'ZabbixSender.js',
				{requires : {'child_process' : {execFile : execStub}}}
		);

	});

	describe('options used correctly', function() {


		it('default', function() {

			var sender = new ZabbixSenderFakeExec();
			sender.send({});
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'zabbix_sender',
					['--input-file', '-'],
					undefined
					);
			expect(endSpy).to.be.called.Once;

		});

		it('config provided', function() {

			var sender = new ZabbixSenderFakeExec({config : './test/file.js'});
			sender.send({});
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'zabbix_sender',
					['--config', './test/file.js', '--input-file', '-'],
					undefined
					);
			expect(endSpy).to.be.called.Once;
		});

		it('bin provided', function() {

			var sender = new ZabbixSenderFakeExec({bin : './test/zabbix_sender.exe'});
			sender.send({});
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'./test/zabbix_sender.exe',
					['--input-file', '-'],
					undefined
					);
			expect(endSpy).to.be.called.Once;
		});

		it('port provided', function() {

			var sender = new ZabbixSenderFakeExec({port : 12345});
			sender.send({});
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'zabbix_sender',
					['--port', 12345, '--input-file', '-'],
					undefined
					);
			expect(endSpy).to.be.called.Once;
		});

		it('hostname provided, but no data during send', function() {

			var sender = new ZabbixSenderFakeExec({hostname : 'HOSTNAME'});
			sender.send({});
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'zabbix_sender',
					['--input-file', '-'],
					undefined);

			expect(endSpy).to.be.called.Once;
		});

		it('hostname provided, and considered in data', function() {

			var sender = new ZabbixSenderFakeExec({hostname : 'HOSTNAME'});
			sender.send({key : 'value'});
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'zabbix_sender',
					['--input-file', '-'],
					undefined);

			expect(endSpy).to.be.called.Once;
			expect(endSpy).always.have.been.calledWithExactly('HOSTNAME key value\n');
		});
	});

	describe('error callback', function() {
		it('the error callback is parsed to the exec', function() {

			var sender = new ZabbixSenderFakeExec();
			var errorCallback = sinon.spy();
			sender.send({}, errorCallback);
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'zabbix_sender',
					['--input-file', '-'],
					errorCallback);

			expect(errorCallback).to.be.not.called;
			expect(endSpy).to.be.called.Once;

		});
	});

	describe('data provided to send method', function() {

		describe('nested data', function() {
			it('single nested property, 2 levels', function() {
				var sender = new ZabbixSenderFakeExec();
				sender.send({keyA : {keyB : 'propC'}});
				expect(execStub).to.be.called.Once;
				expect(execStub).always.have.been.calledWithExactly(
						'zabbix_sender',
						['--input-file', '-'],
						undefined);

				expect(endSpy).to.be.called.Once;
				expect(endSpy).always.have.been.calledWithExactly('- keyA.keyB propC\n');
			});
			it('single nested property, 3 levels', function() {
				var sender = new ZabbixSenderFakeExec();
				sender.send({keyA : {keyB : {keyC : 'propD'}}});
				expect(execStub).to.be.called.Once;
				expect(execStub).always.have.been.calledWithExactly(
						'zabbix_sender',
						['--input-file', '-'],
						undefined);

				expect(endSpy).to.be.called.Once;
				expect(endSpy).always.have.been.calledWithExactly('- keyA.keyB.keyC propD\n');
			});
			it('mixing 2nd level and 3rd level properties', function() {
				var sender = new ZabbixSenderFakeExec();
				sender.send({keyA : {
						keyB : {
							keyC : 'propD'
						}, keyX : 'propZ'
					}
				});
				expect(execStub).to.be.called.Once;
				expect(execStub).always.have.been.calledWithExactly(
						'zabbix_sender',
						['--input-file', '-'],
						undefined);

				expect(endSpy).to.be.called.Once;
				expect(endSpy).always.have.been.calledWithExactly('- keyA.keyB.keyC propD\n- keyA.keyX propZ\n');
			});
		});
		
		it('dot in key', function() {

			var sender = new ZabbixSenderFakeExec();
			sender.send({'keyA.keyB' : 'propC'});
			expect(execStub).to.be.called.Once;
			expect(execStub).always.have.been.calledWithExactly(
					'zabbix_sender',
					['--input-file', '-'],
					undefined);

			expect(endSpy).to.be.called.Once;
			expect(endSpy).always.have.been.calledWithExactly('- keyA.keyB propC\n');
		});
	});

});