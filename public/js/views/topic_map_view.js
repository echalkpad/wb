define(['dictionary', 'models/topic_map', 'views/article_view', 'views/topic_list_view', 'views/basic_type_view', 'commands/embed_map_command', 'commands/add_type_command', 'commands/topic_creator_command', 'request_bar', 'views/request_bar_view', 'list', 'views/embedded_maps_view'], function(Dictionary, TopicMap, ArticleView, TopicListView, BasicTypeView, EmbedMapCommand, AddTypeCommand, TopicCreatorCommand, RequestBar, RequestBarView, List, EmbeddedMapsView){

  var TopicMapView = ArticleView.extend({
    className: "topic_map",
    targets: function(target){ //TODO: consider moving from prototype to class (all commands)
      return target instanceof TopicMap;
    },
    creates: function(target){ //TODO: consider moving from prototype to class
      return new TopicMapView({model: target, workspace: this.workspace})
    },
    dynamicAttrs: function(){
      return {'data-topic-map-id': this.model.id, 'id': this.model.url()};
    }
  },{
    template: new Dictionary()
  });

  (function(template){
    template.add('header'  , function(){
      return this.header(this.model.iri());
    });
    template.add('commands', function(){
      return this.commands();
    });
    template.add('embedded-maps', function(){
      var tm = this.model, placeholder = 'Enter Topic Map IRI', image = '/images/icons/write.png';
      return this.section({className: "embedded-maps", title: "Embedded Maps", contents: function(){
        var embedded_maps_view = new EmbeddedMapsView({model: tm});
        var bar_view = new RequestBarView({model: new RequestBar(EmbedMapCommand, tm), placeholder: placeholder, image: image});
        return [embedded_maps_view, bar_view];
      }});
    });
    template.add('topics'  , function(){
      var tm = this.model, placeholder = 'Enter Topic Name', image = '/images/icons/write.png';
      return this.section({className: "topics", title: "Topics", contents: function(){
        var topic_list_view = new TopicListView({model: tm});
        var bar_view = new RequestBarView({model: new RequestBar(TopicCreatorCommand, tm), placeholder: placeholder, image: image});
        return [topic_list_view, bar_view];
      }});
    });
    ['topic_types', 'name_types', 'occurrence_types', 'association_types', 'role_types'].each(function(basic_types){
      template.add(basic_types, function(){
        var tm = this.model, basic_type = basic_types.singularize(), placeholder = 'Enter ' + basic_type.humanize().titleize() + ' Identifier', image = '/images/icons/add-small.png';
        return this.section({className: basic_types, title: basic_types.titleize(), contents: function(){
          var basic_type_view = new BasicTypeView({model: tm, basic_type: basic_type});
          var bar_view = new RequestBarView({model: new RequestBar(AddTypeCommand.create(basic_type), tm), placeholder: placeholder, image: image});
          return [basic_type_view, bar_view];
        }});
      });
    });
    template.add('export', function(){
      var tm = this.model;
      return this.section({className: "export", title: "Export", contents: function(){
        var model = this.model, json = tm.export(), self = this;
        var text = JSON.stringify(json, undefined, 2);
        return $('<textarea>').val(text);
      }});
    });
  })(TopicMapView.template);
  
  return TopicMapView;

});
