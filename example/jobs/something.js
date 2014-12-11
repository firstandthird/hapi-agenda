module.exports = {
  name: 'here is a task',
  job: function(data, done) {
    console.log('hostname', this.info.host);
    done();
  },
  concurrency: 10,
  priority: 'high'
};
