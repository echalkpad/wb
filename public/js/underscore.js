define(['datetime', 'js!vendor/underscore.js!order', 'js!vendor/underscore.string.js!order'], function(DateTime){

  var mixins = {
    Array: {},
    Collection: {},
    Function: {},
    String: {}
  };

  var benchmarkSeed = 0;

  var doNothing = function(){
  };

  var as = {
    sort: function(array){
      var orig = _.clone(array);

      var sortKey = function(obj){ //begetters come last; functions and objects should maintain their original position.
        return _.isString(obj) ? obj : orig.indexOf(obj).toString().lpad(5, '0');
      };

      var sorter = function(obj1, obj2){
        var key1 = sortKey(obj1), key2 = sortKey(obj2);
        return (key1 > key2) ? 1 : ((key1 < key2) ? -1 : 0);
      };

      return array.sort(sorter);
    }
  };

  _.mixin({
    /* ARRAY */
    give: function(array, item){ //adds an item to an array if the item is not already present.  e.g. behave as a `Set`.
      if (!_.include(array, item)){
        array.push(item);
      }
      return array;
    },
    take: function(array, item){
      var idx = array.indexOf(item);
      idx > -1 && array.splice(idx, 1);
      return array;
    },
    refill: function(array, other){ //for when you want to maintain a potentially referenced array
      array.splice(0, array.length); //clear...
      array.splice.apply(array, [0, 0].concat(other)); //...and replace the contents.
      return array;
    },
    array: function(array){ //native _.toArray function recurses infinitely when trying to convert an array to an array.
      array = array || {};
      return _.isArray(array) ? array : (_.isString(array) ? [array] : _.toArray(array));
    },
    multiple: function(item_or_array){
      return _.isArray(item_or_array) ? item_or_array : [item_or_array];
    },
    partition: function(array, fn) {
      var selected = [], rejected = [];
      _.each(array, function(item, index, list){
        (fn.call(item, item, index, list) ? selected : rejected).push(item);
      });
      return [selected, rejected];
    },
    coalesce: function(array, fn){
      if (fn) {
        var result;
        var found = false;
        _.each(array, function(item){
          if (!found) {
            result = fn(item);
            found = !!result;
          }
        });
        return result;
      } else {
        return _.detect(array, function(item){
          return !!item;
        });
      }
    },
    process: function(items, process, callback, options){ //asynchronous item processing
      options = _.defaults(options || {}, {gap: 25, duration: 10000, batchSize: 20});
      callback || (callback = _.doNothing);
      var gap = options.gap, duration = options.duration;
      var wait = setTimeout; //gap === 0 && setImmediate ? setImmediate : setTimeout;
      var todo = items.concat(); //create a clone of the original
      var work = function(){
        var sw = _.stopwatch().start();
        var batchSize = options.batchSize;
        while((sw.duration || 0) < duration && batchSize > 0 && todo.length > 0) {
          process(todo.shift());
          sw.stop();
          batchSize -= 1;
        }
        if (todo.length > 0){
          wait(work, gap);
        } else {
          callback(items);
        }
      }
      wait(work, gap);
      return items;
    },
    //https://gist.github.com/1187555
    //rolls an array of key/value pairs into an object
    roll: function(){
      var args = _.toArray(arguments);
      if (args.length == 1) {
        var firstItem = _.first(args);
        if (_.isArray(firstItem)){
          args = firstItem;
        } else {
          return firstItem;
        }
      }
      var object = {};
      for(var idx = 0; idx < args.length; idx += 2){
        var key = args[idx], value = args[idx + 1];
        object[key] = value;
      }
      return object;
    },
    //unrolls an object into an array of key/value pairs
    unroll: function(object){
      var array = [];
      _.each(object, function(value, key){
        array.push(key); array.push(value);
      });
      return array;
    },
    sets: function(array, size, fn, context){
      context = context || array;
      for (var i = 0; i <= array.length - 1; i += size){
        var items = array.slice(i, size);
        fn.apply(context, items);
      }
    },
    pairs: function(array, fn, context){
      return _.sets(array, 2, fn, context);
    },

    /* EVENT */

    //allows an event in a child model to be bubbled up through its parents.
    bubbleEvents: function(child, parent, prefix, events){
      events = events || "all";
      return child.bind(events, function(){
        var args = _.toArray(arguments);
        var event_name = args.shift();
        args.unshift(child);
        args.unshift(prefix + ":" + event_name);
        parent.trigger.apply(parent, args);
      });
    },

    /* OBJECT */
    using: function(object, fn){ //with statement substitute
      fn.call(object, object);
      return object;
    },
    extract: function() { //extracts properties from a source object to a new object.
      var properties = _.toArray(arguments);
      var object = properties.shift();
      var result = {};
      _.each(properties, function(property){
        if (object.hasOwnProperty(property)){
          result[property] = object[property];
          delete object[property];
        }
      });
      return result;
    },
    alias: function(target, aliased_method_name, original_method_name){
      target[aliased_method_name] = target[original_method_name];
      return target;
    },
    present: function(object){
      return !_.absent(object);
    },
    absent: function(object){
      return _.isNull(object) || _.isUndefined(object) || (_.isArray(object) && _.compact(object).length == 0) || (_.isString(object) && _.trim(object).length === 0) || false;
    },
    maybe: function(object, fn, defaultValue){
      return object ? fn.apply(object) : defaultValue || null;
    },
    //for when we have either a lone key or a key with a value.
    //e.g. _.kvp('topic')                           => {key: 'topic', value: undefined}
    //e.g. _.kvp('topic', [])                       => {key: 'topic', value: []}
    //e.g. _.kvp({topic: [{include: 'names'}]}, []) => {key: 'topic', value: [{include: 'names'}]}
    kvp: function(item, value){
      if (item.key && item.value) return item; //already in the desired format.
      var str      = _.isString(item), result = {};
      result.key   = str ? item  : _.keys(item).first();
      result.value = str ? value : _.values(item).first();
      return result;
    },
    //returns the global javascript object (which is not always `window`)
    global: function(){
      var callee = arguments.callee;
      return callee._global = callee._global || (function(){
        return (function(){return this;}).call();
      })();
    },
    //takes an object which may be indeterminate (null/undefined) and follows a series of function calls which may be indeterminate until the ultimate result which may or may not be indeterminate result.
    // _.follow(role, 'association.topic_map');
    // _.follow(role, 'association', 'topic_map');
    // _.follow(role, 'association', [true], 'topic_map');  //interject arrays to pass arguments to functions.
    follow: function(){
      var args = _.toArray(arguments);
      var pointer = args.shift();
      args = _(args).chain()
        .map(function(arg){
          return _.isString(arg) ? arg.split('.') : arg;
        })
        .flatten()
        .value();
      while (pointer && args.length > 0){
        var kvp    = _.kvp(args.shift(), []);
        var fn     = pointer[kvp.key];
        var params = kvp.value;
        pointer = fn ? (_.isFunction(fn) ? fn.apply(pointer, params) : fn) : null;
      }
      return pointer;
    },
    // _.resolve(topic.roles); //invokes if a function, returns itself if not.
    resolve: function(object, options){ //preferable, when possible, for a fn to be already bound to its context
      options = _.defaults(options || {}, {args: []});
      var fn = _.isFunction(object) ? object : null;
      if (!fn) return object;
      return options.context ? fn.apply(options.context, options.args) : fn();
    },
    aspect: function(target, method, fn){
      return target[method] = _.wrap(target[method], fn);
    },
    aspects: function(target, methods){
      _.map(methods, function(fn, method){
        return _.aspect(target, method, fn);
      }, target);
      return target;
    },
    constantize: function(constant){
      if (_.isArray(constant)) {
        var constants = constant;
        return _.map(constants, function(constant){
          return _.constantize(constant);
        });
      } else {
        return _.resolve(_.global(), constant);
      }
    },
    //adds aspect that injects mixin(s) into a function's result.
    // * pass target as target object or prototype.
    // * pass method names as strings
    // * pass mixins as functions (future promises).
    // _.extendResult(target, ['method1', 'method2', ...], function(){ return my.namespace.mixin1;}, function(){ return my.namespace.mixin2;}, ...);
    // _.extendResult(target, 'method', function(){ return my.namespace.mixin1;}, ...);
    extendResult: function(){
      var mixins = _.toArray(arguments),
          target  = mixins.shift(),
          methods = _.array(mixins.shift());
      _.each(methods, function(method){
        _.aspect(target, method, function(fn){
          var args = _.toArray(arguments); args.shift();
          var results = fn.apply(this, args);
          var aggregate = {};
          var objects = mixins.map(function(mixin){
            return mixin();
          })
          args = objects; args.unshift(results);
          _.extend.apply(this, args);
          return results;
        });
      });
    },

    /* STRING */
    cluster: function(words, separator){
      var clusters = [];
      var unit = [];
      words.each(function(word){
        if (word === separator) {
          clusters.push(unit);
          unit = [];
        } else {
          unit.push(word);
        }
      });
      clusters.push(unit);
      return clusters;
    },
    dissect: function(text, options){
      options = _.defaults(options || {}, {punctuations: [',',';'], enclosures: [ ['"', '"'], ["'", "'"] ], separators: [' ']});
      var chars = text.chars();
      var punctuations = options.punctuations;
      var enclosures = options.enclosures;
      var separators  = options.separators;
      var results = []; results.add = _.bind(function(value){ if (value && value.length > 0) this.push(value); return value }, results);
      var enclosed = null;
      var word = '';
      var processChar = function(p, c, n) {

        if (enclosed) {

          if (c === enclosed[1]) {
            enclosed = null;
            results.add(word); word = '';
            return;
          }

        } else {

          enclosed = enclosures.detect(function(e){
            return c === e[0];
          })
          if (enclosed) return;

          punctuation = punctuations.detect(function(p){
            return p === c;
          });
          separator = separators.detect(function(s){
            return s === c;
          });

          if (separator || punctuation) {
            results.add(word); word = '';
            results.add(punctuation);
            return;
          }

        }

        word += c;

      }

      chars.each(function(c, idx){
        processChar(chars[idx - 1], c, chars[idx + 1]);
      });
      results.add(word);

      return results;
    },
    plug: function(hash){
      var args = _.toArray(arguments);
      var str  = args.shift();
      var substitute = function(value, key){
        var token = '{' + key.toString() + '}';
        while(str.indexOf(token) > -1){ //replace all occurrences
          str = str.replace(token, value);
        }
      };
      var values = args.length == 1 && _.isObject(args[0]) ? args[0] : args;
      _.each(values, substitute);
      return str;
    },
    prepend: function(str, before){
      str = str.toString();
      if (str.length === 0) return str;
      return before + str;
    },
    append: function(str, after){
      str = str.toString();
      if (str.length === 0) return str;
      return str + after;
    },
    enclose: function(str, before, after){
      return _.append(_.prepend(str, before || '('), after || ')');
    },
    cpluralize: function(str, count) {
      return count !== 1 ? str.pluralize() : str;
    },
    sub: function(str, repl, replWith){
      return str.replace(repl, replWith);
    },
    gsub: function(str, repl, replWith){
      while(_.includes(str, repl))
        str = _.sub(str, repl, replWith);
      return str;
    },
    classify: function(str){
      str = str.humanize();
      str = _.titleize(str);
      str = _.gsub(str, ' ', '');
      str = str.singularize();
      return str;
    },

    /* DATE */
    toDate: function(value, template){
      if (_.isNull(value)) return null;
      var dt = _.isDate(value) ? value : Date.create(value);
      return dt.format(template);
    },
    fdatetime: function(value){
      return _.toDate(value, [Date.template, DateTime.Time.template].join(' '));
    },
    fdate: function(value){
      return _.toDate(value, Date.template);
    },
    ftime: function(value){
      return _.toDate(value, DateTime.Time.template);
    },

    /* NUMBERS */
    isFloat: function(value){
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    isInteger: function(value) {
      var parsed = parseInt(value);
      if (isNaN(parsed)) return false;
      return value == parsed && value.toString() == parsed.toString();
    },

    /* MODELS */
    toJSON: function(models, options) {
      return models
        .map(function(model){
          return model.toJSON(options);
        });
    },

    /* UTIL */
    stopwatch: function(){
      return {
        start: function(){
          this.started = new Date();
          delete this.stopped;
          delete this.duration;
          delete this.seconds;
          delete this.result;
          return this;
        },
        stop: function(){
          this.stopped  = new Date();
          this.duration = this.stopped.getTime() - this.started.getTime();
          this.seconds  = this.duration / 1000;
          return this;
        },
        time: function(fn){
          this.start();
          this.result = fn();
          this.stop();
          return this;
        }
      }
    },
    benchmark: function(label, fn, context, log){
      benchmarkSeed += 1;
      log || (log = _.doNothing);
      context && (fn = _.bind(fn, context));
      var stopwatch = _.stopwatch();
      var id = benchmarkSeed.toString();
      log(label+':start:'+id, context);
      var results = stopwatch.time(fn).result, seconds = stopwatch.seconds;
      var feedback = {label: label, start: stopwatch.started, stop: stopwatch.stopped, seconds: seconds, fn: fn, results: results, context: context};
      log(label+':stop:'+id, seconds, feedback);
      return feedback;
    },
    view: function(object, context){
      if (_.isFunction(object)) return _.view(object.call(context), context);
      if (_.isArray(object)) return object.map(function(object){
        return _.view(object, context);
      });
      return object;
    },
    $: function(object, context){ //resolves to jQuery object
      if (_.isFunction(object)) return _.$(object.call(context), context);
      if (_.isArray(object)) return $(object.map(function(object){
        return _.$(object, context)[0];
      }));
      if (object.render) return object.render().$el;
      return object instanceof jQuery ? object : $(object);
    },
    defn: function(target, methods){
      _.each(methods, function(method){
        target[method] = function(){
          var args = [this].concat(_.toArray(arguments));
          var result = _[method].apply(this, args);
          return result;
        }
      });
      return target;
    },

    //used to make an object (especially an array object) and other like objects (arrays) it begets maintain mixin features.
    as: function(){
      //The term "begetting" means to produce after ones own kind (see "begat").
      var args = _.toArray(arguments), object = args.shift();
      args = _.clone(_.flatten(args));
      //as.sort(args);
      var cached = object._as = object._as || [];
      _.each(args, function(arg){
        if (_.isFunction(arg)) { //apply functions
          var fn = arg;
          fn.call(object);
        } else if (_.isString(arg)) { //ensure proper begetting
          var begetter = arg;
          object[begetter] = _.wrap(object[begetter], function(){
            var args = _.toArray(arguments);
            var $super = args.shift();
            var result = $super.apply(object, args);
            _.as.apply(result, [result].concat(cached));
            return result;
          });
        } else { //apply mixin
          var mixin = arg;
          _.extend(object, mixin);
        }
        if (!cached.contains(arg)) cached.push(arg); //cache all arguments for future begetting
      }, object);
      //as.sort(cached);
      return object;
    },

    //an attempt to make chrome make better use of toString on objects (ala Firebug).
    textLogging: function(console){
      _.aspect(console.__proto__, 'log', function(){
        var args = _.toArray(arguments);
        $super = args.shift();
        var original = _.clone(args);
        args = args.flatten().map(function(arg){
          return _.isArguments(arg) ? _.toArray(arg) : [arg];
        }).flatten().map(function(arg){
          var out = [arg.toString()];
          if (!_.isString(arg)) out.push(arg);
          return out;
        }).flatten();
        args.unshift({original: original});
        return $super.apply(this, args);
      });
    },

    //sometimes you're not sure if your been given a value or a function that returns a lazy result.
    result: function(value, context){
      return _.isFunction(value) ? value.call(context || this) : value;
    },

    returnTrue: function(){
      return true;
    },

    returnFalse: function(){
      return false;
    },

    doNothing: doNothing,

    //e.g. topic.bind('change', _.monitorCallback);
    monitorCallback: function() {
      var caller = arguments.callee.caller;
      var logger = _.logger('callback');
      var args = _.toArray(caller.arguments);
      //logger.dir.apply(this, {callbackArgs: args});
    },

    //e.g. _.monitorCall(topic, 'trigger');
    monitorCall: function(target, method, logger){
      logger = logger || _.logger('call');
      target[method] = _.wrap(target[method], function(fn){
        var caller = arguments.callee.caller;
        logger.log.call(this, ' {0}->{1} '.plug(method, caller.name), caller.arguments);
        fn.apply(target, arguments);
      });
    },

    stopPropagation: function(e){
      e.stopPropagation? e.stopPropagation() : e.cancelBubble = true;
    }

  });

  mixins.Array.begetters = ['compact', 'coalesce', 'give', 'take', 'filter', 'select', 'reject', 'toArray', 'without', 'flatten', 'union', 'intersection', 'intersect', 'difference', 'uniq', 'partition']; //methods that also return arrays

  _.defn(mixins.Array     , ['first', 'initial', 'last', 'rest', 'compact', 'flatten', 'without', 'union', 'intersection', 'difference', 'uniq', 'zip', 'indexOf', 'lastIndexOf', 'range'].concat(['coalesce', 'give', 'take', 'forEach', 'intersect', 'sets', 'pairs', 'isEmpty', 'head', 'tail', 'process', 'partition']));
  _.defn(mixins.Collection, ['each', 'map', 'reduce', 'reduceRight', 'find', 'filter', 'reject', 'all', 'any', 'include', 'invoke', 'pluck', 'max', 'min', 'sortBy', 'groupBy', 'sortedIndex', 'shuffle', 'toArray', 'size', 'detect' ,'select', 'every', 'all', 'some', 'contains']);
  _.defn(mixins.Function  , ['bind', 'memoize', 'delay', 'defer', 'throttle', 'debounce', 'once', 'after', 'wrap', 'compose']);
  _.defn(mixins.String    , ['isBlank', 'capitalize', 'chop', 'clean', 'count', 'chars', 'escapeHTML', 'unescapeHTML', 'escapeRegExp', 'insert', 'includes', 'join', 'lines', 'splice', 'startsWith', 'endsWith', 'succ', 'titleize', 'camelize', 'underscored', 'dasherize', 'trim', 'ltrim', 'rtrim', 'truncate', 'words', 'pad', 'lpad', 'rpad', 'lrpad', 'sprintf', 'toNumber', 'strRight', 'strRightBack', 'strLeft', 'strLeftBack', 'strip', 'lstrip', 'rstrip', 'center', 'ljust', 'rjust'].concat(['prepend','append', 'enclose','plug','cpluralize', 'classify','gsub', 'gsub']));

  _.mixins = mixins;

  return _;
});
