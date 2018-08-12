
var CLIPBOARD = null;

var fancytrees = [];

function closeDown () {
  if (pouch) {
    pouch.close().then(function () {
      // success
      pouch = null
    });
  }
}

function importSankeyJSON (){
  $.getJSON("energy.json", function(result){
      var id = 0;
      var idNum = 0;
      result.links.forEach (function (link) {
          idNum = id++;
          link._id = idNum.toString();
          link._rev = null;
          link.expanded = true;
          link.docType = "link";
          pouchLinks.set(link._id, link)
      })
      result.nodes.forEach (function (node) {
          node._rev = null;
          node.type = "defaultType";
          node.docType = "node";
          node.number = idNum++;
          node.rate = idNum++;
          node.title = node._id;
          pouchNodes.set(node._id, node)
      })
      types = result.types
      fancytrees.forEach (function (tree) {
        tree.reload(generateTreeSource());
      });
  });
}

function importLesMisJSON (){
  $.getJSON("miserables.json", function(result){
      var id = 0;
      result.links.forEach (function (link) {
          idNum = id++;
          link._id = idNum.toString();
          link._rev = null;
          link.expanded = true;
          link.docType = "link";
          pouchLinks.set(link._id, link)
      })
      result.nodes.forEach (function (node) {
          node._id = node.id;
          node._rev = null;
          node.type = node.group;
          node.docType = "node";
          node.title = node.id;
          pouchNodes.set(node._id, node)
      })
      types = result.types
      fancytrees.forEach (function (tree) {
        tree.reload(generateTreeSource());
      })
  })
}

function exportJSON () {
  fs.writeFile("miserables_saved.json",
    {nodes: pouchNodes, links: pouchLinks, types: types}.stringify,
    function (err) {
      if (err) throw err;
      console.log('Saved!');
    }
  )
}

function generateTreeSource () {
  var allFancyObjects = new Map;
  var masterFancyObjects = new Map ();
  var rootFancyObjects = [];
  var linksToPublish = [];
  // generate fancyObjects data
  pouchLinks.forEach (function (l) {
    var pouchChild = pouchNodes.get(l.target);
    if (pouchChild) {
      var fancyObject = {
        key: l._id,
        refKey: pouchChild._id,
        type: pouchChild.type,
        expanded: l.expanded,
        title: pouchChild.title,
        position: l.position,
        isMaster: false,
        extraClasses: "isSlave" + " " + "greens-"+pouchChild.type
      };
      if (!l.source) { // then this is a root node
        rootFancyObjects.push(fancyObject)
      }
      allFancyObjects.set(fancyObject.key, fancyObject);
      if (!masterFancyObjects.has(fancyObject.refKey)) {
        masterFancyObjects.set(fancyObject.refKey, fancyObject);
        fancyObject.isMaster = true;
        fancyObject.extraClasses = "greens-"+pouchChild.type
      }
    }
    else {
      console.log("Missing Node" + l.target + " or " + l.source)
    }
  });
  // generate fancy root nodes ( those not already done above)
  pouchNodes.forEach (function (p) {
    var fancyObject = masterFancyObjects.get(p._id);
    if (!fancyObject) {
      fancyObject = { // this is a root node without a link
        key: uniqueKey(),
        refKey: p._id,
        type: p.type,
        expanded: true,
        title: p.title,
        position: 0,
        isMaster: true,
        extraClasses: "greens-"+p.type
      };
      // create the link (and publish)
      var link = {
        _id: fancyObject.key,
        _rev: null,
        source: null,
        target: fancyObject.refKey,
        expanded: true,
        docType: "link",
        position: 0
      }
      pouchLinks.set(fancyObject.key, link);
      linksToPublish.push(link);
      rootFancyObjects.push(fancyObject)
      if (!masterFancyObjects.has(fancyObject.refKey)) {
        masterFancyObjects.set(fancyObject.refKey, fancyObject);
      }
    };
    fancyObject.isMaster = true; // => isMaster() - errm
  });
  if (linksToPublish.length > 0) {publish(linksToPublish)};
  // construct tree
  pouchLinks.forEach (function (l){
    var childFancyObject = allFancyObjects.get(l._id);
    var parentFancyObject = masterFancyObjects.get(l.source);
    if (childFancyObject && parentFancyObject) {
      if (!parentFancyObject.children) { parentFancyObject.children = []}
      parentFancyObject.children.push(childFancyObject)
    } else {
      if (parentFancyObject) {
        console.log ("Missing Node: " + l._id + " or " + l.source)
      }
    }
  })
  //traverse the tree, calculating the row and column values
  rootFancyObjects.forEach (function (f) {
    initSpreadsheetValues(f)
  })
  if (rootFancyObjects.length === 0) {
    var nodeId = uniqueKey();
    var linkId = uniqueKey();
    publish([ //publish a node and link to generate a root fancy tree node
      {_id: nodeId, _rev: null, type: "project", docType: "node", title: "new project"},
      {_id: linkId, _rev: null, source: null, target: nodeId, expanded: true, docType: "link", position: 0}
    ]);
  }

  // initialise type styles
  initTypes();

  return rootFancyObjects
}


var idIncrement = 0;
function uniqueKey () {return Date.now().toString()+idIncrement++}
