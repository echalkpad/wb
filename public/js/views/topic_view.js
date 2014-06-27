define(['dictionary', 'request_bar', 'commands/add_name_command', 'commands/add_occurrence_command', 'models/topic', 'views/article_view', 'views/dirty_view', 'views/title_view', 'views/inline_errors_view', 'views/topic_header_view', 'views/topic_footer_view', 'views/names_view', 'views/occurrences_view', 'views/constraints_view', 'views/associations_by_type_view', 'views/request_bar_view'], function(Dictionary, RequestBar, AddNameCommand, AddOccurrenceCommand, Topic, ArticleView, DirtyView, TitleView, InlineErrorsView, TopicHeaderView, TopicFooterView, NamesView, OccurrencesView, ConstraintsView, AssociationsByTypeView, RequestBarView){

  //TODO: create a TopicalView from which TopicView and TreeView and other topic views can inherit?
  var TopicView = ArticleView.extend({
    className: "topic collapsed",
    targets: function(target){
      return target instanceof Topic;
    },
    creates: function(target){
      return new TopicView({model: target, workspace: this.workspace});
    },
    dynamicAttrs: function(){
      return {'data-model-type': 'topic', 'data-view-type': 'topic', 'data-topic-id': this.model.id, 'id': this.model.url(), 'data-types': this.model.types().join(' '), 'data-basic-type': this.model.isBasicType()};
    },
    'delete': function(){
      if (confirm ("Are you sure?  This topic's associations will be dissolved.")) {
        this.model.detach(); //TODO: this.model.destroy(); actually, this is a persistence issue and will be handled during tm.save().
      }
    }
  },{
    template: new Dictionary()
  });

  _.aspect(TopicView.prototype, 'initialize', function($super, options){
    $super.call(this, options);

    var model = this.model, self = this, $el = this.$el;
    var tagNew = function(){
      $el.addClass('new');
    };
    var highlight = function(){
      $el.effect("highlight", {}, 1500);
    };
    var toggle = function(){
      $el.toggleClass('type', model.isBasicType());
    };
    model.bind("retyped", this.refreshAttrs);
    model.bind("entered", tagNew);
    model.bind("entered", this.setCursor);
    model.bind("located", this.setCursor);
    model.bind("remove" , this.close);
    model.bind("refresh", this.render);
    model.bind("refresh", highlight);
    model.bind("change:types", toggle);

    this.$el.one("remove", function(){
      console.log("topic-view-cleanup:"+self.cid, self);
      model.unbind("retyped", self.refreshAttrs);
      model.unbind("entered", tagNew);
      model.unbind("entered", self.setCursor);
      model.unbind("located", self.setCursor);
      model.unbind("remove" , self.close);
      model.unbind("refresh", self.render);
      model.unbind("refresh", highlight);
      model.unbind("change:types", toggle);
      self.unbind();
    });
  });

  _.aspect(TopicView.prototype, 'render', function($super){
    $super.call(this);
    if (this.model.isBasicType())
      this.$el.addClass('type');
    this.model.check().publish(); //TODO: better place for this? violates a standard here.
    return this;
  });

  (function(template){
    template.add('dirty', function(){
      return new DirtyView({model: this.model});
    });
    template.add('title', function(){
      return new TitleView({model: this.model});
    });
    template.add('commands', function(){
      return this.commands();
    });
    template.add('errors', function(){
      return new InlineErrorsView({model: this.model}).marks(this); //TODO: container vs. parent -- be consistent
    });
    template.add('header', function(){
      var model = this.model;
      return this.section({className: "header meta", title: "Header", contents: function(){
        return new TopicHeaderView({model: model});
      }});
    });
    template.add('names', function(){
      var model = this.model, placeholder = 'Enter Name Type', image = '/images/icons/add-small.png';
      return this.section({className: "names", title: "Names", contents: function(){
        var names_view = new NamesView({model: model});
        var source = model.term().suggested_name_types().map(function(nt){return nt.iids();}).flatten();
        var bar_view = new RequestBarView({model: new RequestBar(AddNameCommand, model.topic_map(), model), placeholder: placeholder, image: image, source: source, autoclear: true});
        return [names_view, bar_view];
      }});
    });
    template.add('occurrences', function(){
      var model = this.model, placeholder = 'Enter Occurrence Type', image = '/images/icons/add-small.png';
      return this.section({className: "occurrences", title: "Occurrences", deferred: false, contents: function(){
        var occurrences_view = new OccurrencesView({model: model});
        var source = model.term().suggested_occurrence_types().map(function(ot){return ot.iids();}).flatten();
        var bar_view = new RequestBarView({model: new RequestBar(AddOccurrenceCommand, model.topic_map(), model), placeholder: placeholder, image: image, source: source, autoclear: true});
        return [occurrences_view, bar_view];
      }});
    });
    template.add('constraints', function(){
      var model = this.model;
      return this.section({className: "constraints", title: "Constraints", contents: function(){
        return new ConstraintsView({model: model});
      }});
    });
    template.add('associations', function(){
      var model = this.model;
      return this.section({className: "associations", title: "Associations", deferred: false, contents: function(){
        return new AssociationsByTypeView({model: model});
      }});
    });
    template.add('footer', function(){
      return this.section({className: "footer meta", title: "Footer", contents: function(){
        var footer = new TopicFooterView({model: this.model});
        return footer;
      }});
    });
  })(TopicView.template);

  return TopicView;

});
