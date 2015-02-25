module.exports = function(data, done) {
  process.nextTick(function() {
    console.log('Hi there');
    done();
  });
};
