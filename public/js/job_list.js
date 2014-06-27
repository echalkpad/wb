define(['list'], function(List){

  var JobList = List.extend({
    className: 'JobList',
    validValue: function(job){
      return _.isFunction(job);
    },
    execute: function(context){
      var jobs = this;
      context = context || this;
      return this.map(function(fn){
        return {job: fn, result: fn.call(this, jobs)};
      }, context);
    }
  });

  return JobList;
});
