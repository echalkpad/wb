if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/document', 'models/topic_map', 'models/topic', 'query/association_query'], function(Document, TopicMap, Topic, AssociationQuery){

  var Association = Document.extend({
    className: 'Association',
    url: function(){
      return 'associations/' + this.id;
    },
    plays: function(topic){ //TODO: accept type so we can ask if a topic plays a certain role.
      return this.roles().topic(topic).any();
    },
    connected: function(){ //meaning that it actually connects things together.
      return this.roles().count() > 1;
    },
    dangling: function(){
      return !this.connected();
    },
    dissolve: function(){
      return this.roles().map(function(role){
        return role.detach();
      });
    },
    topics: function(){
      return this.roles().topics();
    },
    toString: function(){
      var type  = this.type();
      var roles = this.roles().map(function(role){
        return role.toString();
      });
      type = type.length > 0 ? type : null;
      return [type, '['+ roles.join(', ') + ']'].compact().join(' ').enclose("association{","}");
    }
  },{
    checks: []
  }).aspects({
    initialize: function($super, attributes, options){
      $super.call(this, attributes, options);

      var association = this, tm = this.topic_map();

      this.bind("dissociated", function(role, options){
        options = _.defaults(options || {}, {dissolve: true}); //TODO: verify options everywhere
        if (options.dissolve && association.dangling()) //dissolve dangling associations
          association.dissolve();
        if (association.roles().count() == 0) //nothing left to associate
          association.detach();
      });
      this.bind("add", function(association){
        tm.trigger("revise", "association", "insert", association);
      });
      this.bind("change", function(){
        tm.trigger("revise", "association", "update", association);
      });
      this.bind("remove", function(association){
        tm.trigger("revise", "association", "delete", association);
      });

    }
  }).toystore()
    .list('scopes')
    .embeddedList('roles')
    .attribute('topic_map_id', {readonly: true})
    .attribute('type')
    .stamps();

  _.extend(TopicMap.prototype, {
    associations: function(options){
      options = _.defaults(options || {}, {pure: false});
      var self = this;
      var collection = options.pure ? function(){
        return self._associations;
      } : function(){
        return self.embedded_maps().and_self().map(function(tm){
          return tm._associations;
        }).flatten();
      };
      return new AssociationQuery({collection: collection, context: this});
    },
    association: function(data, fn){
      data = _.defaults(data, {topic_map_id: this.id});
      var a = new Association(data, {parent: this}).bubbleEvents(this);
      this.db().associations.add(a);
      fn && fn.call(a, a);
      a.isNew() && a.created();
      return a;
    }
  });

  _.extend(Topic.prototype, {
    associations: function(options){
      return new AssociationQuery({collection: this._associations, context: this}).plays(this);
    }
  });

  Association.Query = AssociationQuery;

  return Association;

});
