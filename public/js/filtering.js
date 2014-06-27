if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(['underscore','class'], function(_, Class){

  var Datatypes = {};

  var compareValues = function(v1, v2){
    if (v1 == v2) {
      return 0;
    } else if (v2 > v1) {
      return 1;
    } else {
      return -1;
    }
  };

  var compareDates = function(v1, v2){
    var diff = v2 - v1;
    if (diff == 0) {
      return 0;
    } else if (diff > 0) {
      return 1;
    } else {
      return -1;
    }
  };

  var boolToInt = function(bool){
    var int;
    if (bool === true) {
      return 1;
    } else if (bool === false) {
      return 0;
    } else {
      return -1;
    }
  }

  var compareBooleans = function(v1, v2){
    return compareValues(boolToInt(v1), boolToInt(v2));
  };

  _.extend(Datatypes, {
    'String': {
      parse: function(v){
        return v.toString();
      },
      compare: compareValues
    },
    'Boolean': {
      parse: function(v){
        return v.toString().length == 0 ? null : ![false, 0, 'false', '0'].include(v);
      },
      compare: compareBooleans
    },
    'Integer': {
      parse: function(v){
        if (!_.isInteger(v))
          return undefined;
        return parseInt(v);
      },
      compare: compareValues
    },
    'Float': {
      parse: function(v){
        if (!_.isFloat(v))
          return undefined;
        return parseFloat(v);
      },
      compare: compareValues
    },
    'Date': {
      parse: function(v){
        if (_.isDate(v)) return v;
        return Date.create(v) || undefined;
      },
      compare: compareDates
    },
    'Datetime': {
      parse: function(v){
        if (_.isDate(v)) return v;
        return Date.create(v) || undefined;
      },
      compare: compareDates
    },
    'Cardinality': {
      parse: function(v){
        var separators = [',','..'];
        if (_.isArray(v)) {
          return v;
        } else {
          var s = separators
            .detect(function(separator){
              return v.includes(separator);
            });
          if (!s){
            throw "Unable to parse Cardinality";
          }
          return v.split(s).map(function(n){
            return parseInt(n);
          });
        }
      },
      compare: function(v1, v2){
        //NaN to ignore either min or max
        if ((isNaN(v1[0]) || v1[0] == v2[0]) && (isNaN(v1[1]) || v1[1] == v2[1])){
          return 0;
        }
        if ((isNaN(v1[0]) || v1[0]  > v2[0]) && (isNaN(v1[1]) || v1[1]  > v2[1])){
          return -1;
        }
        if ((isNaN(v1[0]) || v1[0]  < v2[0]) && (isNaN(v1[1]) || v1[1]  < v2[1])){
          return 1;
        }
        return null;
      }
    }
  });

  var ParserFactory = {
    get: function(datatype){
      var parser = (Datatypes[datatype] || Datatypes.String).parse;
      return function(value){
        try {
          return _.isNull(value) ? null : parser(value);
        } catch (err) {
          return undefined; //unparseable
        }
      }
    }
  };

  var ComparerFactory = {
    get: function(datatype){
      var comparer = (Datatypes[datatype] || Datatypes.String).compare;
      return function(v1, v2){
        return _.isNull(v1) || _.isNull(v2) ? null : comparer(v1, v2);
      }
    }
  };

  //TODO: test comparisons for various datatypes (e.g. dates, integers, etc.)
  //TODO: consider maintaining attribute datatypes in the models to avoid having to parse everything.
  var Matcher = Class.extend({
    init: function(attribute, value, datatype){
      this.attribute = attribute;
      this.datatype  = datatype = datatype || 'String';
      this.parse     = ParserFactory.get(datatype);
      this.compare   = ComparerFactory.get(datatype);
      this.value     = this.parse(value);
    }
  });

  var Matchers = {
    '=': Matcher.extend({
      matches: function(model){
        var value = model.value(this.attribute);
        var parsed = this.parse(value);
        var compared = this.compare(this.value, parsed);
        return !_.isNull(compared) && compared == 0;
      }
    }),

    '>': Matcher.extend({
      matches: function(model){
        var value = model.value(this.attribute);
        var parsed = this.parse(value);
        var compared = this.compare(this.value, parsed);
        return !_.isNull(compared) && compared > 0;
      }
    }),

    '<': Matcher.extend({
      matches: function(model){
        var value = model.value(this.attribute);
        var parsed = this.parse(value);
        var compared = this.compare(this.value, parsed);
        return !_.isNull(compared) && compared < 0;
      }
    }),

    '>=': Matcher.extend({
      matches: function(model){
        var value = model.value(this.attribute);
        var parsed = this.parse(value);
        var compared = this.compare(this.value, parsed);
        return !_.isNull(compared) && compared >= 0;
      }
    }),

    '<=': Matcher.extend({
      matches: function(model){
        var value = model.value(this.attribute);
        var parsed = this.parse(value);
        var compared = this.compare(this.value, parsed);
        return !_.isNull(compared) && compared <= 0;
      }
    }),

    TypeMatcher: Matcher.extend({
      init: function(type){
        this.type = type;
      },
      matches: function(model){
        return model.isa(this.type);
      }
    }),

    IdentityMatcher: Matcher.extend({
      init: function(identity){
        this.identity = identity;
      },
      matches: function(model){
        var identity = this.identity.toLowerCase(); //make case insensitive
        return model.names().any(function(name){
          return name.value().toLowerCase() == identity;
        }) || model.iids().any(function(iid){
          return iid.toLowerCase() == identity;
        });
      }
    })
  }

  var Filter = Class.extend({
    init: function(criteria, datatyper){
      var that = this;

      this.criteria = criteria;
      this.types = [];

      datatyper = datatyper || function(attribute){
        return 'String';
      };

      var comparison = function(criterion, operator){
        var parts = criterion.split(operator);
        if (parts.length === 2) {
          var matcher   = Matchers[operator.trim()];
          var attribute = parts[0].trim();
          var value     = parts[1].trim();
          var datatype  = datatyper(attribute);
          return new matcher(attribute, value, datatype);
        } else {
          return null;
        }
      }

      var identifier = function(value){
        var typePrefix = '#';
        if (value.startsWith(typePrefix)){
          value = value.replace(typePrefix,'');
          that.types.push(value); //track types publicly
          return new Matchers.TypeMatcher(value);
        } else {
          return new Matchers.IdentityMatcher(value);
        }
      }

      //parse criteria based on potential operators
      this.filters = criteria.split('&').map(function(criterion){
        criterion = criterion.trim();
        return comparison(criterion, '<=') || comparison(criterion, '>=') || comparison(criterion, '=') || comparison(criterion, '<') || comparison(criterion, '>') || identifier(criterion);
      });
    },
    select: function(topics){
      var filters = this.filters;
      return topics.select(function(topic){
        return filters.all(function(filter){
          return filter.matches(topic);
        });
      });
    }
  });

  var Comparisons = {eq: [0], value: [0], gt: [1], gte: [0, 1], lt: [-1], lte: [-1, 0], 'in': [0]};
  (function(c){
    c['=' ] = c.eq;
    c['>' ] = c.gt;
    c['>='] = c.gte;
    c['<' ] = c.lt;
    c['<='] = c.lte;
  })(Comparisons);

  return {
    Datatypes: Datatypes,
    Comparisons: Comparisons,
    ParserFactory: ParserFactory,
    ComparerFactory: ComparerFactory,
    Filter: Filter //TODO: eliminate Filter and Matchers in favor of queries.
  };

});
