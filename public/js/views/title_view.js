define(['backbone'], function(Backbone){

  var TitleView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this, "render", "jiggle");
      var that = this, model = this.model;
      var located = function(located){
        if (located){
          that.jiggle();
        }
      };
      model.bind("retyped", this.render);
      model.bind("renamed", this.render);
      model.bind("located", located);
      this.$el.one("remove", function(){
        model.unbind("retyped", that.render);
        model.unbind("renamed", that.render);
        model.unbind("located", located);
        that.unbind();
      });
    },
    tagName: "header",
    jiggle: function(){
      this.$el.find('h1').effect("shake", { times:3, distance: 3 }, 75);
    },
    render: function(){
      var $el   = this.$el.empty();
      var topic = this.model;
      var tm    = topic.parent();
      var types = topic.labeled_types();
      var heading = $("<h1>").addClass('topic').attr({title: 'id: ' + topic.id}).appendTo($el); heading.text(topic.name());
      var tags  = $("<ul>").addClass('types').appendTo($el);

      heading.draggable({
        revert: false,
        helper: 'clone',
        opacity: .5,
        appendTo: 'body',
        start: function(e, ui){
          ui.helper.data({topic: topic, dispose: false});
        },
        stop: function(e, ui){
          console.log('stopped', topic, ui);
          if (ui.helper.data('dispose')) {
            topic.detach();
            console.log('disposed topic', topic);
          }
        }
      });

      types.each(function(labeled){
        var term = tm.term(labeled.type);
        var tag = $("<a>").text(labeled.type);
        var li = $('<li>').append(tag)
        if (term.known()){
          tag.attr({href: '#' + term.url() });
        }
        if (labeled.label){
          li.addClass(labeled.label + '-type');
        }
        tags.append(li)
      });

      return this;
    },
  });

  return TitleView;

});
