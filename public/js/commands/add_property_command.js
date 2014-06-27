define(['command', 'models/topic'], function(Command, Topic){

  var AddPropertyCommand = Command.extend({ //abstract
    name: undefined, //abstract
    type: undefined, //abstract
    description: 'adds a property to a topic',
    parse: function(text){
      var type, value = '';
      if (text.includes(':')) {
        var parts = text.split(':').map(function(part){
          return part.trim();
        });
        type = parts.shift().toLowerCase();
        value = parts.shift();
      } else {
        type = text.toLowerCase();
      };
      return {type: type, value: value};
    },
    targets: function(target){
      return target instanceof Topic;
    },
    execute: function(){
      var topic = this.subject;
      var property = topic[this.type](this.options);
      return property
    }
  });
  
  AddPropertyCommand.create = function(type){ //factory method
    return AddPropertyCommand.extend({
      name: 'add_' + type,
      type: type,
      description: 'adds a ' + type + ' to a topic'
    });
  };
  
  return AddPropertyCommand;

});