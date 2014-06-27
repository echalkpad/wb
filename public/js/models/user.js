if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['backbone'], function(Backbone){

  var User = Backbone.Model.extend({
    className: 'User',
    initialize: function(attributes, options){
    },
    login: function(){
      return this.get('login')
    },
    groups: function(){
      return this.get('groups');
    },
    sudo: function(value){
      value || (value = false);
      this.set({sudoing: value});
      return this;
    },
    superuser: function(){
      return this.get('superuser') || false;
    }
  });

  return User;

});
