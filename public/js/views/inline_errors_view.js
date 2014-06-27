define(['backbone', 'views/list_view'], function(Backbone, ListView){

  var InlineErrorsView = ListView.extend({
    className: 'errors',
    clear: function(){
      this.$el.empty();
      this.trigger('cleared');
      return this;
    },
    marks: function(container){ //TODO: eliminate container option (in favor of using events?)
      var c = (container.$el ? container.$el : container), self = this, observes = this.observes;
      var mark = function(model, error, options){
        c.addClass('invalid').addClass('once-invalid');
      };
      var unmark = function(){
        c.removeClass('invalid');
      };
      this.bind('cleared', unmark);
      this.model.bind(observes, mark);
      this.$el.one("remove", function(){
        self.model.unbind(observes, mark);
      });
      return this;
    }
  });
  
  _.aspect(InlineErrorsView.prototype, 'initialize', function($super, options){
    $super.call(this, options);
    this.list = []; //No errors are initially generated.  Calling 'check().publish()' triggers events that render them.
    var self = this, model = this.options.model, attribute = this.options.attribute;
    var observes = this.observes = attribute ? 'error:' + attribute : 'error';
    model.bind('check', this.clear); //called when we start checking for errors
    model.bind(observes, function(model, error, options){
      error && error.message && self.append(error.message);
    });
    this.$el.one("remove", function(){
      model.unbind('check', self.clear);
      model.unbind(observes, self.append);
      self.unbind();
    });
  });

  return InlineErrorsView;

});