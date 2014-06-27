define(['models/document'], function(Document){

  _.extend(Document.prototype, {
    //TODO: add hooks to the various steps to allow extensions?
    act: function(action){
      var actor = _.defaults(_.clone(this.client().user.attributes), {sudoing: false});
      var parents = this.parents().and_self().reject(function(model){
        return model.className === 'TopicMap';
      });
      var doc = parents.detect(function(model){
        return !!this.creator_id;
      });

      //what's the scope?
      var scope = parents.reject(function(model){
        return !model.scopes;
      }).map(function(model){
        return model.scopes();
      }).flatten().compact().uniq().join(' ').enclose('{', '}');

      //what are we affecting?
      var what = [];
      what.push(parents.reverse().map(function(model){
        var what = [model.className.underscore()];
        var types = model.types() || [];
        what.push(types.join(' ').enclose());
        return what.compact().join('');
      }).join(' '));

      //who is doing it?
      var who = [actor.id];
      who.push(actor.groups.map(function(group){
        return '@' + group;
      }));
      if (doc && doc.creator_id() === actor.id) who.push('$creator');
      //if (this.topic_map().get('owner_id') === actor.login) who.push('$owner');
      if (actor.sudoing === true) who.push('$sudoing')

      //serialize the above
      return action + ' : '  + [scope, what.flatten().join(' ')].compact().join(' ') + ' ~ ' + who.flatten().join(' ');
    },
    permits: function(){ //TODO: memoize
      var tm = this.topic_map();
      var permits = tm.get('config').permits || [];
      return permits.map(function(str){
        return new RegExp(str);
      });
    },
    permit: function(action){ //TODO: extra permissions into its own module
      var client = this.client();
      var superuser = client.user.superuser();
      if (superuser) return true;
      var permits = this.permits();
      var serialized  = this.act(action);
      var parents = this.parents().and_self();
      var permit = permits.any(function(permission){
        return permission.test(serialized);
      });
      permit = true; //TODO: temporary for development purposes only.
      var access = permit ? 'granted' : 'denied';
      this.trigger(access, action, serialized, access);
      this.topic_map().trigger(access, action, this, serialized, access); //TODO: issue when tm itself is changed?
      return permit;
    }
  });

  Document.aspects({
    created: function($super){
      if (!this.permit('create'))
        this.detach({rollback: true});
      return $super.call(this);
    },
    set: function($super, attrs, options){
      return this._initialized && this.isLoaded() && !this.permit('update') ? this :$super.call(this, attrs, options);
    },
    detach: function($super, options){
      options = options || {};
      if (this.collection && (options.rollback || this.permit('delete'))){
        $super.call(this, options);
      }
      return this;
    }
  });

//TODO: read restrictions should only occur server side.  once data has made it to the client there is no read restriction.
//  _.aspect(this.Query.prototype, 'matches', function($super, item){
//    return $super.call(this, item) && (!item.permit || item.permit('read'));
//  });

  return Document;

});
