
var pouchLinks = new Map();
var pouchNodes = new Map();
var last_seq = 0;

var pouch;

function openDB (project) {
  pouch = new PouchDB(project/*'http://host:5984/project'*/);
  fetchDocsSubscribeAndPopulateTrees();
  return true
}

function fetchDocsSubscribeAndPopulateTrees () {
  return pouch.allDocs({include_docs: true, update_seq: true})
    .then (function (docs) {
      if (docs.update_seq) {last_seq = docs.update_seq};
      docs.rows.forEach (function (dbRow) {
        if (dbRow.doc.docType == "node") {
          pouchNodes.set(dbRow.doc._id, dbRow.doc)
        } else if (dbRow.doc.docType = "link") {
          pouchLinks.set(dbRow.doc._id, dbRow.doc)
        } else if (dbRow.doc.docType = "type") {
          types.push(dbRow.doc)
        } else {
          console.log ("unrecognised docType: " + dbRow.docType)
        }
      });
      return
    })
    .then (function () {
      fancytrees.forEach (function (tree) {
        tree.reload(generateTreeSource());
      });
      return
    })
    .then (function () {
      var since; // TO DO hassle pouch to support last_seq
      if (last_seq = 0) {since="now"}else{since=last_seq};
      pouch.changes({live: true, since: "now", include_docs: true})
        .on('change', function (change) {
          console.log ("a change arrived: " + JSON.stringify(change));
          reactToChange(change)
        })
        .on('error', function (error) {
          alert("Change error: "+ error)
        });
      return;
    })
    .catch(function (err) {console.log('error: ' + err);
      return;
    })
}

// The publish end
function publishUndoable(doIt, undoIt) {
  publish (doIt);
  undoManager.add ({
    undo: function () {publish (undoIt)},
    redo: function () {publish (doIt)}
  })
}

function publish (changes) {
  changes.forEach (function (change) {
    if (change.docType == "link") {
      var pouchLink = pouchLinks.get(change._id);
      if (pouchLink) {change.rev = pouchLink.rev}; // necessary for undo redo
    } else if (change.docType == "node") {
      var pouchNode = pouchNodes.get(change._id);
      if (pouchNode) {change.rev = pouchNode.rev}; // necessary for undo redo
    } else {
      console.log ("Publish - unknown docType: " + change.docType);
      return
    }
    if (pouch) {
      pouch.put (change)
      .then(function (response) {
        var rev = response.rev;
        change._rev = rev;
      })
      .catch(function (err) {
        alert ("Node put error: " + err);
        // TO DO need to handle conflict errors
      })
    } else {
      var changeWrapper = {doc: change};
      setTimeout (function () {reactToChange(changeWrapper)},10);
    }
  })
}

// The subscribe end
function reactToChange(change) {
  var changedDoc = change.doc;
  fancytrees.forEach (function (tree) {
    if (changedDoc.docType == "link") {
      tree.linkChanged(changedDoc)
    } else if (changedDoc.docType == "node") {
      tree.nodeChanged(changedDoc)
    } else {
      console.log ("React - unknown docType: " + changedDoc.docType)
    }
  })
}

$.ui.fancytree._FancytreeClass.prototype.linkChanged = function(changedDoc) {
  console.log ("local react: "+ changedDoc.docType + " id: "+changedDoc._id+" source: "+ changedDoc.source + " target: " + changedDoc.target);
  pouchLinks.set(changedDoc._id, changedDoc);
  var parentClones;
  var masterParent;
  if (changedDoc.source) {
    parentClones = this.getNodesByRef (changedDoc.source);
    masterParent = parentClones.find (function(c) {return c.isMaster()});
  } else {
    masterParent = this.getRootNode();
  }
  var fancyNode = this.getNodeByKey (changedDoc._id);
  if (changedDoc._deleted) {
    pouchLinks.delete(changedDoc._id);
    if (fancyNode) {
      fancyNode.remove();
      masterParent.performColumnAggregation();
      masterParent.flash // ideally flash something
    }
  } else {
    // moveTo has a contorted set of options
    // for getting this node in the right place.
    // Would be much better if it just supported "position or index"
    var position = changedDoc.position;
    if (fancyNode) {
      // exists, so it's moved
      var oldParent = fancyNode.getParent();
      if (position >= masterParent.countChildren()) {
        fancyNode.moveTo(masterParent,"child")
      } else if (position=0){
        fancyNode.moveTo(masterParent,"firstChild")
      } else {
        var sibling = masterParent.getChildren()[position];
        fancyNode.moveTo(sibling,"after")
      }
      if (!oldParent.isRootNode()) {oldParent.performColumnAggregation()};
      if (!masterParent.isRootNode()) {masterParent.performColumnAggregation()};
      fancyNode.flash();
      //      oldParent.render (true, true);
    } else {
      // doesnt exist, but the pouchNode does.
      var pouchNode = pouchNodes.get(changedDoc.target);
      if (!masterParent.hasChildren() || position >= masterParent.countChildren()) {
        position = null
      };
      var master = true;
      var existingClones = this.getNodesByRef(changedDoc.target);
      if (existingClones && existingClones.length > 0) {master = false};
      fancyNode =
        masterParent.addChildren(
          {key: changedDoc._id, refKey: changedDoc.target, title: pouchNode.title, type: pouchNode.type, expanded: changedDoc.expanded, isMaster: master}, position);
      fancyNode.addClass("greens-"+pouchNode.type);
      if (!master) {fancyNode.addClass("isSlave")};
      fancyNode.performRowCalcs()
      fancyNode.flash();
    };
  }
}

$.ui.fancytree._FancytreeClass.prototype.nodeChanged = function(changedDoc) {
  console.log ("local react: "+ changedDoc.docType + " id: "+changedDoc._id+" title: "+ changedDoc.title);
  if (changedDoc._deleted) {
    pouchNodes.delete(changedDoc._id)
  } else {
    pouchNodes.set(changedDoc._id, changedDoc)
    var fancyClones = this.getNodesByRef (changedDoc._id);
    if (fancyClones) {
      var oldType = fancyClones[0].type;
      fancyClones.forEach ( function (f) {
        f.type = changedDoc.type;
        f.removeClass(greens-oldType);
        f.addClass ("greens-"+changedDoc.type)
        f.setTitle (changedDoc.title);
        if (f.isMaster()) {
          f.removeClass("isSlave")
          if (!f.hasChildren()) { //isLeaf()
            f.performRowCalcs()
          } else {
            f.performColumnAggregation()
          }
        } else {
          f.addClass("isSlave")
        }
        f.flash()
      })
    }
  }
}

$.ui.fancytree._FancytreeNodeClass.prototype.flash = function(){
  //  console.log (this.title + " flash on");
  this.addClass("flash");
  var node = this;
  setTimeout (function () {
    //    console.log (node.title + " flash off");
    node.removeClass("flash")
  }, 500);
}
