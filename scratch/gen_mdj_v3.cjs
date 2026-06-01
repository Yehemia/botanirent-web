const fs = require('fs');

// ============================================================
// StarUML MDJ Generator v3 - Clean minimal views
// Fixed: no duplicate labels, proper editable views
// ============================================================

let idSeq = 0;
function uid(prefix) {
  idSeq++;
  return `AAAAAF${prefix}${String(idSeq).padStart(6, '0')}`;
}

// ============================================================
// DATA
// ============================================================
const allClasses = [
  // MODULE 1: POS & Transaksi
  { name: 'POSView', stereotype: 'Boundary', module: 1,
    attrs: [['searchBar','SearchBar'],['catalogGrid','Grid'],['btnAddToCart','Button'],['cartTable','Table'],['btnCheckout','Button'],['customerSelector','Select'],['rentalDateModal','Modal'],['paymentModal','Modal']],
    ops: [['handleAddToCart',[['item','Object']],'void'],['handleRemoveFromCart',[['itemId','uuid']],'void'],['handleCheckout',[['formData','FormData']],'void']]
  },
  { name: 'POSController', stereotype: 'Controller', module: 1,
    attrs: [['categoryModel','Object'],['itemModel','Object'],['packageModel','Object'],['customerModel','Object'],['settingsModel','Object'],['transactionModel','Object'],['activityLogModel','Object']],
    ops: [['getPOSData',[['profile','Object']],'Object'],['getCheckoutData',[['profile','Object']],'Object'],['checkout',[['profile','Object'],['formData','FormData'],['config','Object']],'Object']]
  },
  { name: 'TransactionModel', stereotype: 'Entity', module: 1,
    attrs: [['transactionsTable','String'],['transactionItemsTable','String'],['id','uuid'],['branch_id','uuid'],['cashier_id','uuid'],['customer_id','uuid'],['transaction_code','String'],['type','String'],['subtotal','numeric'],['discount_amount','numeric'],['discount_percent','numeric'],['total_amount','numeric'],['paid_amount','numeric'],['change_amount','numeric'],['payment_method','String'],['payment_status','String'],['midtrans_transaction_id','String'],['midtrans_snap_token','String'],['item_name','String'],['quantity','int'],['unit_price','numeric'],['rental_start_date','date'],['rental_end_date','date'],['rental_days','int'],['rental_status','String'],['returned_at','timestamptz'],['return_condition','String'],['return_notes','String']],
    ops: [['checkoutTransaction',[['payload','Object']],'Object'],['getTransactionDetails',[['id','uuid']],'Object'],['getTransactionsHistory',[['branchId','uuid']],'Array'],['updateTransaction',[['id','uuid'],['data','Object']],'Object'],['getActiveRentalsForReturns',[['branchId','uuid']],'Array'],['updateTransactionItem',[['id','uuid'],['data','Object']],'Object']]
  },
  { name: 'CustomerModel', stereotype: 'Entity', module: 1,
    attrs: [['customersTable','String'],['id','uuid'],['branch_id','uuid'],['full_name','String'],['phone','String'],['email','String'],['address','String'],['notes','String'],['created_at','timestamptz']],
    ops: [['getCustomers',[['branchId','uuid']],'Array'],['getCustomersMinimal',[['branchId','uuid']],'Array'],['createCustomer',[['customerData','Object']],'Object'],['getCustomerDetails',[['id','uuid']],'Object']]
  },
  // MODULE 2: Pengembalian & Denda
  { name: 'ReturnsView', stereotype: 'Boundary', module: 2,
    attrs: [['invoiceInput','TextField'],['btnSearch','Button'],['rentalsTable','Table'],['btnReturnItems','Button'],['returnModal','Modal'],['btnConfirmReturn','Button']],
    ops: [['handleSearchTransaction',[['code','String']],'void'],['handleProcessReturn',[['payload','Object']],'void']]
  },
  { name: 'PenaltiesView', stereotype: 'Boundary', module: 2,
    attrs: [['rulesTable','Table'],['btnUpdateRule','Button'],['ruleModal','Modal'],['inputAmount','TextField'],['btnSaveRule','Button']],
    ops: [['handleUpdateRule',[['ruleId','uuid'],['amount','numeric']],'void']]
  },
  { name: 'ReturnsController', stereotype: 'Controller', module: 2,
    attrs: [['transactionModel','Object'],['penaltyModel','Object'],['settingsModel','Object'],['bookingModel','Object'],['assetModel','Object'],['activityLogModel','Object']],
    ops: [['getReturnsPageData',[['profile','Object']],'Object'],['processReturn',[['profile','Object'],['formData','FormData']],'Object']]
  },
  { name: 'PenaltiesController', stereotype: 'Controller', module: 2,
    attrs: [['penaltyModel','Object'],['activityLogModel','Object']],
    ops: [['getPenaltyRules',[['profile','Object']],'Object'],['updatePenaltyRule',[['profile','Object'],['formData','FormData']],'Object']]
  },
  { name: 'PenaltyModel', stereotype: 'Entity', module: 2,
    attrs: [['penaltiesTable','String'],['penaltyRulesTable','String'],['id','uuid'],['transaction_item_id','uuid'],['penalty_rule_id','uuid'],['branch_id','uuid'],['type','String'],['late_days','int'],['calculated_amount','numeric'],['payment_status','String'],['notes','String'],['paid_at','timestamptz'],['rule_name','String'],['rule_calculation_method','String'],['rule_amount','numeric']],
    ops: [['getPenaltyRules',[],'Array'],['getPenalties',[['branchId','uuid']],'Array'],['insertPenalty',[['penaltyData','Object']],'Object'],['updatePenaltyRule',[['id','uuid'],['amount','numeric']],'Object']]
  },
  // MODULE 3: Inventaris & Paket
  { name: 'InventoryView', stereotype: 'Boundary', module: 3,
    attrs: [['itemsTable','Table'],['btnAddNewItem','Button'],['itemModal','Modal'],['inputItemName','TextField'],['inputBarcode','TextField'],['btnSaveItem','Button']],
    ops: [['handleSaveItem',[['formData','FormData']],'void'],['handleDeleteItem',[['id','uuid']],'void']]
  },
  { name: 'PackagesView', stereotype: 'Boundary', module: 3,
    attrs: [['packagesTable','Table'],['btnCreatePackage','Button'],['packageModal','Modal'],['inputPackageName','TextField'],['btnSavePackage','Button']],
    ops: [['handleSavePackage',[['formData','FormData']],'void'],['handleDeletePackage',[['id','uuid']],'void']]
  },
  { name: 'ItemController', stereotype: 'Controller', module: 3,
    attrs: [['itemModel','Object'],['categoryModel','Object'],['activityLogModel','Object']],
    ops: [['getItems',[['profile','Object']],'Object'],['getItemDetails',[['id','uuid']],'Object'],['saveItem',[['profile','Object'],['formData','FormData']],'Object'],['deleteItem',[['id','uuid']],'Object']]
  },
  { name: 'PackageController', stereotype: 'Controller', module: 3,
    attrs: [['packageModel','Object'],['itemModel','Object'],['activityLogModel','Object']],
    ops: [['getPackages',[['profile','Object']],'Object'],['savePackage',[['profile','Object'],['formData','FormData']],'Object'],['deletePackage',[['id','uuid']],'Object']]
  },
  { name: 'ItemModel', stereotype: 'Entity', module: 3,
    attrs: [['itemsTable','String'],['id','uuid'],['branch_id','uuid'],['category_id','uuid'],['name','String'],['description','String'],['barcode','String'],['rental_price_per_day','numeric'],['sell_price','numeric'],['stock_total','int'],['stock_available','int'],['is_active','boolean'],['category_name','String'],['category_type','String']],
    ops: [['getItems',[['branchId','uuid']],'Array'],['getActiveSewaItems',[['branchId','uuid']],'Array'],['getActiveItems',[['branchId','uuid']],'Array'],['getItemDetails',[['id','uuid']],'Object'],['insertItem',[['itemData','Object']],'Object'],['updateItem',[['id','uuid'],['itemData','Object']],'Object'],['deleteItem',[['id','uuid']],'boolean'],['bulkInsertItems',[['itemsList','Array']],'boolean']]
  },
  { name: 'CategoryModel', stereotype: 'Entity', module: 3,
    attrs: [['categoriesTable','String'],['id','uuid'],['name','String'],['type','String'],['is_active','boolean']],
    ops: [['getCategories',[['branchId','uuid']],'Array'],['insertCategory',[['categoryData','Object']],'Object'],['updateCategory',[['id','uuid'],['categoryData','Object']],'Object'],['deleteCategory',[['id','uuid']],'boolean']]
  },
  { name: 'PackageModel', stereotype: 'Entity', module: 3,
    attrs: [['packagesTable','String'],['packageItemsTable','String'],['id','uuid'],['branch_id','uuid'],['name','String'],['description','String'],['image_url','String'],['package_price','numeric'],['is_active','boolean'],['item_quantity','int']],
    ops: [['getPackages',[['branchId','uuid']],'Array'],['getActivePackages',[['branchId','uuid']],'Array'],['getPackageDetails',[['id','uuid']],'Object'],['createPackage',[['data','Object'],['items','Array']],'Object'],['updatePackage',[['id','uuid'],['data','Object'],['items','Array']],'Object'],['deletePackage',[['id','uuid']],'boolean']]
  },
  // MODULE 4: Aset Fisik & Booking
  { name: 'AssetStatusView', stereotype: 'Boundary', module: 4,
    attrs: [['searchInput','TextField'],['kanbanGrid','Grid'],['btnUpdateStatus','Button'],['statusBadge','Label']],
    ops: [['handleUpdateStatus',[['assetId','uuid'],['status','String']],'void'],['getAssetsByStatus',[['status','String']],'Array']]
  },
  { name: 'BookingView', stereotype: 'Boundary', module: 4,
    attrs: [['calendar','Calendar'],['btnBlockMaintenance','Button'],['maintenanceModal','Modal'],['dateRangePicker','DateRangePicker'],['btnSaveBlock','Button']],
    ops: [['handleCreateBlock',[['formData','FormData']],'void'],['handleCancelBlock',[['id','uuid']],'void']]
  },
  { name: 'AssetStatusController', stereotype: 'Controller', module: 4,
    attrs: [['assetModel','Object']],
    ops: [['getAssets',[['profile','Object']],'Object'],['updateStatus',[['profile','Object'],['formData','FormData']],'Object']]
  },
  { name: 'BookingController', stereotype: 'Controller', module: 4,
    attrs: [['bookingModel','Object'],['categoryModel','Object'],['itemModel','Object'],['assetModel','Object'],['branchModel','Object'],['activityLogModel','Object']],
    ops: [['getBookingPageData',[['profile','Object'],['searchBranchId','uuid']],'Object'],['createMaintenance',[['profile','Object'],['formData','FormData']],'Object'],['deleteBooking',[['profile','Object'],['formData','FormData']],'Object']]
  },
  { name: 'AssetModel', stereotype: 'Entity', module: 4,
    attrs: [['rentalAssetsTable','String'],['id','uuid'],['item_id','uuid'],['asset_code','String'],['status','String'],['notes','String'],['last_status_change','timestamptz']],
    ops: [['getAssetsStatusCounts',[['branchId','uuid']],'Object'],['getAssets',[['params','Object']],'Array'],['updateAssetStatus',[['id','uuid'],['status','String'],['notes','String']],'Object'],['deleteMaintenanceBookingForAsset',[['assetId','uuid']],'boolean'],['getReadyAssetsForItem',[['itemId','uuid']],'Array'],['insertAssets',[['assetsList','Array']],'boolean']]
  },
  { name: 'BookingModel', stereotype: 'Entity', module: 4,
    attrs: [['bookingsTable','String'],['id','uuid'],['rental_asset_id','uuid'],['transaction_item_id','uuid'],['branch_id','uuid'],['start_date','date'],['end_date','date'],['status','String']],
    ops: [['getBranchBookings',[['branchId','uuid']],'Array'],['createBooking',[['bookingData','Object']],'Object'],['getBookingDetails',[['id','uuid']],'Object'],['deleteBooking',[['id','uuid']],'boolean'],['updateBookingStatusByTransactionItem',[['transactionItemId','uuid'],['status','String']],'boolean']]
  },
  // MODULE 5: Pengguna, Cabang, & Audit Trail
  { name: 'BranchManagementView', stereotype: 'Boundary', module: 5,
    attrs: [['branchesTable','Table'],['btnCreateBranch','Button'],['branchModal','Modal'],['inputBranchName','TextField'],['btnSaveBranch','Button']],
    ops: [['handleSaveBranch',[['formData','FormData']],'void'],['handleDeleteBranch',[['id','uuid']],'void']]
  },
  { name: 'ActivityLogView', stereotype: 'Boundary', module: 5,
    attrs: [['logsTable','Table'],['branchSelector','Select'],['searchInput','TextField']],
    ops: [['handleFilter',[],'void']]
  },
  { name: 'BranchController', stereotype: 'Controller', module: 5,
    attrs: [['branchModel','Object']],
    ops: [['getBranches',[],'Object'],['saveBranch',[['id','uuid'],['formData','FormData']],'Object'],['deleteBranch',[['id','uuid']],'Object']]
  },
  { name: 'ActivityLogController', stereotype: 'Controller', module: 5,
    attrs: [['activityLogModel','Object'],['branchModel','Object']],
    ops: [['getActivityLogData',[['profile','Object'],['searchParams','URLSearchParams']],'Object']]
  },
  { name: 'BranchModel', stereotype: 'Entity', module: 5,
    attrs: [['branchesTable','String'],['id','uuid'],['name','String'],['address','String'],['phone','String'],['is_active','boolean'],['created_at','timestamptz']],
    ops: [['getBranches',[],'Array'],['insertBranch',[['branchData','Object']],'Object'],['updateBranch',[['id','uuid'],['branchData','Object']],'Object'],['deleteBranch',[['id','uuid']],'boolean']]
  },
  { name: 'ActivityLogModel', stereotype: 'Entity', module: 5,
    attrs: [['activityLogsTable','String'],['id','uuid'],['user_id','uuid'],['branch_id','uuid'],['action','String'],['entity_type','String'],['entity_id','uuid'],['metadata','jsonb'],['created_at','timestamptz']],
    ops: [['getActivityLogs',[['filter','Object']],'Object'],['logActivity',[['logData','Object']],'Object']]
  },
  // MODULE 6: Laporan, Statistik, & Pengaturan
  { name: 'DashboardView', stereotype: 'Boundary', module: 6,
    attrs: [['kpiCards','Card[]'],['revenueChart','Chart'],['branchChart','Chart'],['recentTrxTable','Table'],['monthSelector','Select']],
    ops: [['handleRefresh',[],'void']]
  },
  { name: 'SettingsView', stereotype: 'Boundary', module: 6,
    attrs: [['inputDefaultDuration','TextField'],['inputLateFee','TextField'],['inputTargetRevenue','TextField'],['btnSaveSettings','Button']],
    ops: [['handleSaveSettings',[['formData','FormData']],'void']]
  },
  { name: 'DashboardController', stereotype: 'Controller', module: 6,
    attrs: [['transactionModel','Object'],['itemModel','Object'],['settingsModel','Object'],['branchModel','Object']],
    ops: [['getDashboardData',[['profile','Object']],'Object']]
  },
  { name: 'SettingsController', stereotype: 'Controller', module: 6,
    attrs: [['settingsModel','Object']],
    ops: [['getRentalSettings',[],'Object'],['updateRentalSettings',[['profile','Object'],['formData','FormData']],'Object']]
  },
  { name: 'SettingsModel', stereotype: 'Entity', module: 6,
    attrs: [['settingsTable','String'],['key','String'],['value','jsonb'],['updated_at','timestamptz']],
    ops: [['getRentalSettings',[],'Object'],['upsertRentalSettings',[['value','Object']],'boolean']]
  },
];

const relationships = [
  ['POSView','POSController','dep'],['POSController','TransactionModel','ass'],['POSController','CustomerModel','ass'],
  ['ReturnsView','ReturnsController','dep'],['PenaltiesView','PenaltiesController','dep'],
  ['ReturnsController','PenaltyModel','ass'],['ReturnsController','TransactionModel','ass'],
  ['PenaltiesController','PenaltyModel','ass'],
  ['InventoryView','ItemController','dep'],['PackagesView','PackageController','dep'],
  ['ItemController','ItemModel','ass'],['ItemController','CategoryModel','ass'],
  ['PackageController','PackageModel','ass'],['PackageModel','ItemModel','ass'],
  ['AssetStatusView','AssetStatusController','dep'],['BookingView','BookingController','dep'],
  ['AssetStatusController','AssetModel','ass'],['BookingController','BookingModel','ass'],
  ['BookingController','AssetModel','ass'],['BookingModel','AssetModel','ass'],
  ['BranchManagementView','BranchController','dep'],['ActivityLogView','ActivityLogController','dep'],
  ['BranchController','BranchModel','ass'],['ActivityLogController','ActivityLogModel','ass'],
  ['ActivityLogModel','BranchModel','ass'],
  ['DashboardView','DashboardController','dep'],['SettingsView','SettingsController','dep'],
  ['DashboardController','TransactionModel','ass'],['DashboardController','SettingsModel','ass'],
  ['SettingsController','SettingsModel','ass'],
];

// ============================================================
// Build IDs
// ============================================================
const PROJECT_ID = uid('PRJ');
const MODEL_ID = uid('MDL');
const DIAGRAM_ID = uid('DGM');

const classIds = {};
const viewIds = {};
allClasses.forEach(cls => {
  classIds[cls.name] = uid('C');
  viewIds[cls.name] = uid('V');
});

// ============================================================
// Build UMLClass model elements (NO _parent - StarUML infers from ownedElements)
// ============================================================
function buildClassModel(cls) {
  const classId = classIds[cls.name];
  return {
    _type: 'UMLClass',
    _id: classId,
    _parent: { $ref: MODEL_ID },
    name: cls.name,
    stereotype: cls.stereotype,
    attributes: cls.attrs.map(([name, type]) => ({
      _type: 'UMLAttribute',
      _id: uid('a'),
      _parent: { $ref: classId },
      name, visibility: 'private', type
    })),
    operations: cls.ops.map(([name, params, ret]) => {
      const opId = uid('o');
      return {
        _type: 'UMLOperation',
        _id: opId,
        _parent: { $ref: classId },
        name, visibility: 'public',
        parameters: [
          ...params.map(([pn, pt]) => ({
            _type: 'UMLParameter', _id: uid('p'), _parent: { $ref: opId },
            name: pn, type: pt
          })),
          { _type: 'UMLParameter', _id: uid('p'), _parent: { $ref: opId },
            name: '', type: ret, direction: 'return' }
        ]
      };
    })
  };
}

// ============================================================
// Build UMLClassView - WITH compartment subViews for interactivity
// No LabelView inside NameCompartment (StarUML auto-generates those)
// ============================================================
function buildClassView(cls, x, y) {
  const classId = classIds[cls.name];
  const vId = viewIds[cls.name];
  const ncId = uid('nc');
  const acId = uid('ac');
  const ocId = uid('oc');

  // Calculate approximate height
  const nameH = 36;
  const attrH = Math.max(16, cls.attrs.length * 14 + 4);
  const opH = Math.max(16, cls.ops.length * 14 + 4);
  const totalH = nameH + attrH + opH;
  const w = 340;

  const fillColor = cls.stereotype === 'Boundary' ? '#DAEEF7' :
                    cls.stereotype === 'Controller' ? '#D5F5E3' : '#FEF5E7';

  return {
    view: {
      _type: 'UMLClassView',
      _id: vId,
      _parent: { $ref: DIAGRAM_ID },
      model: { $ref: classId },
      visible: true,
      enabled: true,
      selectable: true,
      movable: 1,
      sizable: 1,
      containable: false,
      lineColor: '#000000',
      fillColor: fillColor,
      fontColor: '#000000',
      font: 'Arial;13;0',
      showVisibility: true,
      showNamespace: false,
      showProperty: true,
      showType: true,
      showMultiplicity: true,
      showOperationSignature: true,
      suppressAttributes: false,
      suppressOperations: false,
      showStereotype: true,
      left: x,
      top: y,
      width: w,
      height: totalH,
      autoResize: false,
      subViews: [
        {
          _type: 'UMLNameCompartmentView',
          _id: ncId,
          _parent: { $ref: vId },
          model: { $ref: classId },
          visible: true,
          enabled: true,
          selectable: true,
          movable: 0,
          sizable: 0,
          left: x,
          top: y,
          width: w,
          height: nameH,
          fillColor: fillColor
        },
        {
          _type: 'UMLAttributeCompartmentView',
          _id: acId,
          _parent: { $ref: vId },
          model: { $ref: classId },
          visible: true,
          enabled: true,
          selectable: true,
          movable: 0,
          sizable: 0,
          left: x,
          top: y + nameH,
          width: w,
          height: attrH,
          fillColor: fillColor
        },
        {
          _type: 'UMLOperationCompartmentView',
          _id: ocId,
          _parent: { $ref: vId },
          model: { $ref: classId },
          visible: true,
          enabled: true,
          selectable: true,
          movable: 0,
          sizable: 0,
          left: x,
          top: y + nameH + attrH,
          width: w,
          height: opH,
          fillColor: fillColor
        }
      ]
    },
    height: totalH
  };
}

// ============================================================
// Build relationships
// ============================================================
function buildRel(srcName, tgtName, type) {
  const srcClassId = classIds[srcName];
  const tgtClassId = classIds[tgtName];
  const srcViewId = viewIds[srcName];
  const tgtViewId = viewIds[tgtName];
  if (!srcClassId || !tgtClassId) return null;

  if (type === 'dep') {
    const relId = uid('d');
    const relViewId = uid('dv');
    return {
      model: {
        _type: 'UMLDependency',
        _id: relId,
        _parent: { $ref: srcClassId },
        source: { $ref: srcClassId },
        target: { $ref: tgtClassId }
      },
      view: {
        _type: 'UMLDependencyView',
        _id: relViewId,
        _parent: { $ref: DIAGRAM_ID },
        model: { $ref: relId },
        visible: true,
        enabled: true,
        lineColor: '#000000',
        lineStyle: 0,
        head: { $ref: tgtViewId },
        tail: { $ref: srcViewId }
      }
    };
  } else {
    const relId = uid('r');
    const relViewId = uid('rv');
    const e1Id = uid('e1');
    const e2Id = uid('e2');
    return {
      model: {
        _type: 'UMLAssociation',
        _id: relId,
        _parent: { $ref: srcClassId },
        end1: {
          _type: 'UMLAssociationEnd', _id: e1Id,
          _parent: { $ref: relId },
          reference: { $ref: srcClassId }, navigable: false
        },
        end2: {
          _type: 'UMLAssociationEnd', _id: e2Id,
          _parent: { $ref: relId },
          reference: { $ref: tgtClassId }, navigable: true
        }
      },
      view: {
        _type: 'UMLAssociationView',
        _id: relViewId,
        _parent: { $ref: DIAGRAM_ID },
        model: { $ref: relId },
        visible: true,
        enabled: true,
        lineColor: '#000000',
        lineStyle: 0,
        head: { $ref: tgtViewId },
        tail: { $ref: srcViewId }
      }
    };
  }
}

// ============================================================
// MAIN
// ============================================================
const classModelsList = [];
const classViewsList = [];
const relModelsList = [];
const relViewsList = [];

// Layout
const COL_W = 380;
const MOD_GAP = 60;
const ROW_GAP = 30;
let currentY = 40;

for (let mod = 1; mod <= 6; mod++) {
  const modCls = allClasses.filter(c => c.module === mod);
  const bounds = modCls.filter(c => c.stereotype === 'Boundary');
  const ctrls = modCls.filter(c => c.stereotype === 'Controller');
  const ents = modCls.filter(c => c.stereotype === 'Entity');
  const cols = [bounds, ctrls, ents];

  let maxH = 0;
  cols.forEach((col, ci) => {
    let y = currentY;
    col.forEach(cls => {
      const x = 40 + ci * COL_W;
      classModelsList.push(buildClassModel(cls));
      const r = buildClassView(cls, x, y);
      classViewsList.push(r.view);
      y += r.height + ROW_GAP;
    });
    if (y - currentY > maxH) maxH = y - currentY;
  });
  currentY += maxH + MOD_GAP;
}

// Relationships
relationships.forEach(([s, t, type]) => {
  const r = buildRel(s, t, type);
  if (r) {
    relModelsList.push(r.model);
    relViewsList.push(r.view);
  }
});

// Store relationship models as ownedElements of their source class
// StarUML expects relationships inside ownedElements of the source class
classModelsList.forEach(cls => {
  const rels = relModelsList.filter(r => r._parent && r._parent['$ref'] === cls._id);
  if (rels.length > 0) {
    cls.ownedElements = rels;
  }
});

// Only keep relationship models that aren't embedded in classes
const embeddedRelIds = new Set();
classModelsList.forEach(cls => {
  if (cls.ownedElements) {
    cls.ownedElements.forEach(r => embeddedRelIds.add(r._id));
  }
});

// Final MDJ
const mdj = {
  _type: 'Project',
  _id: PROJECT_ID,
  name: 'BotaniRent Class Diagram',
  ownedElements: [
    {
      _type: 'UMLModel',
      _id: MODEL_ID,
      _parent: { $ref: PROJECT_ID },
      name: 'BotaniRent',
      ownedElements: [
        {
          _type: 'UMLClassDiagram',
          _id: DIAGRAM_ID,
          _parent: { $ref: MODEL_ID },
          name: 'BotaniRent BCE Class Diagram',
          visible: true,
          defaultDiagram: true,
          ownedViews: [...classViewsList, ...relViewsList]
        },
        ...classModelsList
      ]
    }
  ]
};

const out = process.argv[2] || 'botanirent_class_diagram.mdj';
fs.writeFileSync(out, JSON.stringify(mdj, null, 2), 'utf-8');
fs.writeFileSync(out.replace('.mdj', '.mfj'), JSON.stringify(mdj, null, 2), 'utf-8');
console.log(`Done! ${out} and ${out.replace('.mdj','.mfj')}`);
console.log(`Classes: ${allClasses.length}, Rels: ${relationships.length}`);
