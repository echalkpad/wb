define(['backbone'], function(Backbone){

  var CurrentMapView = Backbone.View.extend({
    tagName: 'a',
    className: 'current-map',
    initialize: function(options){
      _.bindAll(this, 'badge','target','render');
      this.mediator = options.mediator;
      this.mediator.bind('change:topic_map', this.render);
    },
    badge: function(){
      var tm = this.mediator.topic_map();
      return tm ? tm.iri() : '[no map]';
    },
    target: function(){
      var tm = this.mediator.topic_map();
      return tm ? '#'+ tm.url() : null;
    },
    render: function(){
      this.$el.empty().attr({href: this.target()}).text(this.badge());
      return this;
    }
  });

  return CurrentMapView;

});
