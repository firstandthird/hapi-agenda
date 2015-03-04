var Agenda = require('agenda');
var Batch = require('agenda-batch');
var _ = require('lodash-node');
var fs = require('fs');

exports.register = function(plugin, options, next) {
  var mongoUrl = options.mongoUrl || 'localhost:27017/hapi-agenda';

  var agenda = new Agenda({
    db: { address: mongoUrl },
    processEvery: options.processEvery || '5 minutes'
  });

  // Define the agenda handlers
  agenda.on('start', function(job) {
    plugin.log(['agenda', 'start'], job.attrs);
  });

  agenda.on('complete', function(job) {
    plugin.log(['agenda', 'complete'], job.attrs);
  });

  agenda.on('success', function(job) {
    plugin.log(['agenda', 'success'], job.attrs);
  });

  agenda.on('fail', function(err, job) {
    plugin.log(['agenda', 'error'], { err: err, job: job.attrs });
  });

  var jobs = {};
  if (options.jobs && fs.existsSync(options.jobs)) {
    jobs = require('require-all')(options.jobs);
  }

  _.forIn(jobs, function(value, key) {
    var opts = {};
    var name, method;

    if (typeof value === 'function') {
      name = key;
      method = value;
    } else {
      name = value.name;
      method = value.job;

      delete value.name;
      delete value.job;

      opts = value;
    }

    agenda.define(name, opts, function(job, done) {
      plugin.log(['agenda', 'queue'], { jobName: name, job: job.attrs });
      method.call(plugin, job, done);
    });

  });

  if (options.every) {
    _.forIn(options.every, function(value, key) {
      agenda.every(key, value);
    });
  }

  agenda.start();

  var basePath = options.basePath || '';
  var auth = options.auth || false;

  var batch = new Batch(agenda);

  plugin.expose('agenda', agenda);
  plugin.expose('batch', batch);

  plugin.bind({
    batch: batch,
    agenda: agenda,
    options: options
  });

  if (options.jsonApi) {
    plugin.route(_.values(require('./json-handler')(basePath, auth)));
  }

  next();

};

exports.register.attributes = {
  name: 'agenda'
};
