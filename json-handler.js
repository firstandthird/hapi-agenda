var Hapi = require('hapi');
var Joi = require('joi');
var mongo = require('mongoskin');
var toObjectID = mongo.helper.toObjectID;
var async = require('async');

module.exports = function(path, auth) {
  return {
    jobStats: {
      method: 'GET',
      path: path + '/jobs',
      config: {
        auth: auth,
        handler: function(request, reply) {
          this.agenda.jobs({}, function(err, jobs) {
            if(err) {
              return reply(Hapi.error.internal('get jobs', err));
            }

            reply(jobs);
          });
        }
      }
    },
    jobInfo: {
      method: 'GET',
      path: path + '/job/{id}',
      config: {
        auth: auth,
        handler: function(request, reply) {
          this.agenda.jobs({_id: toObjectID(request.params.id)}, function(err, job) {
            if(err) {
              return reply(Hapi.error.internal('get job by id', err));
            }

            reply(job);
          });
        }
      }
    },
    deleteJob: {
      method: 'DELETE',
      path: path + '/job/{id}',
      config: {
        auth: auth,
        handler: function(request, reply) {
          this.agenda.cancel({_id: toObjectID(request.params.id)}, function(err, job) {
            if(err) {
              return reply(Hapi.error.internal('cancel job by id', err));
            }

            reply(job);
          });
        }
      }
    },
    createjob: {
      method: 'POST',
      path: path + '/job',
      config: {
        auth: auth,
        validate: {
          payload: {
            name: Joi.string().required(),
            every: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            data: Joi.object().optional().default({})
          }
        },
        handler: function(request, reply) {
          var job;

          if(!request.payload.every) {
            job = this.agenda.now(request.payload.name, request.payload.data);
          } else {
            job = this.agenda.every(request.payload.every, request.payload.name, request.payload.data);
          }

          reply(job);
        }
      }
    },
    disableJob: {
      method: 'PUT',
      path: path + '/job/{name}/disable',
      config: {
        auth: auth
      },
      handler: function(request, reply) {
        this.agenda.jobs({ name: request.params.name }, function(err, jobs) {

          if (err) {
            return reply(err);
          }

          async.forEach(jobs, function(job, done) {
            job.disable();
            job.save(done);
          }, function(err) {
            console.log(arguments);
            reply(err, 'disabled');
          });


        });
      }
    },
    enableJob: {
      method: 'PUT',
      path: path + '/job/{name}/enable',
      config: {
        auth: auth
      },
      handler: function(request, reply) {
        this.agenda.jobs({ name: request.params.name }, function(err, jobs) {

          if (err) {
            return reply(err);
          }

          async.forEach(jobs, function(job, done) {
            job.enable();
            job.save(done);
          }, function(err) {
            reply(err, 'enabled');
          });


        });
      }
    }
  };
};
