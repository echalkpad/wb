define(function(){

  var doNothing = function(){};
  var nullLogger = {log: doNothing, dir: doNothing};

  var factory = function(label, type){
    var logger = factory.loggers[label];
    if (!logger){
      if (_.isNull(type)) type = 'null';
      if (_.isString(type)) logger = factory.providers[type].call(this, label);
      if (_.isObject(type)) logger = type; //logger provided directly
      if (_.isFunction(type)) logger = type.call(type, label);
      logger || (logger = factory.defaultLogger);
      if (label) factory.loggers[label] = logger;
    }
    return logger;
  };

  var LabelledLogger = function(label) {
    this.label = label;
  };

  var dlogger = factory.defaultLogger = console;

  _.extend(LabelledLogger.prototype, {
    log: function(){
      var args = _.toArray(arguments); args.unshift(this.label + ':');
      return dlogger.log.apply(defLogger, args);
    },
    dir: function(){
      var object = _.clone(_.first(_.toArray(arguments)));
      object.label = this.label;
      return dlogger.dir.call(defLogger, object);
    }
  });

  factory.loggers = {}; //for memoization
  factory.providers = {};
  factory.providers['null'] = function(label){return nullLogger;};
  factory.providers['labelled'] = function(label){return new LabelledLogger(label);};

  _.mixin({logger: factory});

  return _;
});
