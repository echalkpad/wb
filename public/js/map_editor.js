define([
  'backbone',
  'underscore/logger',
  'client',
  'commands',
  'database',
  'change_log',
  'request_bar',
  'mode_bar',
  'commands/topic_creator_command',
  'models/document',
  'models/topic_map',
  'mediator',
  'workspaces',
  'router',
  'set',
  'command_line',
  'topic_map_importer',
  'job_list'
 ], function(
  Backbone,
  _,
  Client,
  Commands,
  Database,
  ChangeLog,
  RequestBar,
  ModeBar,
  TopicCreatorCommand,
  Document,
  TopicMap,
  Mediator,
  Workspaces,
  Router,
  Set,
  CommandLine,
  importer,
  JobList
 ){

  //Views should be neither directly imported nor instantiated within this module.

  var db            = new Database();
  var change_log    = new ChangeLog(db, ['topic_maps', 'topics', 'associations']);
  var client        = new Client('admin', 'cabbage-rolls-and-coffee', db), user = client.user;
  var mediator      = new Mediator();
  var workspaces    = new Workspaces(); workspaces.add(); //workspaces.add();
  var router        = new Router();
  var header        = new Set().flat();
  var footer        = new Set().flat();
  var context       = {scopes: new Set().flat(), types: new Set().flat(), tags: new Set().flat(), maps: new Set().flat()};
  var mode_bar      = new ModeBar();
  var commands      = new Commands;
  var jobs          = new JobList(); //organizational tool for keeping things logically grouped.

  //TODO: disable map-based controls when map is not loaded.

  _.extend(Document.prototype, {
    db: function(){
      return client;
    },
    isDirty: function(){
      return !!change_log.find(this.id);
    }
  });

  db.each(function(collection, key){
    collection.bind('isolate', function(model){
      workspaces.isolate(model);
    });
    collection.bind('close', function(model){
      workspaces.remove(model);
    });
    collection.bind('all', function(event_name){
      var args = _.toArray(arguments); args.shift(); args.unshift(key + ':' + event_name);
      mediator.trigger.apply(mediator, args);
    });
  });
  db.topic_maps.bind('searched', function(topics){
    workspaces.receive(topics);
  });
  db.topics.bind('clone', function(clone, source){
    workspaces.receive(clone);
  });

  //TODO: standard on event names -- use present or past tense?  backbone seems to use method name (verb) but this doesn't address the before/after concept. e.g. adding/added.
  workspaces.bind('workspace:isolated', function(workspace, model){
    mediator.trigger('isolated', workspace, model, this);
  });
  workspaces.bind('workspace:already-isolated', function(workspace, model){
    mediator.trigger('already-isolated', workspace, model, this);
  });
  workspaces.bind("workspace:find", function(workspace, model){
    mediator.trigger("workspace:find", workspace, model, this);
  });
  workspaces.bind("workspace:added", function(workspace){
    mediator.trigger("workspace:added", workspace, this);
  });

  router.bind('retrieved', workspaces.receive);
  router.bind('topic:retrieve:failed', function(topic, tm){
    mediator.trigger('topic:retrieve:failed');
  });
  router.bind('topic_map:retrieve:failed', function(topic_map, tm){
    mediator.trigger('topic_map:retrieve:failed');
  });

  mediator.bind('change:topic_map', function(){
    var tm = this.topic_map();
    router.topic_map(tm);
  });

  var findModel = function(workspace, model){
    var url = model ? model.url() : '';
    router.navigate('#' + url);
  };

  workspaces.bind("workspace:find workspace:isolated", findModel);

  workspaces.bind("received", function(items){
    items.each(function(item){
      router.navigate('#' + item.url()); //NOTE: all models (even config type models) should provide urls and routing
    });
  });

  //TODO: test again
  var saved = function(results){
    var message = result.success.length == 0 ? "Nothing saved" : "Saved {0} changes".plug(result.success.length);
    if (result.error.length > 0) {
      message = message + '  There were errors.';
    }
    mediator.trigger('saved', message);
  };

  var save = function(){
    change_log.persist(saved);
  };

  var monitorAccess = function(action, model, serialized, access){
    var name = ['access', action, access].join(':');
    _.logger(name).dir({access: access, serialized: serialized, model: model});
  };

  client.bind("denied granted" , monitorAccess);
  client.bind("loaded", function(tm){
    mediator.topic_map(tm);
  });
  client.bind("fetching:failed", function(iri, resp){
    console.log('fetch failed', iri, resp); //TODO: notification
  });

  return {
    client: client,
    change_log: change_log,
    mediator: mediator,
    workspaces: workspaces,
    router: router,
    jobs: jobs,
    header: header,
    footer: footer,
    commands: commands,
    save: save,
    context: context,
    importer: importer,
    mode_bar: mode_bar
  };

});
