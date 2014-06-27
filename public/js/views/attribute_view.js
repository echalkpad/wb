define(['views/property_view', 'basic_types', 'views/inline_errors_view'], function(PropertyView, BasicTypes, InlineErrorsView){

  var AttributeView = PropertyView.extend({
    value: function(){
      var isDateTime = this.model.constructor.datatypes[this.options.attribute] === 'Datetime'; //TODO: better format handling to avoid hardcoding to Datetime.
      var val = this.model.get(this.options.attribute);
      if (isDateTime){
        return _.fdatetime(val);
      }
      return val;
    },
    render: function(){
      var self = this;
      var $el = this.$el.empty();
      var attribute = this.options.attribute;
      var model = this.model; model.bind('change:' + attribute, render);
      var tm = model.topic_map();
      var value = _.array(this.value()).join(' '); //NOTE: this control currently handles arrays as space-separated values.  //TODO: design more elaborate type control?
      var isList = model.constructor.lists.contains(attribute);
      var label = $("<label/>").html(model.constructor.labels[attribute]);
      var input = model.constructor.readonly.contains(attribute) ? $('<span/>').text(value) : $("<input/>").attr({type: 'text', value: value});
      var render = this.render;
      var getTags = function(){
        return model.get(attribute);
      };
      var setTags = function(tags){
        model.unbound('change:' + attribute, render, function(){
          model.set(attribute, tags);
        });
      };
      var loaded = false;
      var getAvailableTags = AttributeView.availableTags[attribute] || function(){return []};
      var availableTags = getAvailableTags.call(model);
      var adjustTags = function(e, el){
        if (!loaded) return;
        var tag = el.find('.tagit-label').text();
        var currentTags = getTags();
        var removing = e.type == 'tagitontagremoved';
        var proposedTags = removing ? _.without(currentTags, tag) : currentTags.concat([tag]);
        setTags(proposedTags);
      };
      var clickedTag = function(e, el){
        var tag = el.find('.tagit-label').text();
        //TODO: response if nothing is found.  same elsewhere where locate is involved.
        //TODO: would it make sense to raise an event?  maybe not...?
        var topics = tm.topics().identified(tag).all();
        tm.trigger("searched", topics);
      };

      var errors = new InlineErrorsView({model: model, attribute: attribute}).marks($el).render().$el;

      $el.attr({'data-attribute': attribute})
        .append(label, input, errors);

      if (isList) {
        input.tagit({
          removeConfirmation: true,
          singleFieldDelimiter: ' ',
          availableTags: availableTags,
          onTagAdded: adjustTags,
          onTagRemoved: adjustTags,
          onTagClicked: clickedTag
        });
        //console.log('tagit', input);
      }
      loaded = true;
      return this;
    },
    valueChanged: function(element){
      var revised  = $(element.target).val();
      var changes = {};
      if (this.model.constructor.lists.contains(this.options.attribute)) {
        changes[this.options.attribute] = revised.split(' ').compact();
      } else {
        changes[this.options.attribute] = revised;
      }
      this.model.set(changes);
    }
  },{
    availableTags: {
      types: function(){
        return this.topic_map().topic_types().concat(BasicTypes.list);
      }
    }
  });

  return AttributeView;

});
