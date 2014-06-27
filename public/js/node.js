define(['class', 'backbone'], function(Class, Backbone){

  //TODO: underscore methods?
  var selfish = function(self, arr){
    arr.and_self = function(){
      return [self].concat(arr);
    };
    return arr;
  };

  var selfless = function(self, arr){
    arr.less_self = function(){
      return arr.reject(function(item){
        return item === self;
      });
    };
    return arr;
  };

  var Node = Class.extend({
    className: 'Node',
    init: function(role, options){
      _.bindAll(this, 'propagate','expand','collapse','expanded','collapsed','leaf','reveal','world','depth','toString','family','summon','children','sort','spawn','up','down','indent','outdent','position','reposition','remove','leave','cleave','adopt','root','head','tail','isRoot','siblings','ancestors','descendants','nextSibling','prevSibling','above','below','grandparent','visible'); //TODO: check all methods

      this._collapsed = false;
      this.role = role;
      this.options = _.defaults(options || {}, {}); //TODO: store meta or maybe a series of functions that were derived from the meta.

      var node = this;
      var topic = role.topic();

      this.propagate();

      console.log(this);
      console.log('created node: ' + this.toString());
      console.log(this.children().map(function(c){return c.toString ? c.toString() : '.';}));

      var sameRole = function(n){
        return n.role === role;
      };
      //TODO: remember to add all unbinds.
      //TODO: how could I avoid the associated event caused inside the spawn method?

      topic.bind('associated', function(role){
        var assoc = role.association();
        var included = (assoc.isa('decomposition') && assoc.connected() && topic === assoc.roles().type('task').first().topic() && role.isa('subtask') && !node.children().any(sameRole));
        if (included){
          node.adopt(new Node(role, options));
        };
      });

      node.bind('removed', function(){
        role.detach();
        if (role.spawned && topic.stranded())
          topic.detach();
      });

      role.bind('removed', function(){
        topic.associated() || topic.detach(); //remove dissociated topics --- TODO: drive this with metadata.
        if (!node.isRoot()) //leave root alone.
          node.remove();
      });

      topic.bind('remove', function(){
        node.remove();
      });

      role.bind('ping', function(e){
        e.nodes.push(node);
      });
      //NOTE: we don't want to do anything if the topic is handled by one of the other methods.
    },
    propagate: function(){ //discover or reconstitute child nodes (this could be in response to the gui which may have a given node collapsed)
      //lose all references to existing nodes without touching any models.
      var node = this;
      var excludes = this.ancestors().and_self().map(function(n){return n.role});
      var ancestors = function(r){
        return excludes.contains(r);
      };
      var subtasks = function(r){
        return r.type() === 'subtask';
      };
      var children = this.role.topic().roles({type: 'task'}).counterparts().all();
      children = _.reject(children, ancestors);
      children = _.select(children, subtasks);
      var names = children.map(function(r){return r.topic().name();});
      return children.map(function(role){
        return node.adopt(new Node(role, node.options));
      });
    },
    depth: function(){
      return this.ancestors().length;
    },
    leaf: function(){
      return this.children().length === 0;
    },
    children: function(){ //existing node references
      var e = {children: []};
      this.trigger('summon', e);
      return e.children.sort(this.sort);
    },
    sort: function(n1, n2){ //method for ordering children
      return (n1.pos || 0) - (n2.pos || 0);
    },
    spawn: function(options){
      var tm = this.role.topic_map();
      var node = this;

      //TODO: determine vars using meta rules.
      var association_type = 'decomposition'; //this.role.association().type();
      var child_topic_types= ['task']; //this.role.counterpart().topic().types();
      var parent_role_type = 'task'; //this.role.type();
      var child_role_type  = 'subtask'; //this.role.counterpart().type();
      var topic_name_type =  'summary'; //this.role.topic().names().first().type();
      var topic_name = 'New Topic';
      var target;

      tm.association({type: association_type}, function(a){
        a.role({type: parent_role_type, topic: node.role.topic()})
        tm.topic({types: child_topic_types}, function(topic){
          topic.name({type: topic_name_type, value: topic_name});
          target = a.role({type: child_role_type, topic: topic}); // we should trigger 'associated' here.
        });
        target.spawned = true;
      });

      var e = {nodes: []};
      target.trigger('ping', e)
      var spawned = e.nodes.first();

      return spawned;
    },
    leave: function(){
      var child = this;
      var parent = child.parent;
      if (parent){
        child.summon && parent.unbind('summon', child.summon);
        //console.log('summon:unbind', parent.toString(), child.toString());
        child.parent = null;
        parent.trigger('lost', child);
      };
      return parent;
    },
    cleave: function(parent){
      var child = this;
      this.parent = parent;
      //console.log('summon:bind', parent.toString(), child.toString());
      parent.bind('summon', child.summon);
    },
    remove: function(){
      this.leave();
      this.trigger('removed');
      return this;
    },
    summon: function(e){
      e.children.push(this);
    },
    adopt: function(child, options){
      options = options || {};
      //console.log({parent: this, adopted: child});
      //console.log('parent: ' + this.toString());
      //console.log('child:  ' + child.toString());
      var locate = child.parent ? child.reposition : child.position;
      child.leave();
      child.cleave(this);
      this.trigger('adopted', child, options); //response should have node rendered in the correct position
      locate(options);
      return child;
    },
    //TODO: maybe we take the event name (position or reposition) as an option instead of two methods;
    position: function(options){
      var siblings = this.siblings();
      options = _.defaults(options || {},{eventName: 'positioned'});
      var node = this;
      var eventName = options.eventName, before = options.before, after = options.after || siblings.last();
      var idx;

      var reorder = function(){
        //TODO: manage all 'persistible' sorting updates here.
        siblings.each(function(node, idx){
          node.pos = idx;
        });
      };

      if (before) {
        idx = siblings.indexOf(before);
        idx > 0 ? siblings.splice(idx, 0, node) : siblings.unshift(node);
        reorder();
        node.trigger(eventName + ':preceded', before);
        before.trigger(eventName + ':preceded-by', node);
      } else if (after) {
        idx = siblings.indexOf(after);
        siblings.splice(idx + 1, 0, node);
        reorder();
        node.trigger(eventName + ':followed', after);
        after.trigger(eventName + ':followed-by', node);
      } else {
        reorder();
        //throw eventName + ' requires either a before or after argument.';
      }

      //TODO: send messages to siblings about positionings?
      //may not be necessary.
      //may be able to remove the element and relocate the element.  this is the goal.  there would be low overhead to this.
      this.trigger(eventName, options);
      return this;
    },
    reposition: function(options){
      options = options || {};
      options.eventName = 'repositioned';
      this.position(options);
      return this;
    },
    root: function(){
      return this.ancestors().last() || this;
    },
    head: function(options){ //synonym
      options = _.defaults(options || {}, {absolute: false});
      return options.absolute ? this.root() : this.siblings().and_self().first();
    },
    tail: function(options){
      options = _.defaults(options || {}, {absolute: false});
      return options.absolute ? this.root().below({method: 'select'}).last() : this.siblings().and_self().last();
    },
    isRoot: function(){
      return this.root() === this;
    },
    up: function(){
      var node = this;
      var before = node.above(), parent = before ? before.parent : null;
      if (before && parent){
        if (this.parent === parent){
          node.reposition({before: before});
        } else {
          parent.adopt(node, {before: before});
        }
      } else {
        this.trigger('reposition:blocked', 'up');
      }
      return this;
    },
    down: function(){
      var node = this;
      var below = node.below({method: 'select', skipDescendants: true});
      var options, parent;
      if (below.length > 1) {
        options = {before: below[1]};
        parent = options.before.parent;
      } else if (below.length === 1) {
        options = {after: below[0]};
        parent = options.after.parent;
      };
      if (options && parent){
        if (this.parent === parent){
          node.reposition(options);
        } else {
          parent.adopt(node, options);
        }
      } else {
        this.trigger('reposition:blocked', 'down');
      }
      return this;
    },
    indent: function(){ //aka right
      var node = this;
      var sibling = this.prevSibling();
      if (sibling) {
        sibling.adopt(node, {after: sibling.children().last()});
      } else {
        this.trigger('reposition:blocked', 'indent');
      }
      return this;
    },
    outdent: function(){ //aka left
      var node = this;
      var gp = this.grandparent();
      if (gp) {
        gp.adopt(node, {after: node.parent});
      } else {
        this.trigger('reposition:blocked', 'outdent');
      }
      return this;
    },
    siblings: function(){
      var self = this;
      var inclusive = (this.parent ? this.parent.children() : []);
      var exclusive = inclusive.reject(function(node){
        return node === self;
      });
      exclusive.and_self = function(){
        return inclusive;
      };
      return exclusive;
    },
    ancestors: function(options){
      options = options || {};
      var self = this;
      var coll = [];
      var p = this;
      while(p.parent){
        coll.push(p.parent);
        p = p.parent;
      };
      return selfish(this, coll);
    },
    descendants: function(options){
      options = options || {};
      var self = this;
      var coll = this.children().map(function(child){
        return [child, child.descendants()].flatten();
      }).flatten();
      return selfish(this, coll);
    },
    prevSibling: function(){
      var node = this;
      return this.above({
        collection: function(){
          return node.siblings().and_self();
        }
      });
    },
    nextSibling: function(){
      var node = this;
      return this.below({
        collection: function(){
          return node.siblings().and_self();
        }
      });
    },
    toString: function(){
      return this.depth() + ': ' + this.role.topic().name();
    },
    grandparent: function(){
      return this.parent && this.parent.parent ? this.parent.parent : null;
    },
    family: function(){
      var seed = this.grandparent() || this.parent || this;
      return seed ? seed.descendants().and_self() : [];
    },
    above: function(options){ //prev visible node at any level
      options = _.defaults(options || {}, {method: 'detect'}); //or select
      var self = this;
      var method = options.method;
      var coll = _.resolve(options.collection || this.family);
      var idx = coll.indexOf(self);
      var prevNodes = idx > -1 ? coll.slice(0, idx).reverse() : [];
      return prevNodes[method](function(node){
        return node.visible();
      });
    },
    below: function(options){
      options = _.defaults(options || {}, {method: 'detect', skipDescendants: false}); //or select
      var self = this;
      var method = options.method;
      var skip = options.skipDescendants ? this.descendants() : [];
      var coll = _.resolve(options.collection || this.root().descendants().and_self());
      var idx = coll.indexOf(self);
      var nextNodes = idx > -1 ? coll.slice(idx + 1) : [];
      return nextNodes[method](function(node){
        return node.visible() && skip.indexOf(node) === -1;
      });
    },
    world: function(){ //all nodes in the entire hierarchy
      return selfless(this, this.root().descendants().and_self());
    },
    collapsed: function(){
      return this._collapsed;
    },
    collapse: function(){
      if (!this._collapsed && this.children().length > 0){
        this._collapsed = true;
        this.trigger('collapsed');
      };
      return this;
    },
    expanded: function(){
      return !this._collapsed;
    },
    expand: function(){
      if (this._collapsed){
        this._collapsed = false;
        this.trigger('expanded');
      };
      return this;
    },
    reveal: function(){ //expand all ancestors
      this.ancestors().each(function(ancestor){
        ancestor.expand();
      });
      return this;
    },
    visible: function(){
      return !this.ancestors().any(function(ancestor){
        return ancestor.collapsed();
      });
    }
  });

  _.extend(Node.prototype, Backbone.Events);

  return Node;

});
