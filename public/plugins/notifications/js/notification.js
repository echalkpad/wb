define(['class'], function(Class){

  var Notification = Class.extend({
    className: 'Notification',
    init: function(text, options){
      options = _.defaults(options || {}, {type: 'alert', duration: 'momentary', layout: Notification.layouts.first(), modal: false});
      _.extend(this, options);
      this.text = text;
      if (!Notification.durations.contains(this.duration)) throw "invalid notification duration " + this.duration;
      if (!Notification.types.contains(this.type))         throw "invalid notification type " + this.type;
      if (!Notification.layouts.contains(this.layout))     throw "invalid notification layout " + this.layout;
    }
  }, {
    types     : ['alert', 'success', 'error'],
    layouts   : ['topRight'],
    durations : [
      'momentary', //display for a time, then disappear
      'sticky',    //display until the user closes
      'permanent'  //display forever or until some other event causes the notification to disappear
    ]
  });

  return Notification;
});
