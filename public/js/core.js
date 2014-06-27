define([
  'backbone',
  'models/document',
  'term',
  'term_request',
  'collections',
  'constraint',
  'constraints',
  'constraints/choice_constraint',
  'constraints/association_role_constraint',
  'constraints/datatype_constraint',
  'constraints/length_constraint',
  'constraints/topic_role_constraint',
  'constraints/topic_name_constraint',
  'constraints/topic_occurrence_constraint',
  'constraints/regular_expression_constraint',
  'mixins/topics',
  'mixins/roles',
  'mixins/typed',
  'mixins/constraints'
], function(Backbone, Document){

  Backbone.emulateJSON = true;
  Backbone.emulateHTTP = true;
  Document.bubbleEvents = false; //let's try using events coming from collections before resorting to another form of bubbling.

  return {}; //nothing to return ... just enforcing the boot of critical modules.

});
