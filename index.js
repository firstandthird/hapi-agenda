var Agenda = require('agenda');
var _ = require('lodash-node');

exports.register = function(plugin, options, next) {

  var mongoUrl = options.mongoUrl || 'localhost:27017/hapi-agenda';
  var jobs = {};

  var agenda = new Agenda({
    db: { address: mongoUrl },
    processEvery: options.processEvery || '5 minutes'
  });

  agenda.on('start', function(job) {
    plugin.log(['agenda', 'start'], job);
  });

  agenda.on('complete', function(job) {
    plugin.log(['agenda', 'complete'], job);
  });

  agenda.on('success', function(job) {
    plugin.log(['agenda', 'success'], job);
  });

  agenda.on('fail', function(err, job) {
    plugin.log(['agenda', 'complete'], {err: err, job: job});
  });

  if(options.jobs) {
    jobs = require('require-all')(options.jobs);
  }

  _.forIn(jobs, function(value, key) {
    var opts = {};
    var name, method;

    if(typeof value === 'function') {
      name = key;
      method = value;
    } else {
      name = value.name;
      method = value.job;

      delete value.name;
      delete value.method;

      opts = value;
    }

    agenda.define(name, opts, method.bind(plugin));
  });

  if(options.every) {
    _.forIn(options.every, function(value, key) {
      agenda.every(key, value);
    });
  }

  agenda.start();

  plugin.expose('agenda', agenda);
  plugin.bind({
    agenda: agenda,
    options: options
  });

  var basePath = options.basePath || '';
  var auth = options.auth || false;

  if(options.jsonApi) {
    plugin.route(_.values(require('./json-handler')(basePath, auth)));
  }

  next();
};

exports.register.attributes = {
  name: 'agenda'
};
