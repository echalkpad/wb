define(['set', 'command'], function(Set, Command){

  //NOTE: considered building this collection from a Dictionary, but decided against it since we can add multiple commands having the same name but different subjects.
  var Commands = Set.extend({
    className: 'Commands',
    init: function(items){
      this._super();
      this.flat();
      this.validates(function(item){ //is this a command?
        var proto = item.prototype;
        return proto.names && _.isFunction(proto.init) && _.isFunction(proto.execute) && _.isFunction(proto.permits) && _.isFunction(proto.targets);
      });
      if (items) this.add(items);
    },
    cast: function(items){
      return new Commands(items);
    },
    add: function(){
      var self = this;
      var args = _.toArray(arguments);
      var items = args.map(function(command){
        return command.extend ? command : Command.extend(command); //pass in ether an object template or an actual Command class.
      });
      return this._super.apply(this, items);
    },
    permits: function(actor){
      return new Commands(this.select(function(command){
        return command.prototype.permits(actor);
      }));
    },
    targets: function(subject){ //TODO: similar to mixin enumerables (Roles, Topics, etc.) how to we make a method (a pattern) recast itself to the same thing?  e.g. targets returns a new Commands object.
      return new Commands(this.select(function(command){
        return command.prototype.targets(subject);
      }));
    },
    template: function(name, subject){
      var candidates = this.targets(subject).reverse(); //last in takes precedence.
      return candidates.detect(function(command){ 
        return command.prototype.names.contains(name);
      });
    },
    create: function(name, subject, options){
      var template = this.template(name, subject);
      return template ? new template(subject, options) : null;
    }
  });
  
  return Commands;

});
