var treeConfig = {
  //  checkbox: true,
  titlesTabbable: true,     // Add all node titles to TAB chain
  quicksearch: true,        // Jump to nodes when pressing first character

  extensions: ["clones", "childcounter", "edit", "dnd5", "table", "gridnav"],

  source: [],

  clones: {highlightClones: true},
  dnd5: {
    preventVoidMoves: true,
    preventRecursiveMoves: true,
    autoExpandMS: 400,
    dragStart: function(node, data) {return true;},
    dragEnter: function(node, data) {return true;}, // return ["before", "after"];
      // return ["before", "after"];
      //to do - get drop effect and do move, copy, link
    dragDrop: function(node, data) {
      if (data.dropEffect == "copy") {
        addNodesAndLinks (duplicate (true)); // need a deep copy for the added nodes and links
      } else if (data.dropEffect == "move") {
        data.otherNode.moveToNewParent(node)
      } else if (data.dropEffect == "link") {
        data.otherNode.addSlave(node)
      }
    }
  },
  edit: {
    triggerStart: ["clickActive", "dblclick"],
    save: function(event, data) {
    },
    beforeEdit: function(event, data){
      // Only allow Masters to be edited
      return data.node.isMaster();
    },
    close: function(event, data){
      if (data.dirty) {
        var node = data.node;
        node.undoableApplyEdit()
      }
      return true;
    },
  },
  columns: [
    {header: "Posn", valueAttribute: "posn", editable: false},
    {header: "Title", valueAttribute: "title", editable: true},
    {header: "Notes", valueAttribute: "notes", editable: true},
    {header: "Rate", valueAttribute: "rate", editable: true},
    {header: "Number", valueAttribute: "number", editable: true},
    {header: "Total", valueAttribute: "total", editable: false}
  ],
  table: {
    indentation: 10,
    nodeColumnIdx: 2,
    checkboxColumnIdx: 0
  },
  gridnav: {
    autofocusInput: false,
    handleCursorKeys: true
  },

  icon: false,

  childcounter: {
    deep: true,
    hideZeros: true,
    hideExpanded: true
  },

//  types: types,

  renderColumns: function(event, data) {
    var node = data.node;
    var $tdList = $(node.tr).find(">td");
    // (Index #0 is rendered by fancytree by adding the checkbox)
    // Set column #1 info from node data:
    $tdList.eq(0).text(node.getIndexHier());
    $tdList.eq(1).text(node.type);
    // (Index #2 is rendered by fancytree)
    if (node.isMaster()) { // dont render values into slave nodes
      var valuePouchNode = pouchNodes.get(node.refKey)
      if (!node.hasChildren()) { //isLeaf
        $tdList.eq(3).text(valuePouchNode.rate);
        $tdList.eq(4).text(valuePouchNode.number);
      }
      $tdList.eq(5).text(valuePouchNode.sum);
    }
  },

  init: function(event, data) {
    if (!fancytrees.includes(data.tree)) {
      fancytrees.push(data.tree)
    }
  }
}
