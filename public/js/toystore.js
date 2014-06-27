if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['underscore', 'backbone'], function(_, Backbone){

  var attrAccessor = function(attr){
    this.prototype[attr] = this.prototype[attr] || function(value){
      if (!_.isUndefined(value)){
        this.set(attr, value);
      }
      return this.get(attr);
    };
  };

  var attrReader = function(attr){
    this.prototype[attr] = this.prototype[attr] || function(){
      return this.get(attr);
    };
  };

  var listAccessor = function(list) {
    this.prototype[list] = function(value){
      if (value){
        this.set(list, value);
      }
      return this.get(list) || [];
    };
  };

  var listReader = function(list) {
    this.prototype[list] = function(value){
      return this.get(list);
    };
  };

  _.extend(Backbone.Model, {
    toystore: function(){
      var extended = !!this.lists;
      return extended ? this : _.extend(this, {
        readonly: [],
        labels: {},
        label: function(attribute, label){
          label || (label = attribute.humanize());
          this.labels[attribute] = label;
          return this;
        },
        headers: [],
        header: function(attribute){
          this.headers.push(attribute);
          return this;
        },
        footers: [],
        footer: function(attribute){
          this.footers.push(attribute);
          return this;
        },
        datatypes: {},
        datatype: function(attribute, datatype){
          datatype && (this.datatypes[attribute] = datatype);
          return this;
        },
        lists: [],
        list: function(name, options){
          options = _.defaults(options || {}, {readonly: false});
          this[options.section || 'header'](name);
          var macro = options.readonly ? listReader : listAccessor;
          macro.call(this, name);
          this.lists.push(name);
          this.label(name, options.label);
          return this;
        },
        embeddedLists: [],
        embeddedList: function(name, options){
          options = options || {};
          this.embeddedLists.push(name);
          this.label(name, options.label);
          return this;
        },
        attributes: [],
        attribute: function(name, options){
          options = _.defaults(options || {}, {readonly: false});
          options.readonly && this.readonly.give(name);
          options.datatype && this.datatype(name, options.datatype);
          this[options.section || 'header'](name);
          var macro = options.readonly ? attrReader : attrAccessor;
          name !== 'id' && macro.call(this, name);
          this.attributes.push(name);
          this.label(name, options.label);
          return this;
        },
        setters: {},
        setter: function(name, fn){
          this.setters[name] = fn;
          return this;
        },
        stamps: function(){
          this.attribute('creator_id', {readonly: true, label: 'Creator', section: 'footer'});
          this.attribute('created_at', {readonly: true, label: 'Created', section: 'footer', datatype: 'Datetime'});
          this.attribute('updater_id', {readonly: true, label: 'Updater', section: 'footer'});
          this.attribute('updated_at', {readonly: true, label: 'Updated', section: 'footer', datatype: 'Datetime'});
          return this;
        }
      }).attribute('id', {readonly: true});
    }
  });

  return Backbone.Model;

});
