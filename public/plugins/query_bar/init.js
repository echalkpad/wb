define(['map_editor', 'request_bar', 'commands/topic_query_command'], function(MapEditor, RequestBar, TopicQueryCommand){

  var mediator      = MapEditor.mediator,
      context       = MapEditor.context,
      workspaces    = MapEditor.workspaces,
      mode_bar      = MapEditor.mode_bar;
  var query_bar     = new RequestBar(TopicQueryCommand);

  query_bar.context = context;

  query_bar.bind('requested', function(results, options){
    mediator.trigger('searched', results, options); //TODO: better way to aggregate without matching param names?
  });
  query_bar.bind('suppressed', function(suppressions){
    mediator.trigger('query_bar:suppressed', query_bar, suppressions);
  });

  query_bar.bind('requested', workspaces.receive);
  query_bar.bind('searched' , workspaces.receive);

  mode_bar.add({mode: 'query', image: '/images/icons/magnifier.png', placeholder: 'Search', command: query_bar});

  mediator.bind('change:topic_map', function(){
    query_bar.topic_map(this.topic_map());
  });

  return query_bar;

});