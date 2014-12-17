var Hapi = require('hapi');

var server = new Hapi.Server();

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
    every: {
      '10 seconds': 'say-hello',
      '30 seconds': 'here is a task'
    },
    jsonApi: true
  }
}, function(err) {

  server.start(function() {
    server.log(['server', 'info'], 'Hapi server started '+ server.info.uri);
  });
});
