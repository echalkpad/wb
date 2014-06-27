define(['backbone'], function(Backbone){

  var RequestBarView = Backbone.View.extend({
    className: 'request-bar',
    attributes: function(){
      return {id: this.cid};
    },
    events: {
      "click button"  : "request",
      "click img": "request",
      "focus input": "ready",
      "keypress input": "keypress"
    },
    initialize: function(options){
      _.bindAll(this);
      options = _.defaults(options || {}, {keepCursor: true, autoclear: false});
      this.request_bar = options.model || options.request_bar;
      this.request_bar.bind('change:ready', this.reflectAccess)
    },
    input: function(){
      return this.$el.find('input.entry');
    },
    value: function(){
      return this.input().val();
    },
    request: function(){
      this.request_bar.execute(this.value());
      this.$el.effect("highlight", {}, 1500);
    },
    reflectAccess: function(){
      this.$el[this.request_bar.ready() ? 'removeClass' : 'addClass']("disabled");
    },
    ready: function(e){
      e.preventDefault(); _.stopPropagation(e);
      this.input().select();
    },
    keypress: function(e){
      var autoclear = this.options.autoclear === true, keepCursor = this.options.keepCursor;
      var code = (e.keyCode ? e.keyCode : e.which), input = this.input();
      if (code == 13) {
        e.preventDefault();
        this.event = e;
        this.request();
        if (autoclear)
          this.clear();
        if (keepCursor) {
          input[0].select();
          input.focus();
        }
      }
    },
    clear: function(){
      this.input().val('');
    },
    render: function(){
      this.$el.empty();
      var source = this.options.source;
      var cid    = this.cid;
      var input  = $('<input>').attr({type: 'text', placeholder: this.options.placeholder}).addClass('entry');
      var img    = $('<img>').attr({src: this.options.image});
      var setup  = function(){
        input.autocomplete({source: source, minLength: 0, appendTo: '#' + cid});
      };
      source && input.one('focus', setup);
      this.$el.append(input).append(img);
      this.reflectAccess();
      return this;
    }
  });

  return RequestBarView;

});