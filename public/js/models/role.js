if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/embedded_document', 'models/topic_map', 'models/topic', 'models/association', 'query/role_query', 'mixins'], function(EmbeddedDocument, TopicMap, Topic, Association, RoleQuery, Mixins){

  var Role = EmbeddedDocument.extend({
    className: 'Role',
    association: function(){
      return this.parent();
    },
    topic: function(){
      var t = this.get('topic') || this.db().topics.get(this.get('topic_id'));
      if (!t){
        throw "Unable to find this role's topic";
      }
      return t;
    },
    topic_id: function(){
      return this.get('topic_id') || this.topic().id;
    },
    counterparts: function(){
      var that = this;
      var collection = function(){
        return that.association().roles().less(that).all();
      };
      //result.topic = function(){ //TODO: use _.extendResult
      //  return result.first().topic();
      //}
      return collection(); //TODO: new RoleQuery({collection: collection, context: this});;
    },
    counterpart: function(){
      return this.counterparts().first();
    },
    toJSON: function(){ //drop cached 'topic'
      return {id: this.id, scopes: this.scopes(), topic_id: this.topic_id(), type: this.type()}
    },
    toString: function(){
      var topic = this.topic();
      return [this.type(), topic ? [topic.name(), '?'].coalesce() : null].compact().join(': ').enclose("role{","}");
    }
  },{
    checks: []
  }).aspects({
    initialize: function($super, attributes, options){
      //Cache topic reference.  This is useful for #topic method when a topic has been deleted.  The role may wish to relay messages to its "former" topic.
      var topic = null;
      if (attributes.topic_id && !attributes.topic)
        topic = this.db().topics.get(attributes.topic_id);
      $super.call(this, attributes, options);
      topic && this.set({topic: topic}, {silent: true});
    },
    set: function($super, attributes, options){
      if (attributes.topic){
        if (!attributes.topic.id) {
          throw "Topic has no id";
        }
        attributes.topic_id = attributes.topic.id
      }
      return $super.call(this, attributes, options);
    }
  }).toystore()
    .list('scopes')
    .attribute('topic_id', {readonly: true})
    .attribute('type', {readonly: true})
    .attribute('topic'); //TODO; test topic

  _.extend(Association.prototype, {
    roles: function(){
      return new RoleQuery({collection: this._roles, context: this});
    },
    role: function(data, fn){
      data = arguments[0];
      var r = new Role(data, {parent: this}).bubbleEvents(this);
      this.db().roles.add(r);
      fn && fn.call(r, r);
      r.isNew() && r.created();
      return r;
    }
  });

  _.extend(TopicMap.prototype, {
    roles: function(){
      var ids = this.embedded_map_ids();
      return new RoleQuery({collection: this.db().roles, context: this}).where(function(role){
        return ids.include(role.topic_map().id);
      });
    }
  });

  _.extend(Topic.prototype, {
    roles: function(){
      var topic = this;
      var roles = function(){
        return topic.associations().roles().topic(topic).all();
      };
      return new RoleQuery({collection: roles, context: this});
    },
    plays: function(role_type){
      return this.roles().isa(role_type).any();
    }
  });

  //TODO? each mixin will have its own registry of target methods and be invoked just before the app is ready.
  //  e.g. Mixins.Topics.register('Topic.players')
  //       Mixins.Topics.mix(); // called on ready event.
  _.extendResult(Role.prototype , 'counterparts', Mixins.promise('Roles'));
  _.extendResult(Role.prototype , 'constraints' , Mixins.promise('Topics'));

  Role.Query = RoleQuery;

  return Role;

});
