var Hapi = require('hapi');
var Joi = require('joi');
var mongo = require('mongoskin');
var toObjectID = mongo.helper.toObjectID;
var async = require('async');

module.exports = function(path, auth) {
  return {
    jobs: {
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
    jobStats: {
      method: 'GET',
      path: path + '/jobs/stats',
      config: {
        auth: auth,
        handler: function(request, reply) {
          var now = new Date();
          var statsObject = {};
          var agenda = this.agenda;

          async.waterfall([
            // Get the number of started jobs
            function(cb){
              statsObject.startedJobs = 0;
              agenda.jobs({
                disabled: { $ne: true },
                $or: [
                  {lockedAt: null},
                  {lockedAt: {$lt: now}}
                ],
                lastRunAt: {$lt: now}
              }, function(err, jobs) {

                statsObject.startedJobs = jobs.length;
                cb(null, statsObject);

              });
              
            },
            // Get the number of completed jobs
            function(statObj, cb){
              statObj.completedJobs = 0;
              agenda.jobs({
                disabled: { $ne: true },
                lastFinishedAt: {$lt: now}
              }, function(err, jobs) {

                statObj.completedJobs = jobs.length;
                cb(null, statObj);

              });
            },
            // Get number of jobs that haven't completed
            function(statObj, cb){
              statObj.runningJobs = 0;
              agenda.jobs({
                disabled: { $ne: true },
                lockedAt: {$lt: now},
                lastRunAt: {$lt: now}, 
                lastFinishedAt: {$exists: false}
              }, function(err, jobs) {

                statObj.runningJobs = jobs.length;
                cb(null, statObj);

              });
            },
            // Get the number of failed jobs
            function(statObj, cb) {
              statObj.failedJobs = 0;
              agenda.jobs({
                disabled: { $ne: true }, 
                lastFinishedAt: {$lt: now},
                failedAt: {$lt: now}
              }, function(err, jobs) {

                statObj.failedJobs = jobs.length;
                cb(null, statObj);

              });
            },
            // Number of jobs queued
            function(statObj, cb) {
              statObj.queuedJobs = 0;
              agenda.jobs({
                disabled: { $ne: true },
                nextRunAt: {$gt: now}
              }, function(err, jobs) {

                statObj.queuedJobs = jobs.length;
                cb(null, statObj);

              });
            }
          ], function(err, result) {
            reply(result);
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
