if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/property', 'models/topic_map', 'models/topic', 'query/occurrence_query'], function(Property, TopicMap, Topic, OccurrenceQuery){

  var Occurrence = Property.extend({
    className: 'Occurrence',
    toString: function(){
      return [this.type() || '?', this.value() || '?'].join(': ').enclose("occurrence{", "}");
    }
  },{
    checks: []
  });
  //TODO: use 'to_store' format. use 'to_store'/'from_store' syntax.
  /*.aspects({ //cast the value as the proper type for the datastore
    set: function($super, attributes, options){ //TODO: not getting topic_map on set from constructor.
      if (!_.isUndefined(attributes.value)){
        var tm = this.topic_map(), type = attributes.type || this.type();
        var req = tm && type ? new TermRequest(tm, type) : null;
        if (req && req.term && req.term.known()){
          var parsed = req.parse(attributes.value);
          if (!_.isUndefined(parsed))
            attributes.value = parsed;
        }
      }
      return $super.call(this, attributes, options);
    }
  });*/

  _.extend(TopicMap.prototype, {
    occurrences: function(){
      var ids = this.domain_ids(); //var ids = this.embedded_map_ids(); TODO: fix -- toystore implementation may be overwriting property that is implemented in TopicMap.
      return new OccurrenceQuery({collection: this.db().occurrences, context: this}).where(function(occurrence){
        return ids.include(occurrence.topic_map().id);
      });
    }
  });

  _.extend(Topic.prototype, {
    occurrences: function(){
      return new OccurrenceQuery({collection: this._occurrences, context: this});
    },
    occurrence: function(data, fn){
      //var payload = data, data = _.extract(data, 'id');
      var o = new Occurrence(data, {parent: this}).bubbleEvents(this);
      //o.set(payload); //TODO: I don't like this structuring forced by backbone.
      this.db().occurrences.add(o);
      fn && fn.call(o, o);
      o.isNew() && o.created();
      return o;
    }
  });

  Occurrence.Query = OccurrenceQuery;

  return Occurrence;

});
