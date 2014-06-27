define(['command'], function(Command){

  var CycleCommand = Command.extend({ //abstract class
    commands: null, //abstract: a list of Commands to cycle thru.
    execute: function(sender){
      var name = $(sender).attr('class');
      var Template = this.commands.detect(function(command){
        return command.prototype.names.contains(name);
      });
      var idx = this.commands.indexOf(Template);
      var next_command = this.commands[idx + 1] || this.commands[0];
      var next_name = next_command.prototype.names.first();
      var label = next_command.prototype.label || next_name.titleize();
      var description = next_command.prototype.description;
      $(sender).attr('class', next_name).attr({title: description}).text(label);
      var command = new Template(this.subject, this.options);
      return command.execute(sender);
    },
    permits: function(actor){
      return this.commands.all(function(command){
        return command.prototype.permits(actor);
      })
    },
    targets: function(subject){
      return this.commands.all(function(command){
        return command.prototype.targets(subject);
      })
    }
  },{
    create: function(){ //factory method
      var commands = _.toArray(arguments);
      var start = commands.first().prototype;
      return CycleCommand.extend({
        name: start.name,
        label: start.label,
        description: start.description,
        commands: commands
      });
    }
  });

  _.aspect(CycleCommand, 'extend', Command.aliases);

  return CycleCommand;

});