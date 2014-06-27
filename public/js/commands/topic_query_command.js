define(['command', 'models/topic_map', 'underscore', 'set'], function(Command, TopicMap, _, Set){

  var TopicQueryCommand = Command.extend({
    name: '?',
    description: 'topic query',
    targets: function(subject){
      return subject instanceof TopicMap;
    },
    //EXAMPLES: (quotes are required only around values containing spaces; separate all clauses with a comma)
    //@man, name = 'Fred Flintstone', age between 18 65
    //+@woman, Wilma (AND operator is comma)
    //'Pebbles Flintstone'
    //-@woman, Fred
    //@woman * (must be explict about returning everything when vague criteria is provided)
    //@woman, Wilma; @man, Fred (OR operator is semicolon)
    //Fred ` (first topic named Fred. use backtick to get just a single result.  this will usually perform better.)
    parse: function(text){
      var queries = _.cluster(_.dissect(text), ';');
      var parsed = queries.map(function(query){
        var clauses = _.cluster(query, ',');

        var options = {
          volume: null, //all or first
          names : [],
          vague : null,
          properties: [],
          resets: [],
          scopes: [],
          types : [],
          tags  : [],
          plus  : {
            scopes: [],
            types : [],
            tags  : []
          },
          minus : {
            scopes: [],
            types : [],
            tags  : []
          }
        }

        var singleWord = function(word){
          var cache = '';
          _.each(caching, function(keyword, symbol){
            if (word.startsWith(symbol)){
              cache = keyword;
              word  = word.substring(1);
            }
          });

          var context = '';
          _.each(contexts, function(keyword, symbol){
            if (word.startsWith(symbol)) {
              context = keyword;
              word = word.substring(1);
            }
          });

          if (_.values(contexts).contains(context)){ //is context
            if (word.length === 0) {
              options.resets.push(context);
            } else {
              if (cache !== 'minus')
                options[context].push(word);
              if (options[cache])
                options[cache][context].push(word);
            }
          } else if (_.keys(volumes).contains(word)) { //is volume
            options.volume = options.volume || _.detect(volumes, function(volume, symbol){
              return symbol === word;
            });
          } else {
            options.names.push(word);
          }
        };

        var property = function(clause){
          var type = clause.shift();
          var op = clause.shift();
          var value = clause.length === 1 ? clause[0] : clause;
          var result = {type: type};
          result[op] = value;
          return result;
        }

        clauses.each(function(words){
          if (words.length === 1 || (words.length === 2 && _.intersection(words, _.keys(volumes)).length > 0)) {
            words.each(singleWord);
          } else {
            options.properties.push(property(words));
          }
        });

        options.vague = options.names.length + options.properties.length === 0;

        return options;
      });

      return parsed;
    },
    execute: function(sender){
      var queries = this.options;
      var suppressions = [];
      var context = sender.context;
      var tm = this.subject;
      var benchmarks = [];

      var results = queries.map(function(options){
        options.resets.each(function(target){
          context[target].clear();
        });

        var query = tm.topics();
        var methods = {'scopes': 'scope', 'types': 'isa', 'tags': 'tag'};

        _.values(contexts).each(function(kind){
          var cached = context[kind];
          cached.add(options.plus[kind]);
          cached.remove(options.minus[kind]);
          var list = options[kind].concat(cached._items).uniq();
          var method = methods[kind];
          query = query[method](list);
        });

        options.names.each(function(name){
          query = query.named(name); //TODO: make this case insensitive (e.g. "wilma" not "Wilma")
        });

        options.properties.each(function(property){
          query = query.property(property)
        });

        var suppress = options.vague && _.isNull(options.volume); //suppress vague queries if the desired volume is not explicit.
        var results = [];

        if (suppress){
          suppressions.push(query);
        } else {
          var method = query[options.volume || 'all']; //default to "all" if the desired volume is not explicit.
          var feedback = _.benchmark('query', method, query, _.bind(console.log, console));
          benchmarks.push(feedback);
          results = feedback.results;
        }

        return results;
      });

      results = results.flatten().uniq();
      results.suppressions = suppressions;
      results.benchmarks = benchmarks;

      return results;
    }
  });

  var volumes = {
    '*': 'all',
    '=': 'first'
  };

  var caching = {
    '+': 'plus',
    '-': 'minus'
  };

  var contexts = {
    '$': 'scopes',
    '@': 'types',
    '#': 'tags'
  };

  return TopicQueryCommand;

});
