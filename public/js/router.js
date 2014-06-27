define(['backbone'], function(Backbone){

  //IDEA: use different routers on different screens?
  var Router = Backbone.Router.extend({
    //routing happens within the context of a topic map.
    topic_map: function(tm){
      return arguments.length > 0 ? this.tm = tm : this.tm;
    },

    routes: {}
  });

  Router.create_finder = function(proto, name){ //macro
    var names  = name.pluralize();
    var method = 'find_' + names;
    var route  = names + '/*ids';
    proto.routes[route] = method;
    proto[method] = function(ids) {
      var self = this;
      var tm = this.topic_map();
      var query = tm[names]();
      ids.split('+').each(function(id){ //ids may be concatenated
        var model  = query.get(id);
        var status = model ? 'retrieved' : 'retrieve:failed', qualified = name + ':' + status;
        self.trigger(qualified, model, tm);
        self.trigger(status, model, tm);
      });
    };
    return proto;
  };

  Router.create_finder(Router.prototype, 'topic');
  Router.create_finder(Router.prototype, 'topic_map');

  return Router;

});
