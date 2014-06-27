define(['class','backbone'], function(Class, Backbone){

  var annotate = function(n){
    return n.toString();
  };

  //TODO: all TreeViews starting at a common root should share the same controller.
  var TreeController = Class.extend({
    className: 'TreeController',
    init: function(root, parent){
      _.bindAll(this, 'keybindings','activate','select','deselect','open','reorder','inspect','single','all','up','down','moveUp','moveDown','createSibling','createChild','remove','edit','head','tail','collapse','expand','indent','outdent','clear','selected');
      var self = this;
      var doc = $(document);
      this._selected = [];
      this._collapsed = [];
      this._active = false;
      this.root = root;
      this.parent = parent;
      this.select(root);

      this.bind('activated', function(){
        doc.bind('keydown', self.keybindings);
      });
      this.bind('deactivated', function(){
        doc.unbind('keydown', self.keybindings);
      });

      this.activate();
    },
    keybindings: function(e){
      console.log('keydown', e.keyCode, e);

      var self = this;
      var handled = true;

      if (self._selected.length === 0) {
        //do nothing
      } else if (e.keyCode === 32) { //space
        self.open();
      } else if (e.keyCode === 13 && !e.shiftKey) { //enter
        self.createSibling();
      } else if (e.keyCode === 13 && e.shiftKey ) { //shift+enter
        self.createChild();
      } else if (e.keyCode === 38 && !e.shiftKey) { //up
        self.up();
      } else if (e.keyCode === 40 && !e.shiftKey) { //down
        self.down();
      } else if (e.keyCode === 37 && !e.shiftKey) { //left
        self.collapse();
      } else if (e.keyCode === 39 && !e.shiftKey) { //right
        self.expand();
      } else if (e.keyCode === 38 && e.shiftKey ) { //shift+up
        self.moveUp();
      } else if (e.keyCode === 40 && e.shiftKey ) { //shift+down
        self.moveDown();
      } else if (e.keyCode === 37 && e.shiftKey ) { //shift+left
        self.outdent();
      } else if (e.keyCode === 39 && e.shiftKey ) { //shift+right
        self.indent();
      } else if (e.keyCode === 36) { //home
        self.head(e.shiftKey);
      } else if (e.keyCode === 35) { //end
        self.tail(e.shiftKey);
      } else if (e.keyCode ===  8) { //backspace
        self.edit();
      } else if (e.keyCode === 34) { //pagedown
        self.inspect();
      } else if (e.keyCode === 46 && !e.shiftKey) { //delete -- TODO: prompt?
        self.remove();
      } else {
        handled = false;
      };

      handled && e.preventDefault();

    },
    activate: function(){
      return this.parent.activate(this);
    },
    select: function(node, options){
      if (!node) return;
      options = _.defaults(options || {}, {toggle: false, multi: false});
      if (options.toggle && this._selected.contains(node)){
        this.deselect(node);
      } else {
        options.multi || this.clear();
        this._selected.give(node);
        node.trigger('selected');
        node.reveal();
      };
      this.reorder();
      return node;
    },
    deselect: function(node, options){
      this._selected.take(node);
      node.trigger('deselected');
      this.reorder();
      return node;
    },
    open: function(){
      return this.all(function(node){
        window.location = '#' + node.role.topic().url();
      });
    },
    reorder: function(){
      if (this._selected.length > 0){
        var everyone = this._selected.first().world();
        var order = function(a, b){
          return everyone.indexOf(a) - everyone.indexOf(b);
        }
        this._selected = this._selected.sort(order);
      }
    },
    inspect: function(){
      this.single(function(node){
        console.dir({
          selected: [node.toString(), node],
          descendants: node.descendants().and_self().map(annotate),
          children: node.children().map(annotate),
          around: [node.above(), node, node.below()].compact().map(annotate)
        });
      });
    },
    single: function(fn, options){
      fn = fn || function(){};
      options = _.defaults(options || {}, {reverse: false});
      var result;
      var selected = (options.reverse ? this.selected().reverse() : this.selected()).first();
      if (selected) {
        result = fn(selected) || selected;
      }
      return selected;
    },
    all: function(fn, options){
      fn = fn || function(){};
      options = _.defaults(options || {}, {reverse: false});
      var selected = options.reverse ? this.selected().reverse() : this.selected();
      return selected.map(fn)
    },
    edit: function(){
      return this.single(function(node){
        node.trigger('edit');
      });
    },
    remove: function(){
      var self = this;
      var result = this.selected().reject(function(n){return n === self.root;}); //cannot remove root
      var nodes = result.slice(0);
      var node = nodes.pop();
      nodes.each(function(n){
        n.remove();
      });
      var below = node.below();
      var target = (below && below.parent === node ? node.nextSibling() : below) || node.above();
      self.clear();
      node.remove();
      self.select(target);
      return result;
    },
    head: function(absolute){
      var self = this;
      return this.single(function(node){
        return self.select(node.head({absolute: absolute}));
      });
    },
    tail: function(absolute){
      var self = this;
      return this.single(function(node){
        return self.select(node.tail({absolute: absolute}));
      });
    },
    up: function(){
      var self = this;
      return this.single(function(node){
        self.select(node.above());
      });
    },
    down: function(){
      var self = this;
      return this.single(function(node){
        self.select(node.below());
      }, {reverse: true});
    },
    moveUp: function(){
      return this.all(function(node){
        return node.up();
      });
    },
    moveDown: function(){
      return this.all(function(node){
        return node.down();
      }, {reverse: true});
    },
    collapse: function(){
      return this.all(function(node){
        return node.collapse();
      });
    },
    expand: function(){
      return this.all(function(node){
        return node.expand();
      });
    },
    outdent: function(){
      return this.all(function(node){
        return node.outdent();
      }, {reverse: true});
    },
    indent: function(){
      return this.all(function(node){
        return node.indent();
      });
    },
    createSibling: function(){
      var self = this;
      return this.single(function(node){
        var spawned = node.parent.spawn();
        spawned.reposition({after: node});
        self.select(spawned);
        spawned.trigger('edit', {selectAll: true});
        return spawned;
      });
    },
    createChild: function(){
      var self = this;
      return this.single(function(node){
        var spawned = node.spawn();
        self.select(spawned);
        spawned.trigger('edit', {selectAll: true});
        return spawned;
      });
    },
    clear: function(){
      while (this._selected.length > 0){
        this.deselect(this._selected[0]);
      }
      return this;
    },
    selected: function(){
      return this._selected.slice(0);
    }
  });

  _.extend(TreeController.prototype, Backbone.Events);

  return TreeController;

});
