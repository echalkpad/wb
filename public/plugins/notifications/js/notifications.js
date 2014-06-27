define(['list', './notification'], function(List, Notification){

  //TODO: maybe List has a model property like Backbone collections?  This would work as a constructor and a means of testing for validValue.
  var Notifications = List.extend({
    className: 'Notifications',
    init: function(){
      this._super();
      this.enable();
    },
    disable: function(){
      this._enabled = false;
      return this;
    },
    enable: function(){
      this._enabled = true;
      return this;
    },
    enabled: function(){
      return this._enabled;
    },
    disabled: function(){
      return !this._enabled;
    },
    validValue: function(notification){
      return notification instanceof Notification;
    },
    add: function(text, options){
      if (this.disabled()) return null;
      var notification = new Notification(text, options);
      return this._super(notification);
    }
  });

  return Notifications;
});
