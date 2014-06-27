define(['map_editor', 'request_bar', 'commands/topic_creator_command'], function(MapEditor, RequestBar, TopicCreatorCommand){

  var mediator      = MapEditor.mediator,
      context       = MapEditor.context,
      workspaces    = MapEditor.workspaces,
      mode_bar      = MapEditor.mode_bar;
  var entry_bar     = new RequestBar(TopicCreatorCommand);

  entry_bar.context = context;

  entry_bar.bind('requested', function(results, options){
    mediator.trigger('created', results, options); //TODO: better way to aggregate without matching param names?
  });

  entry_bar.bind('requested', workspaces.receive);

  mode_bar.add({mode: 'entry', image: '/images/icons/write.png', placeholder: 'Enter Topic', command: entry_bar});

  mediator.bind('change:topic_map', function(){
    entry_bar.topic_map(this.topic_map());
  });

  return entry_bar;

});