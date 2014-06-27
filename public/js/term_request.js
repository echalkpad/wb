if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['class', 'filtering'], function(Class, Filtering){

  var TermRequest = Class.extend({
    init: function(tm, attr){
      this.request = attr;
      this.plural = attr.pluralize()
      this.singular = attr.singularize(); var forms = [this.singular, this.plural];
      this.term = tm.term(this.singular); if (this.term.unknown()) this.term = tm.term(this.plural);
      this.attribute = this.term.known() ? this.term.iids().detect(function(iid){return forms.contains(iid);}) : this.singular;
      this.datatype = this.term.datatype();
      this.method = this.term.isa('name_type') ? 'name' : 'occurrence';
      this.methods = this.method.pluralize();
      this.parse = Filtering.ParserFactory.get(this.datatype);
    },
    isSingular: function(){
      return !this.isPlural();
    },
    isPlural: function(){
      return this.plural == this.request;
    },
    wantsArray: function() {
      return this.isPlural() && this.plural != this.attribute;;
    }
  });

  return TermRequest;
});
