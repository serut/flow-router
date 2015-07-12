SsrContext = function() {
  this._html = "";
  this._collections = {};
};

SsrContext.prototype.getCollection = function(collName) {
  var collection = this._collections[collName];
  if(!collection) {
    var minimongo = Package['minimongo'];
    collection = this._collections[collName] = new minimongo.LocalCollection();
  }

  return collection;
};

SsrContext.prototype.setHtml = function(html) {
  this._html = html;
};

SsrContext.prototype.getHtml = function() {
  return this._html;
};

SsrContext.prototype.addSubscription = function(name, params) {
  console.log("adding data data --", name, params);
  var self = this;
  var pub = Meteor.default_server.publish_handlers[name];
  var publishContext = {};
  // here we can use a lot of stuff from fast-render
  // since it does solves publication contexts, auth and everything
  // already.
  var cursors = pub.apply(publishContext, params);
  if(cursors && !(cursors instanceof Array)) {
    cursors = [cursors];
  }

  if(cursors) {
    cursors.forEach(function(cursor) {
      var collName = cursor._cursorDescription.collectionName;
      var collection = self.getCollection(collName);

      cursor.fetch().forEach(function(item) {
        // we need to merge data here
        var existingDoc = collection.findOne(item._id);
        if(existingDoc) {
          _.extend(existingDoc, item);
          delete existingDoc._id;
          collection.update(item._id, existingDoc);
        } else {
          collection.insert(item);
        }
      });
    });
  }
};
