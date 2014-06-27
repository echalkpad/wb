define(['js!vendor/jquery.js!order', 'js!vendor/underscore.js!order', 'js!vendor/backbone.js!order'], function(){

  var Aspects = {
    aspects: function(methods){
      _.aspects(this.prototype, methods);
      return this;
    }
  };

  var Events = {
    one: function(ev, fn){
      var that = this;
      var once = function(){
        fn.apply(that, _.toArray(arguments));
        that.unbind(ev, once);
      };
      that.bind(ev, once);
    },
    unbound: function(ev, fn, block){
      var that = this;
      try {
        that.unbind(ev, fn);
        block.call(that); //do work while unbound
      } catch (err) {
        throw err;
      } finally {
        that.bind(ev, fn);
      }
      return this;
    }
  };

  var Models = {
    validates: function(){
      var that = this;
      return this.validations
      .map(function(validation){
        return validation.call(that);
      })
      .flatten()
      .compact();
    },
    //add a value to an array attribute
    push: function(attribute, value){
      var values = _.clone(this.get(attribute) || []).give(value);
      this.set(_.roll(attribute, values));
      return this;
    },
    //remove a value from an array attribute
    pop: function(attribute, value){
      var values = _.without(this.get(attribute) || [], [value]);
      this.set(_.roll(attribute, values));
      return this;
    }
  };

  _.extend(Backbone.Model          , Aspects);
  _.extend(Backbone.Collection     , Aspects);
  _.extend(Backbone.Events         , Events);
  _.extend(Backbone.Model.prototype, Events, Models);
  _.extend(Backbone.View.prototype , Events);

  return Backbone;
});
