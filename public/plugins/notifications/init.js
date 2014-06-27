define(['map_editor', './js/notifications'], function(MapEditor, Notifications){

  var mediator      = MapEditor.mediator;
  var client        = MapEditor.client;
  var notifications = MapEditor.notifications = new Notifications();

  mediator.bind('all', function(event_name){
    //if (notifications.enabled())
    //  console.log('mediator -> ' + event_name, arguments);
  });

  mediator.bind('topic_map:created', function(tm){
    notifications.add('Created topic map ' + tm.iri());
  });

  mediator.bind('topic:retrieve:failed', function(){
    notifications.add('Could not locate topic.');
  });

  mediator.bind('topic_map:retrieve:failed', function(failed_ids){
    notifications.add('Could not locate topic map.');
  });

  //TODO: translate meaningful events to notifications.  aggregate all meaningful events to the mediator.
  mediator.bind('isolated', function(workspace, model, workspaces){
    notifications.add("Isolated <a href='#" + model.url() + "'>" + model.name() + "</a>."); //SOMEDAY: use wiki markup (e.g. template) for plugging a model into html text.
  });
  mediator.bind('already-isolated', function(workspace, model, workspaces){
    notifications.add("<a href='#" + model.url() + "'>" + model.name() + "</a> is already isolated."); //TODO: use wiki markup (e.g. template) for plugging a model into html text.
  });
  mediator.bind('searched', function(results, text, options){
    var subject = results.length + " result" + (results.length === 1 ? "" : "s");
    var messages = [];
    var elapsed = results.benchmarks.reduce(function(seconds, feedback){
      return seconds + feedback.seconds
    }, 0);

    if (results.length === 1) {
      messages.push("Search for '" + text + "' located <a href='#" + results[0].url() + "'>" + subject + "</a> in " + elapsed + " seconds.");
    } else {
      messages.push("Search for '" + text + "' located " + subject  + " in " + elapsed + " seconds.");
    }
    if (results.suppressions.length > 0)
      messages.push("Some results were suppressed because of vague criteria.  Please specify '*' to allow for wider results.");

    notifications.add(messages.join('  '));
  });
  mediator.bind('command:executed', function(command, details, result){
    notifications.add('Executed command: ' + command, {type: details.error ? 'error' : 'success'});
    console.log("executed command: " + command, details, result);
  });
  mediator.bind('command:rejected', function(command, details){ //TODO: standard for events with colon nodes? subject/verb or verb/subject, etc.  standard for all event names.
    notifications.add('Unknown command: ' + command);
    console.log("rejected command: " + command, details);
  });

  client.bind("fetching", function(iri){
    notifications.add('Requested map: ' + iri);
  });

  client.bind("fetching:failed", function(iri, resp){
    if (resp.xhr.status !== 404) notifications.add('Unable to load map: ' + iri);
  });

  client.bind("fetched", function(tm){
    notifications.add('Loaded map: ' + tm.iri());
  });

  return notifications;

});
