define(['views/article_view', 'topic_map_importer'], function(ArticleView, importer){

  var TopicMapImporterView = ArticleView.extend({
    className: 'json',
    targets: function(subject){
      return subject === importer;
    },
    creates: function(dummy){
      return new TopicMapImporterView({model: dummy});
    },
    items: function(){
      var json_text = this.section({className: "json", title: "JSON", deferred: false, contents: function(){
        return $('<textarea>');
      }});
      return [this.header('Topic Map Importer'), this.commands(), json_text];
    }
  });

  return TopicMapImporterView;

});
