module.exports = function(data, done) {
  this.methods.testMethod();
  console.log('Nothing more than an error');
  throw "This is an error of sorts";
};
