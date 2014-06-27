define(['collections/documents', 'models/role'], function(Documents, Role){

  var Roles = Documents.extend({
    model: Role
  }).aspects({
    initialize: function($super, items, parent){
      $super.call(this, items, parent);
      this.bind('add', function(role){
        var topic            = role.topic(),
            association      = role.parent(),
            association_type = association.type();
        var associations = topic._associations || (topic._associations = []);
        associations.give(association);
        topic.bind('remove', function(){
          role.detach({dissolve: true});
        });
        association.trigger('associated', role);
        //association.topics().reject(function(t){return t === topic;}).each(function(topic){
        //role.counterparts().topics().each(function(topic){
        association.topics().each(function(topic){
          topic.trigger('associated:' + association_type, role);
          topic.trigger('associated', role);
        });
        topic.trigger('played', role);
        association.trigger('change');
        role.trigger('added'); //occurs after other add events are handled
      });
      this.bind('remove', function(role){
        var topic            = role.topic(),
            association      = role.parent(),
            association_type = association.type(); //TODO: select topic identified 'company' and delete it.  no topic is returned.  BUG.  We've lost our reference to the topic probably as a matter of timing.
        var associations     = topic._associations;
        associations.take(association);
        association.trigger('dissociated', role);
        association.topics().each(function(topic){
          topic.trigger('dissociated:' + association_type, role);
          topic.trigger('dissociated', role);
        });
        association.trigger('change');
        role.trigger('removed'); //occurs after other remove events are handled
      });
    }
  });

  return Roles;

});
