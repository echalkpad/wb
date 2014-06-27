define(['map_editor', 'class', 'command', 'cycle_command', 'commands', 'models/topic_map', 'models/topic', 'models/document', 'underscore', 'commands/topic_query_command', 'commands/topic_creator_command', 'views/article_view'], function(MapEditor, Class, Command, CycleCommand, Commands, TopicMap, Topic, Document, _, TopicQueryCommand, TopicCreatorCommand, ArticleView){

  var commands   = MapEditor.commands,
      client     = MapEditor.client,
      workspaces = MapEditor.workspaces,
      change_log = MapEditor.change_log,
      router     = MapEditor.router,
      save       = MapEditor.save;

  commands.add({
    name: 'test01',
    description: 'test',
    execute: function(){ //pluckProperties extracts occurrence and name types from incoming data.
      return this.subject.topic({types: ['man'], name: "Harold", age: 40});
    }
  });

  ArticleView.commands.add({
    name: 'import',
    targets: function(target){
      return target.import;
    },
    execute: function(button){
      var textarea = $(button).closest('article').find('textarea');
      var text = textarea.val();
      textarea.attr({readonly: 'readonly'});
      return this.subject.import(text);
    }
  });

  //client.bind("fetched", commands.george);

  //TODO: rather than define command groups on the command define them within the commands list object.
  //TODO: 'show' command should accept an argument that denotes view type (so tabluar view can be specified).  e.g. typed man|w --table
  commands.add(Command.extend({
    name: 'show',
    description: 'shows model(s) in the workspace',
    targets: function(subject){
      return ArticleView.views.targets(subject).count() > 0; //does any view target this kind of subject?
    },
    execute: function(){
      var model_or_models = this.subject;
      model_or_models && workspaces.receive(model_or_models);
      return model_or_models;
    }
  }).alias('w'));

/*
  var ShowHeadersCommand = Command.extend({
    name: 'show_headers',
    label: 'Headers: Show',
    description: 'show section headers',
    targets: function(target){
      return target instanceof ArticleView && target.sectional !== false;
    },
    execute: function(){
      this.subject.$el.removeClass('plain');
      return this.subject;
    }
  });

  var HideHeadersCommand = Command.extend({
    name: 'hide_headers',
    label: 'Headers: Hide',
    description: 'hide section headers',
    targets: function(target){
      return target instanceof ArticleView && target.sectional !== false;
    },
    execute: function(){
      this.subject.$el.addClass('plain');
      return this.subject;
    }
  });

  ArticleView.commands.add(CycleCommand.create(HideHeadersCommand, ShowHeadersCommand));
*/

  //TODO: convert to test.
  commands.add({
    name: 'as',
    description: 'test as',
    execute: function(){

      var Chatty = {
        speak: function(){
          console.log('said: ' + this.join(' '));
          return this;
        }
      };

      var County = {
        count: function(){
          console.log('count: ' + this.length.toString());
          return this;
        }
      };

      var SelectAspect = function(){
        var self = this;
        this.select = _.wrap(this.select, function($super, fn){
          console.log('select aspect');
          return $super.call(self, fn);
        });
      };

      var blotted = function(){
        throw "method not supported";
      };
      blotted.tag = 'blotted';

      var BlotOutReject = function(){
        this.reject = null; //this is how we blot out a method... (or we could pass the blotted fn but this is simpler to read in the debugger)
      };

      var Enhanced = [Chatty, County, SelectAspect, BlotOutReject];

      var List = function(){
        var array = _.toArray(arguments);
        var begetters = _.clone(Array.begetters);
        begetters.take('reject'); //...more blotting
        return _.as(array, Enhanced, begetters);
      };

      var Set = function(){
        var array = _.toArray(arguments);
        var begetters = _.clone(Array.begetters);
        return _.as(array, Set.features, begetters);
      };

      Set.features = [function(){
        this.push = _.wrap(this.push, function(){
          var args = _.toArray(arguments), $super = args.shift(), item = args.shift();
          if (!this.contains(item))
            return $super.call(this, item);
          return null;
        });
      }];

      var stooges = new Set('larry','curly','moe');
      stooges.push('corey');
      stooges.push('larry');
      var wordy = stooges.select(function(stooge){
        return stooge.length > 3;
      });
      wordy.push('doug');

      var list = new List('every','good','boy','does','fine'); //['every','good','boy','does','fine'].as(Enhanced);
      var cards = ['ace','queen','king','jack'].reject(function(card){ //reject still lives on array!
        return card.length < 4;
      });
      list.speak().count();

      var list2 = list.select(function(item){
        return item.length > 3;
      });

      list2.speak().count();

      var list3 = list2.select(function(item){
        return item.chars().indexOf('o') !== -1;
      });

      list3.speak().count();

      /* var list4 = list3.reject(function(item){ //should fail!
        return item === 'does';
      }); */

      return list3;

    }
  });

  ArticleView.commands.add({
    name: 'clone',
    description: 'creates a clone of the topic',
    targets: function(subject){
      return subject instanceof Topic;
    },
    execute: function(){
      return this.subject.clone();
    }
  });

  ArticleView.commands.add({
    name: 'isolate',
    description: 'closes all items but this one',
    targets: function(subject){
      return subject.isolate;
    },
    execute: function(){
      return this.subject.isolate();
    }
  });

  ArticleView.commands.add({
    name: 'expand',
    description: 'expand all sections',
    targets: function(subject){
      return subject.expand;
    },
    execute: function(){
      return this.subject.expand();
    }
  });

  ArticleView.commands.add({
    name: 'collapse',
    description: 'collapse all sections',
    targets: function(subject){
      return subject.collapse;
    },
    execute: function(){
      return this.subject.collapse();
    }
  });

  ArticleView.commands.add({
    name: 'conform',
    group: function(subject){
      return 'mods';
    },
    targets: function(subject){
      return subject.conform;
    },
    execute: function(){
      return this.subject.conform();
    }
  });

  ArticleView.commands.add({
    name: 'shed',
    group: function(subject){
      return 'mods';
    },
    targets: function(subject){
      return subject.shed;
    },
    execute: function(){
      return this.subject.shed();
    }
  });

  ArticleView.commands.add({
    name: 'trim',
    group: function(subject){
      return 'mods';
    },
    targets: function(subject){
      return subject.trim;
    },
    execute: function(){
      return this.subject.trim();
    }
  });

  ArticleView.commands.add({
    name: 'check',
    description: 'validates topic and flags any errors',
    targets: function(subject){
      return subject instanceof Topic;
    },
    execute: function(){
      return this.subject.check().publish();
    }
  });

  ArticleView.commands.add({
    name: 'inspect',
    description: 'logs the item to the console for inspection',
    targets: function(subject){
      return subject.inspect;
    },
    execute: function(){
      return this.subject.inspect();
    }
  });

  ArticleView.commands.add({
    name: 'json',
    description: 'logs a JSON-serialized version of the item to the console',
    targets: function(subject){
      return subject.toJSON;
    },
    execute: function(){
      return this.subject.toJSON();
    }
  });

  ArticleView.commands.add({
    name: 'delete',
    description: 'deletes the item (this is not final until the workspace is saved)',
    targets: function(subject){
      return subject.delete;
    },
    execute: function(){
      return this.subject.delete();
    }
  });

  //TODO: create a shortcut for defining commands following a template -- e.g. commands.add('add_association')... and it derives the rest.
  ArticleView.commands.add({
    name: 'add_association',
    targets: function(subject){
      return subject.addAssociation;
    },
    execute: function(sender){
      return this.subject.addAssociation(sender);
    }
  });

  ArticleView.commands.add({
    name: 'add_attribute',
    targets: function(subject){
      return subject.addAttribute;
    },
    execute: function(sender){
      return this.subject.addAttribute(sender);
    }
  });

  ArticleView.commands.add({
    name: 'refresh',
    description: 'refreshes the view of the item',
    targets: function(subject){
      return subject.refresh;
    },
    execute: function(){
      return this.subject.refresh();
    }
  });

  ArticleView.commands.add({
    name: 'transform',
    description: 'provides an alternate view of the item',
    targets: function(subject){
      return subject.transform;
    },
    execute: function(){
      return this.subject.transform();
    }
  });

  ArticleView.commands.add({
    name: 'close',
    description: 'closes the item',
    targets: function(subject){
      return subject.close;
    },
    execute: function(){
      return this.subject.close();
    }
  });

  commands.add(TopicQueryCommand);
  commands.add(TopicCreatorCommand);

  //TODO: convert to test
  commands.add({
    name: 'george',
    description: 'creates george',
    targets: function(subject){
      return subject instanceof TopicMap;
    },
    execute: function(){
      var fred = this.subject.topics().named('Fred Flintstone').first();
      workspaces.receive(fred);
      var person = tm.topics().identified('person').first();
      var george = tm.topic({type: "man", name: 'Curious George'}, function(){
        this.set({age: 90});
      });
      george.set({first_name: "George"});
      var n = george.names().first();
      n.set({value: "Georgie"});
      workspaces.receive(george);
      return george;
    }
  });

  commands.add({
    name: 'rename',
    description: 'renames a topic',
    targets: function(subject){
      return subject instanceof Topic;
    },
    parse: function(text){
      var names = text.split(" ");
      var options = names.length > 1 ? {'old': names[0], 'new': names[1]} : {'new': names[0]};
      return options;
    },
    execute: function(){
      var names = this.subject.names();
      names = this.options.old ? names.value(this.options.old) : names;
      var name = names.first();
      name && name.value(this.options.new);
      return name;
    }
  });

  commands.add({
    name: 'clear',
    description: 'clears workspaces',
    execute: function(){ //don't change the subject (nothing is returned); this allows piped commands like "clear|value age between 30 40|w"
      workspaces.invoke('clear');
    }
  });

  commands.add({
    name: 'value',
    description: 'find topics by value',
    parse: function(text){
      var parts = text.split(' ');

      if (parts.length === 1)
        return {eq: text};

      var type = parts.shift();
      var op   = parts.shift();
      var value = ['in','between'].contains(op) ? parts : parts.shift();
      var options = {type: type};
      options[op] = value;
      return options;
    },
    execute: function(){
      var tm = this.subject;
      var type = this.options.type; delete this.options.type;
      return tm.properties().isa(type).value(this.options).topics().all();
      //SLOWER: tm.topics().property(this.options).all();
    }
  });


  commands.add({
    name: 'first',
    description: 'gets first model in workspace (useful when piping other commands)',
    execute: function(){
      return workspaces.first().first();
    }
  });

  //TODO: enforce admin usage only.
  commands.add({
    name: 'invoke',
    description: 'executes a method (or chain of dot-separated methods) by name',
    parse: function(text){
      return {methods: text.split('.')};
    },
    execute: function(){
      var result = this.subject;
      this.options.methods.each(function(method){
        result = result[method]();
      });
      return result;
    }
  });

  commands.add({
    name: 'topics',
    description: 'returns a topic query',
    targets: function(subject){
      return subject.topics;
    },
    execute: function(){
      return this.subject.topics();
    }
  });

  commands.add({
    name: 'roles',
    description: 'returns the roles of a topic',
    targets: function(subject){
      return subject.roles;
    },
    execute: function(){
      return this.subject.roles();
    }
  });

  commands.add({
    name: 'associations',
    description: 'returns the associations of a topic',
    targets: function(subject){
      return subject.associations;
    },
    execute: function(){
      return this.subject.associations();
    }
  });

  commands.add({
    name: 'kill',
    description: 'destroys a document',
    targets: function(subject){
      return subject instanceof Document;
    },
    execute: function(){
      this.subject.detach();
      return this.subject;
    }
  });

  commands.add({
    names: ['clog', 'change_log'],
    description: 'logs all changes',
    execute: function(){
      return change_log;
    }
  });

  commands.add({
    name: 'check',
    description: 'logs errors on topic',
    targets: function(subject){
      return subject.check;
    },
    execute: function(){
      return this.subject.check();
    }
  });

  /* TODO: add to test suite (this is a multiset)
      var fred = this.subject.topics().named('Fred Flintstone').first();
      fred.set('age', 'THIRTY', 'desired_offspring', [2,2]);
      return fred;
  */

  commands.add({
    name: 'load',
    description: '',
    parse: function(text){
      return {iri: text};
    },
    execute: function(){
      return client.fetch(this.options.iri);
    }
  });

  commands.add({
    name: 'named',
    description: 'finds a topics by name',
    targets: function(subject){
      return subject.topics || true;
    },
    parse: function(text){
      return {name: text};
    },
    execute: function(){
      var topics = this.subject.topics ? this.subject.topics() : this.subject;
      return topics.named(this.options.name).all(); //TODO: make named (and other searches) case insensitive
    }
  });

  commands.add({
    name: 'name',
    description: 'adds a name to a topic',
    targets: function(subject){
      return subject instanceof Topic;
    },
    parse: function(text){
      return {name: text};
    },
    execute: function(){
      this.subject.name({value: this.options.name});
      return fred;
    }
  });

  commands.add({
    name: 'json',
    description: 'serializes an object to json',
    targets: function(subject){
      return subject.toJSON;
    },
    execute: function(){
      return this.subject.toJSON(); //TODO: options for includes: this.subject.toJSON({include: ['names']});
    }
  });

  commands.add({
    name: 'invalid',
    description: 'returns invalid topics',
    targets: function(subject){
      return subject instanceof TopicMap;
    },
    execute: function(){
      return this.subject.topics().invalid().all();
    }
  });

  commands.add({
    name: 'save',
    description: 'saves the topic map',
    execute: save
  });

  return commands;

});
