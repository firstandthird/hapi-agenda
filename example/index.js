var Hapi = require('hapi');

var server = new Hapi.Server();

server.connection({
  host: 'localhost',
  port: 8080
});

// server.start(function () {
//   console.log('Server running at:', server.info.uri);
// });

server.register({
  register: require('../'),
  options: {
    mongoUrl: 'localhost:27017/hapi-agenda',
    jobs: __dirname + '/jobs',
    processEvery: '5 seconds',
    jsonApi: true
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
      var batch = server.plugins['batch']['batch']; 
      batch.batch('batch-777', { email: 'test@example.com'},'in 60 seconds', 'say-hello');
  }
});

server.start(function() {
  console.log('Server running at:', server.info.uri);
});
