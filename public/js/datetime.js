define(function(){

  Date.prototype.format = function(template){
    var result = this.toString(template);
    return result;
  };

  Date.create = function(value){
    var result;
    if (_.isDate(value)) {
      result = value
    } else {
      result = Date.parse(value.toString().replace('T', ' ').replace('Z', ' '));
    }
    if (!result){ // e.g. 2011-08-29T14:45:52-04:00
      var parts = value.toString().split('-'); parts.pop();
      value  = parts.join('-').replace('T', ' ');
      result = Date.parse(value);
    }
    return result;
  };
  Date.format = 'yyyy-MM-ddTHH:mm:ssZ';

  var Time = {
    create: function(value){
      var d = new Date();
      var time = value.match(/(\d+)(?::(\d\d))?\s*(p?)/);
      d.setHours( parseInt(time[1]) + (time[3] ? 12 : 0) );
      d.setMinutes( parseInt(time[2]) || 0 );
      return d;
    }
  };

  //override if you prefer a different format.
  _.extend(Date, {template: 'yyyy-MM-dd'});
  _.extend(Time, {template: 'hh:mm tt'  });

  var exports = {
    Date: Date,
    Time: Time
  };

  return exports;

});
