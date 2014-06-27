define(['command'], function(Command){

  var AddTypeCommand = Command.extend({ //abstract
    name: 'add_type',
    description: 'adds a type to map',
    type: undefined, //override
    parse: function(text){
      var type = this.type;
      var types = text.toLowerCase().split(' ').map(function(iid){
        var options = {iid: iid};
        if (type) options.type = type;
        return options;
      }, this);
      return {types: types};
    },
    execute: function(){
      var tm = this.subject;
      return this.options.types ? this.options.types.select(function(options){
        return tm.term(options.iid).unknown(); //don't redefine terms that already exist. //TODO: may have to check the native map only.
      }).map(function(options){
        return tm.topic(options);
      }) : [];
    }
  });
  
  AddTypeCommand.create = function(type){ //factory method
    return AddTypeCommand.extend({
      name: 'add_' + type,
      description: 'adds a ' + type + ' type',
      type: type
    });
  };

  return AddTypeCommand;

});