import sinon = require("sinon");
import chai = require("chai");
import sinonChai = require("sinon-chai");
import chaisAsPromised = require("chai-as-promised");

chai.should();
chai.use(sinonChai);
chai.use(chaisAsPromised);
let expect: Chai.ExpectStatic = chai.expect;

import winston = require("winston");
import publicIp = require("public-ip");
import http = require("http");
import https = require("https");
import ConfigurationObject from "../src/configurationObject";
import RemoteUpdater from "../src/remoteUpdater";
import protocols from "../src/protocols";

describe("Remote Updater Object Test", function() {
  let defaultConfig: ConfigurationObject = {
    remote_hostname: "test",
    path: "test",
    user: "test",
    password: "test",
    dns_record: "test",
    protocol: protocols.https,
    remind: true,
    remind_count: 10
  };

  let winstonErrorFake: sinon.SinonSpy;
  let winstonInfoFake: sinon.SinonSpy;
  let winstonDebugFake: sinon.SinonSpy;
  let winstonWarnFake: sinon.SinonSpy;
  let httpClientRequestStub: sinon.SinonStub;
  let httpsClientRequestStub: sinon.SinonStub;
  let requestStub: sinon.SinonStub;
  let publicIpStub: sinon.SinonStub;

  beforeEach(function() {
    winstonErrorFake = sinon.fake();
    winstonInfoFake = sinon.fake();
    winstonDebugFake = sinon.fake();
    winstonWarnFake = sinon.fake();
    httpClientRequestStub = sinon.stub(http, "request");
    httpsClientRequestStub = sinon.stub(https, "request");
    requestStub = sinon.stub();
    publicIpStub = sinon.stub(publicIp, "v4");
  });

  afterEach(function() {
    sinon.restore();
  });

  it("Test object creation", function() {
    new RemoteUpdater(defaultConfig).should.be.instanceof(RemoteUpdater);
  });

  it("DNS up to date.", function(done) {
    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);

    publicIpStub.returns("");

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.eventually.be.fulfilled.then(() => {
      winstonInfoFake.firstCall.should.have.been.calledWithExactly(
        "DNS is up to date."
      );
      done();
    });
  });

  it("IP query failed", function(done) {
    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);

    publicIpStub.throws(new Error("Query timed out"));

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.eventually.be.fulfilled.then(() => {
      winstonErrorFake.firstCall.should.have.been.calledWithExactly(
        "Query timed out"
      );
      done();
    });
  });

  it("Throw error on request.", function(done) {
    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater
      .update()
      .should.eventually.be.rejectedWith(Error)
      .notify(done);

    requestStub.withArgs("error").callsArgWithAsync(1, new Error());
  });

  it("HTTPS Update should be good", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.be.fulfilled.then(() => {
      winstonInfoFake.firstCall.should.have.been.calledWithExactly(
        "DNS Record has successfully been updated."
      );
      done();
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "good");
  });

  it("HTTP Update should be good", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpClientRequestStub.returns(requestObject);

    let newConfig = Object.assign({}, defaultConfig);
    newConfig.protocol = protocols.http;
    let updater: RemoteUpdater = new RemoteUpdater(newConfig);

    updater.update().should.be.fulfilled.then(() => {
      winstonInfoFake.firstCall.should.have.been.calledWithExactly(
        "DNS Record has successfully been updated."
      );
      done();
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "good");
  });

  it("Update should pass with no change.", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);
    sinon.replace(winston, "warn", winstonWarnFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.be.fulfilled.then(() => {
      winstonDebugFake.should.have.been.calledWithExactly(
        "No changes have been made."
      );
      done();
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "nochg");
  });

  it("Unkown response should be returned.", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);
    sinon.replace(winston, "warn", winstonWarnFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.be.fulfilled.then(() => {
      winstonWarnFake.should.have.been.calledWithExactly(
        'Update failed. DNS Server return code "Unknown Response". Unknown response received. Suspending updates.'
      );
      done();
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "Unknown Response");
  });

  it("Update should pass with Good 127.0.0.1", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);
    sinon.replace(winston, "warn", winstonWarnFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.be.fulfilled.then(() => {
      winstonInfoFake.should.have.been.calledWithExactly(
        "DNS Record has successfully been updated."
      );
      done();
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "good 127.0.0.1");
  });

  it("Update should fail", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);
    sinon.replace(winston, "warn", winstonWarnFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.be.fulfilled.then(() => {
      winstonWarnFake.firstCall.should.have.been.calledWithExactly(
        `Update failed. DNS Server return code "dnserr". DNS error encountered. Suspending updates.`
      );
      done();
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "dnserr");
  });

  it("Update should fail with 911", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);
    sinon.replace(winston, "warn", winstonWarnFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let updater: RemoteUpdater = new RemoteUpdater(defaultConfig);

    updater.update().should.be.fulfilled.then(() => {
      winstonInfoFake.should.have.been.calledWithExactly(
        `There's a problem with the DNS server.`
      );
      done();
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "911");
  });

  it("Update should go into suspension.", function(done) {
    let responseStub: sinon.SinonStub = sinon.stub();

    sinon.replace(winston, "error", winstonErrorFake);
    sinon.replace(winston, "info", winstonInfoFake);
    sinon.replace(winston, "verbose", winstonDebugFake);
    sinon.replace(winston, "debug", winstonDebugFake);
    sinon.replace(winston, "warn", winstonWarnFake);

    publicIpStub.returns("127.0.0.1");
    let requestObject = {
      on: requestStub,
      end: function() {}
    };
    httpsClientRequestStub.returns(requestObject);

    let newConfig = Object.assign({}, defaultConfig);
    newConfig.remind_count = 2;
    let updater: RemoteUpdater = new RemoteUpdater(newConfig);

    updater.update().should.be.fulfilled.then(() => {
      updater.update().should.be.fulfilled.then(() => {
        updater.update().should.be.fulfilled.then(() => {
          winstonDebugFake.should.have.been.calledWithExactly(
            "DNS update is currently suspended. No Update performed."
          );

          winstonWarnFake.should.have.been.calledWithExactly(
            "Reminding you that DNS updating is still suspended."
          );

          done();
        });
      });
    });

    requestStub.withArgs("response").callsArgWithAsync(1, { on: responseStub });

    responseStub.withArgs("data").callsArgWithAsync(1, "dnserr");
  });
});
