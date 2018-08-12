# greens
## A work in progress

A collaborative editor of hierarchical and network information.

Greens uses fancytree (https://github.com/mar10/fancytree) to present an editable hierachy.

Greens uses pouchdb/couchdb (https://pouchdb.com) for persistance and distributed publish subscribe.

#### Network vs Hierarchical
The data that Greens manipulates is organised as a network of nodes and links. However the user interface presents a hierachical view of the model (parent and children). Greens provides the mapping between the network and the hierarchical models.

The hierarchical view is achieved by duplicating network nodes where they have >1 parent, but recognising that the duplicates are clones of the same node that must be kept in step.

#### Multi user
Many users can work collaboratively on the same document. Pouchdb provides publish subscribe so each user is kept up to date with the changes each is making. Pouch also provides conflict detection and resolution mechanisms for the situation where more than one user is editing the same part of the tree at the same time.

The editor will work seemlessly offline, syncronising users when they connect back to the network.

#### Sreadsheet
The editor will have some limited spreadsheet functionality:

  row calculations between cells in the same row (eg charge = rate * days)

  Aggregation of cell values up through column branches. (eg summing the above charge column)

  In some network node/link models, a value attribute can be assigned to the link (See Sankey diagrams). In the greens hierchical model, the link becomes one of the parent/child relationships. This value on the link is currently not used by the spreadsheet functionality.

#### Which Tree / grid editor
The ui needs to have good support for both hierarchical and grid data. There are loads of tools out there
1. Ag-grid
2. react-redux-grid
3. JSTree
4. slickgrid
5. fancytree

are ones that the author has examined. Each has its own strengths. I have picked fancytree primarilly for its excellent tree support, good documention, light footprint, and recognition of network mapping with its refKey attribute. But its main drawback is its limited spreadsheet grid support; Its columns feature is very much an afterthought. Ag-grid looks a possible candidate, but its a commercial product so unsuitable for my experiments.

#### Desktop vs Web
Initial development used a web browser and remote server for the initial web page. The inital page used urls to cdn versions of its dependencies. I now use electron so greens runs on the desktop, and dependencies use local npm modules. I am having severe problems integrating electron, fancytree, jquery and jquery ui. I believe it can be done - but I am struggling to get it all to work together.

#### Code structure
The greens code is mostly glue between fancytree and pouch, so very little of it is unpolluted by both these tools, but I have split it into functional components.
1. **greens_undoable** - (Almost) every action you perform with Greens is undoable (over the pouch/couch network, not just locally). In fact when the user requests an action, it is not performed directly there and then. Rather the action changes to the nodes and links are published and the ui is changed when the subscription arrives back in the tree. If you have more than one tree on the screen, or multiple users operating remotely, they all get updated in the same way.
2. **greens_spreadsheet** - Not much in here yet - just a mini demo of some of the desired functionality.
3. **greens_pub_sub** - Mostly the interface to pouchdb, although if using local files only, a local pub sub is also provided.
4. **greens_master_slave** - The code that manages the mismatch between the network and hierarchical data models.
5. **greens_core** - the rest

As well as fancytree and pouchdb, the code also makes use of col-resizable and undo-manager.
