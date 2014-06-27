define(['backbone'], function(Backbone){

  var MapsView = Backbone.View.extend({
    tagName: "ul",
    initialize: function(options){
      var that = this;
      this.choices = {};

      $.ajax({
        url: '/users/admin/maps',
        dataType: 'json',
        success: function(maps){
          maps.each(function(map){
            that.choices[map.id] = map.iri;
          });
          that.render();
        },
        error: function(jqXHR, textStatus, errorThrown){
          console.log('error', jqXHR, textStatus, errorThrown);
        }
      });
    },
    render: function(){
      var $el = this.$el.empty();
      var fetchMap = this.options.fetchMap;
      _.each(this.choices, function(text, value){
        var li = $("<li>").appendTo($el);
        var url = '/maps/' + text + '/app';
        var nodes = document.URL.split('/'); nodes.shift(); nodes.shift(); nodes.shift();
        var at = '/' + nodes.join('/');
        var attrs = {};
        if (url != at){
          attrs.href = url;
        }
        $('<a>').attr(attrs).text(text).appendTo(li);
      });
      return this;
    }
  });

  return MapsView;

});
