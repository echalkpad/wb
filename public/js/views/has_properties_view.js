define(['backbone', 'constraints', 'input_factory', 'mixins'], function(Backbone, Constraints, InputFactory, Mixins){

  //TODO: namespace issues herein?

  var HasPropertiesView = Backbone.View.extend({
    caption: 'Has Properties',
    tagName: 'li',
    render: function(){
      var $el = this.$el.empty();
      var view = this;
      var model = tt = this.options.model;
      var datatype = model.datatype();
      var button = $('<button/>').text('Add').appendTo($el).click(function(){
        addRow();
      });
      var table = $("<table/>").appendTo($el);
      var caption = $("<caption/>").html(this.caption).appendTo(table);
      var constraints = model[view.constraintType.pluralize()]();
      $("<tr/>").append($("<th/>").html("Type"), $("<th/>").html("Cardinality")).appendTo(table);

      var addRow = function(constraint){
        var tr  = $("<tr/>").appendTo(table);
        var td1 = $("<td/>").appendTo(tr).html("&nbsp;"), td2 = $("<td/>").appendTo(tr).html("&nbsp;");

        if (constraint){
          var type = _.extend([constraint], Mixins.Constraints).deserialize()[0][view.acceptedType];
          var card = InputFactory.build({builder: 'cardinality'}).sync(constraint, 'card');
          var a = $("<a/>").attr({href: '#' + constraint.url()}).text(type.name()).draggable({
            revert: true,
            opacity: .5,
            distance: 5,
            helper: 'clone',
            start: function(e, ui){
              ui.helper.data({topic: type, dispose: false});
            },
            stop: function(e, ui){
              if (ui.helper.data('dispose')) {
                constraint.detach({dissolve: true});
                view.render();
              }
            }
          });
          td1.html(a);
          td2.html(card);
        } else {
          td1.droppable({
            accept: '.topic[data-types~={0}] *, .topic[data-types~={0}]'.plug(view.acceptedType),
            hoverClass: 'drophover'
          }).bind("drop", function(e, ui){
            _.stopPropagation(e)
            var constrained = ui.helper.data('topic');
            new Constraints[view.constraintType.classify()](model, constrained).serialize();
            view.render();
          });
        }
      }

      constraints.each(function(constraint){
        addRow(constraint);
      });

      return this;
    }
  });

  return HasPropertiesView;

});
