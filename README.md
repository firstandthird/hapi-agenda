### hapi-agenda

#### Installation

```
npm install hapi-agenda --save
```

#### Usage

```js
server.register({
  register: require('hapi-agenda'),
  options: {
    mongoUrl: 'localhost:27017/hapi-agenda',
    jobs: __dirname + '/jobs', // path to directory containing job files
    processEvery: '5 seconds', // Defaults to 30 seconds. Lower numbers = higher db calls
    every: { // Runs these jobs
      '10 seconds': 'say-hello',
      '30 seconds': 'here is a task'
    }
  }
}, function(err) {
  // start server or other stuff
});
```

Job File:

Job name based on filename

hello-world.js
```js
module.exports = function(data, done) {
  console.log('Hello world');
  done();
};
```

Job with options and custom name

customjob.js
```js
module.exports = {
  name: 'here is a task',
  job: function(data, done) {
    console.log('hostname', this.info.host);
    done();
  },
  concurrency: 10,
  priority: 'high'
};
```
