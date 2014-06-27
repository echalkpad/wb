define(['map_editor', 'command_line'], function(MapEditor, CommandLine){

  var commands      = MapEditor.commands,
      mediator      = MapEditor.mediator,
      context       = MapEditor.context,
      mode_bar      = MapEditor.mode_bar;
  var command_line  = new CommandLine(commands);

  command_line.context = context;

  command_line.bind('command:executed', function(command, details, result){
    mediator.trigger('command:executed', command, details, result);
  });
  command_line.bind('command:rejected', function(command, details){
    mediator.trigger('command:rejected', command, details);
  });

  mode_bar.add({mode: 'command', image: '/images/icons/term.png', placeholder: 'Command', command: command_line});

  mediator.bind('change:topic_map', function(){
    command_line.topic_map(this.topic_map());
  });

  return command_line;

});