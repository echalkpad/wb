define(['views/attributes_view'], function(AttributesView){

  var TopicFooterView = AttributesView.extend({
    initialize: function(){
      var self = this;
      _.bindAll(this);
      self.model.bind("stamped", self.render);
      this.$el.one("remove", function(){
        console.log("topic-footer-cleanup:"+self.cid, self);
        self.model.unbind("stamped", self.render);
        self.unbind();
      });
    },
    ordinals: function(){
      return this.model.constructor.footers;
    }
  });

  return TopicFooterView;

});
