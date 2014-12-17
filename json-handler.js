var Hapi = require('hapi');
var Joi = require('joi');
var mongo = require('mongoskin');
var toObjectID = mongo.helper.toObjectID;

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
            now: Joi.boolean().default(false),
            every: Joi.alternatives().when('now', { is: true, then: Joi.forbidden(), otherwise: [Joi.string().required(), Joi.number().required()] }),
            data: Joi.object().optional().default({})
          }
        },
        handler: function(request, reply) {
          var job;

          if(request.payload.now) {
            job = this.agenda.now(request.payload.name, request.payload.data);
          } else {
            job = this.agenda.every(request.payload.every, request.payload.name, request.payload.data);
          }

          reply(job);
        }
      }
    }
  }
};
