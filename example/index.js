var Hapi = require('hapi');

var server = new Hapi.Server({ debug: {log: ['agenda'] } });

server.connection({
  host: 'localhost',
  port: 8080
});

server.register({
  register: require('../'),
  options: {
    mongoUrl: 'localhost:27017/hapi-agenda',
    jobs: __dirname + '/jobs',
    processEvery: '5 seconds',
    jsonApi: true,
    every: {
      'say-error' : {
        enabled: false
      }
    }
  }
}, function(err) {

});

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply('hapi-agenda example. Visit <a href="/spawn-job">/spawn-job</a> to create a new agenda batch job.');
  }
});

server.route({
  method: 'GET',
  path: '/spawn-job',
  handler: function (request, reply) {
    reply('Spawning a new job.');
    var batch = server.plugins['agenda']['batch'];
    batch.batch('batch-777', { email: 'test@example.com'}, 'in 20 seconds', 'say-hello');

    batch.batch('batch-999', { random: Math.random() }, 'in 12 seconds', 'say-error')
  }
});

server.route({
  method: 'GET',
  path: '/recurring',
  handler: function(request, reply) {
    request.server.plugins.agenda.agenda.every('30 seconds', 'log');
    reply('done');
  }
});

server.start(function() {
  console.log('Server running at:', server.info.uri);
});
