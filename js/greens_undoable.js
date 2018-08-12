
// undoable actions
var undoManager = new UndoManager();
// Effected by subscribed changes to pouchNodes and pouchLinks
$.ui.fancytree._FancytreeNodeClass.prototype.undoableApplyEdit = function() {
  //_assert(this.isMaster(), "Can only edit master nodes");
  var oldPouchNode = pouchNodes.get(this.refKey);
  var newPouchNode = Object.assign({}, oldPouchNode); // take a shallow copy
  newPouchNode.type = this.type;
  newPouchNode.title = this.title;
  publishUndoable ([newPouchNode], [oldPouchNode]);
}
$.ui.fancytree._FancytreeNodeClass.prototype.undoableMoveUp = function() {
  var oldPouchLink = pouchLinks.get(this.key)
  var position = this.getIndex();
  if (position > 0) {
    oldPouchLink.position = position;
    var newPouchLink = Object.assign({}, oldPouchLink);
    newPouchLink.position = position-1;
    publishUndoable ([newPouchLink], [oldPouchLink]);
  }
}
$.ui.fancytree._FancytreeNodeClass.prototype.undoableMoveDown = function() {
  var oldPouchLink = pouchLinks.get(this.key)
  var position = this.getIndex();
  if (!position < this.getParent().children.length) {
    oldPouchLink.position = position;
    var newPouchLink = Object.assign({}, oldPouchLink);
    newPouchLink.position = position+1;
    publishUndoable ([newPouchNode], [oldPouchNode]);
  }
}
$.ui.fancytree._FancytreeNodeClass.prototype.undoableIndent = function() {
  var oldPouchLink = pouchLinks.get(this.key)
  var position = this.getIndex();
  var oldParent = this.getParent();
  var newParent = this.getPrevSibling();
  if (newParent) {
    oldPouchLink.position = position;
    var newPouchLink = Object.assign({}, oldPouchLink);
    newPouchLink.position = 0;
    publishUndoable ([newPouchNode], [oldPouchNode]);
  }
}
$.ui.fancytree._FancytreeNodeClass.prototype.undoableOutdent = function() {
  var oldPouchLink = pouchLinks.get(this.key)
  var position = this.getIndex();
  var oldParent = this.getParent();
  if( !this.isTopLevel() ) {
    var newParent = oldParent.getParent();
    oldPouchLink.position = position;
    var newPouchLink = Object.assign({}, oldPouchLink);
    newPouchLink.position = oldParent.getIndex();
    publishUndoable ([newPouchNode], [oldPouchNode]);
  }
}
$.ui.fancytree._FancytreeNodeClass.prototype.undoableAddChild = function() {
  //_assert(this.isMaster(),"Can only insert nodes under master");
  var linkId = uniqueKey();
  var nodeId = uniqueKey();
  var addPouchNode = {_id: nodeId, _rev: null, type: types.get(this.type).defaultChildType, docType: "node", title: "newChild"};
  var removePouchNode = Object.assign({}, addPouchNode);
  removePouchNode._deleted = true;
  var addPouchLink = {_id: linkId, _rev: null, source: this.refKey, target: nodeId, expanded:true, docType: "link", position: 0};
  var removePouchLink = Object.assign({}, addPouchLink);
  removePouchLink._deleted = true;
  publishUndoable(
    [addPouchNode, addPouchLink], [removePouchLink, removePouchNode]
  )
}
$.ui.fancytree._FancytreeNodeClass.prototype.undoableAddSibling = function() {
  var linkId = uniqueKey();
  var nodeId = uniqueKey();
  var addPouchNode = {_id: nodeId, _rev: null, type: this.type, docType: "node", title: "newSibling"};
  var removePouchNode = Object.assign({}, addPouchNode);
  removePouchNode._deleted = true;
  var addPouchLink = {_id: linkId, _rev: null, source: this.getParent().refKey, target: nodeId, expanded:true, docType: "link", position: this.getIndex()};
  var removePouchLink = Object.assign({}, addPouchLink);
  removePouchLink._deleted = true;
  publishUndoable(
    [addPouchNode, addPouchLink], [removePouchLink, removePouchNode]
  )
}
$.ui.fancytree._FancytreeNodeClass.prototype.undoableRemove = function() {
  this.greensRescueMastersFromRemoval(this);
  var linksForRemove = [];
  var nodesForRemove = new Map;
  var docsForRemove = [];
  var docsForResurrect = [];
  var insertPosition = this.getIndex();
  this.greensRemove(linksForRemove, nodesForRemove);
  linksForRemove.forEach (function (removeLink) {
    var resurrectLink = Object.assign({}, removeLink);
    removeLink._deleted = true;
    resurrectLink._deleted = false;
    docsForRemove.push(removeLink);
    docsForResurrect.push(resurrectLink);
  })
  docsForResurrect[docsForResurrect.length -1].position = insertPosition
  nodesForRemove.forEach (function (removeNode) {
    var resurrectNode = Object.assign({}, removeNode);
    removeNode._deleted = true;
    resurrectNode._deleted = false;
    docsForRemove.push(removeNode);
    docsForResurrect.push(resurrectNode);
  })
  docsForResurrect.reverse();

  publishUndoable(docsForRemove, docsForResurrect)
}
$.ui.fancytree._FancytreeNodeClass.prototype.greensRescueMastersFromRemoval = function(removed) {
  if (this.countChildren() >0) {
    var childrenCopy = this.children.slice(0);
    freeClone = childrenCopy.forEach (function (child) {
      child.greensRescueMastersFromRemoval(removed);
    })
  }
  if (this.isMaster()) {
    var freeClone
    var clones = this.tree.getNodesByRef(this.refKey)
    if (clones.length >1) {
      freeClone = clones.find(function(c) {return !c.isDescendantOf (removed)});
      if (freeClone) {freeClone.branch();}
    }
  }
}
$.ui.fancytree._FancytreeNodeClass.prototype.greensRemove = function(linksForRemove, nodesForRemove) {
  //remove from the bottom up.
  //resurrect from the top down.
  if (this.countChildren() >0) {
    var childrenCopy = this.children.slice(0);
    childrenCopy.reverse().forEach ( function (child) {
      child.greensRemove(linksForRemove, nodesForRemove);
    })
  }

  var removeLink = pouchLinks.get(this.key);
//  removeLink.position = this.getIndex();
  linksForRemove.push(removeLink);

  if (this.isMaster()) {
    var clones = this.tree.getNodesByRef(this.refKey)
    clones.forEach (function (clone) {
      if (!clone === this) {clone.greensRemove(linksForRemove, nodesForRemove)}
    })
  }
  var removeNode = pouchNodes.get(this.refKey);
  nodesForRemove.set(removeNode._id, removeNode);
}
