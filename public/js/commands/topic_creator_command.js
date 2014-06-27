define(['command', 'models/topic_map', 'underscore'], function(Command, TopicMap, _){

  var TopicCreatorCommand = Command.extend({
    name: '!',
    description: 'topic creator',
    targets: function(subject){
      return subject instanceof TopicMap;
    },
    parse: function(text){
      var tm = this.subject, assignmentOps = [':','='];
      var clauses = _.cluster(_.dissect(text, {separators: [' '], punctuations: assignmentOps.concat([';'])}), ';');
      var names = [];
      var name  = [];

      var options = {
        names: [],
        occurrences: [],
        scopes: [],
        types : [],
        tags  : []
      }

      var singleWord = function(word){
        var context = '';
        _.each(contexts, function(keyword, symbol){
          if (word.startsWith(symbol)) {
            context = keyword;
            word = word.substring(1);
          }
        });

        if (_.values(contexts).contains(context)){
          options[context].push(word);
        } else {
          name.push(word);
        }
      };

      var isProperty = function(words){
        return words.length > 1 && assignmentOps.include(words[1]);
      };

      var toProperty = function(words){
        var type = words.shift(); words.shift(); //discard assignment operator
        var value = words.length === 1 ? words[0] : words;
        return {type: type, value: value};
      };

      clauses.each(function(words){
        if (isProperty(words)) {
          var property = toProperty(words);
          options[tm.property_method(property.type).pluralize()].push(property);
        } else {
          words.each(singleWord);
          if (name.length > 0) names.push(name.join(' '));
          name = [];
        }
      });

      names.each(function(name){
        var name_type = null;
        options.types.each(function(type){
          name_type = tm.term(type).default_name_type();
          return !name_type;
        });
        options.names.push({type: name_type || 'name', value: name});
      });

      return options;
    },
    execute: function(sender){
      var tm = this.subject;
      var context = sender.context;
      var options = this.options;

      ['scopes', 'types'].each(function(list){ //TODO: tags too!
        options[list] = options[list].concat(context[list].toArray());
      });

      return tm.topic(options);
    }
  });

  var contexts = {
    '$': 'scopes',
    '@': 'types',
    '#': 'tags'
  };

  return TopicCreatorCommand;

});