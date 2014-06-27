define(['class'], function(Class){

  var RequestBar = Class.extend({ //abstract class
    className: 'RequestBar',
    init: function(command_template, topic_map, subject){
      _.bindAll(this);
      this.command_template = command_template;
      this._ready = false;
      this._subject = subject;
      this.topic_map(topic_map);
    },
    topic_map: function(tm){
      tm = arguments.length > 0 ? (this._topic_map = tm) : this._topic_map;
      this.ready(tm);
      return tm;
    },
    ready: function(state){
      if (arguments.length > 0) {
        this._ready = !!state;
        this.trigger("change:ready", this._ready);
      }
      return this._ready;
    },
    execute: function(options){
      var self = this, subject = this._subject || this.topic_map();
      var command = new this.command_template(subject, options);
      return $.Deferred(function($d){
        setTimeout(function(){
          var results = command.execute(self);
          var method  = results.error ? 'reject' : 'resolve';
          $d[method](results, options);
        }, 10);
      }).done(function(results, options){
        self.trigger("requested", results, options);
      }).fail(function(results, options){
        self.trigger("request:failed", results, options);
      }).promise();
    }
  });

  _.extend(RequestBar.prototype, Backbone.Events);

  return RequestBar;

});