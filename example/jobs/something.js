module.exports = {
  name: 'here is a task',
  job: function(data, done) {
    console.log('Would you like ' + (data.attrs.data.type || 'something') + '?')
    done();
  },
  concurrency: 10,
  priority: 'high'
};
