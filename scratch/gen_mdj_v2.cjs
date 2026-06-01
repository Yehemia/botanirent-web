const fs = require('fs');

// ============================================================
// StarUML MDJ Generator v2 - with _parent references
// ============================================================

let idSeq = 0;
function uid(prefix) {
  idSeq++;
  return `${prefix}_${String(idSeq).padStart(5, '0')}`;
}

// ============================================================
// DATA DEFINITIONS (all 33 classes from 6 modules)
// ============================================================
const allClasses = [
  // ====== MODULE 1: POS & Transaksi ======
  {
    name: 'POSView', stereotype: 'Boundary', module: 1,
    attrs: [
      ['searchBar', 'SearchBar'], ['catalogGrid', 'Grid'], ['btnAddToCart', 'Button'],
      ['cartTable', 'Table'], ['btnCheckout', 'Button'], ['customerSelector', 'Select'],
      ['rentalDateModal', 'Modal'], ['paymentModal', 'Modal']
    ],
    ops: [
      ['handleAddToCart', [['item', 'Object']], 'void'],
      ['handleRemoveFromCart', [['itemId', 'uuid']], 'void'],
      ['handleCheckout', [['formData', 'FormData']], 'void']
    ]
  },
  {
    name: 'POSController', stereotype: 'Controller', module: 1,
    attrs: [
      ['categoryModel', 'Object'], ['itemModel', 'Object'], ['packageModel', 'Object'],
      ['customerModel', 'Object'], ['settingsModel', 'Object'], ['transactionModel', 'Object'],
      ['activityLogModel', 'Object']
    ],
    ops: [
      ['getPOSData', [['profile', 'Object']], 'Object'],
      ['getCheckoutData', [['profile', 'Object']], 'Object'],
      ['checkout', [['profile', 'Object'], ['formData', 'FormData'], ['config', 'Object']], 'Object']
    ]
  },
  {
    name: 'TransactionModel', stereotype: 'Entity', module: 1,
    attrs: [
      ['transactionsTable', 'String'], ['transactionItemsTable', 'String'],
      ['id', 'uuid'], ['branch_id', 'uuid'], ['cashier_id', 'uuid'], ['customer_id', 'uuid'],
      ['transaction_code', 'String'], ['type', 'String'], ['subtotal', 'numeric'],
      ['discount_amount', 'numeric'], ['discount_percent', 'numeric'],
      ['total_amount', 'numeric'], ['paid_amount', 'numeric'], ['change_amount', 'numeric'],
      ['payment_method', 'String'], ['payment_status', 'String'],
      ['midtrans_transaction_id', 'String'], ['midtrans_snap_token', 'String'],
      ['item_name', 'String'], ['quantity', 'int'], ['unit_price', 'numeric'],
      ['rental_start_date', 'date'], ['rental_end_date', 'date'], ['rental_days', 'int'],
      ['rental_status', 'String'], ['returned_at', 'timestamptz'],
      ['return_condition', 'String'], ['return_notes', 'String']
    ],
    ops: [
      ['checkoutTransaction', [['payload', 'Object']], 'Object'],
      ['getTransactionDetails', [['id', 'uuid']], 'Object'],
      ['getTransactionsHistory', [['branchId', 'uuid']], 'Array'],
      ['updateTransaction', [['id', 'uuid'], ['data', 'Object']], 'Object'],
      ['getActiveRentalsForReturns', [['branchId', 'uuid']], 'Array'],
      ['updateTransactionItem', [['id', 'uuid'], ['data', 'Object']], 'Object']
    ]
  },
  {
    name: 'CustomerModel', stereotype: 'Entity', module: 1,
    attrs: [
      ['customersTable', 'String'], ['id', 'uuid'], ['branch_id', 'uuid'],
      ['full_name', 'String'], ['phone', 'String'], ['email', 'String'],
      ['address', 'String'], ['notes', 'String'], ['created_at', 'timestamptz']
    ],
    ops: [
      ['getCustomers', [['branchId', 'uuid']], 'Array'],
      ['getCustomersMinimal', [['branchId', 'uuid']], 'Array'],
      ['createCustomer', [['customerData', 'Object']], 'Object'],
      ['getCustomerDetails', [['id', 'uuid']], 'Object']
    ]
  },

  // ====== MODULE 2: Pengembalian & Denda ======
  {
    name: 'ReturnsView', stereotype: 'Boundary', module: 2,
    attrs: [
      ['invoiceInput', 'TextField'], ['btnSearch', 'Button'], ['rentalsTable', 'Table'],
      ['btnReturnItems', 'Button'], ['returnModal', 'Modal'], ['btnConfirmReturn', 'Button']
    ],
    ops: [
      ['handleSearchTransaction', [['code', 'String']], 'void'],
      ['handleProcessReturn', [['payload', 'Object']], 'void']
    ]
  },
  {
    name: 'PenaltiesView', stereotype: 'Boundary', module: 2,
    attrs: [
      ['rulesTable', 'Table'], ['btnUpdateRule', 'Button'], ['ruleModal', 'Modal'],
      ['inputAmount', 'TextField'], ['btnSaveRule', 'Button']
    ],
    ops: [
      ['handleUpdateRule', [['ruleId', 'uuid'], ['amount', 'numeric']], 'void']
    ]
  },
  {
    name: 'ReturnsController', stereotype: 'Controller', module: 2,
    attrs: [
      ['transactionModel', 'Object'], ['penaltyModel', 'Object'], ['settingsModel', 'Object'],
      ['bookingModel', 'Object'], ['assetModel', 'Object'], ['activityLogModel', 'Object']
    ],
    ops: [
      ['getReturnsPageData', [['profile', 'Object']], 'Object'],
      ['processReturn', [['profile', 'Object'], ['formData', 'FormData']], 'Object']
    ]
  },
  {
    name: 'PenaltiesController', stereotype: 'Controller', module: 2,
    attrs: [['penaltyModel', 'Object'], ['activityLogModel', 'Object']],
    ops: [
      ['getPenaltyRules', [['profile', 'Object']], 'Object'],
      ['updatePenaltyRule', [['profile', 'Object'], ['formData', 'FormData']], 'Object']
    ]
  },
  {
    name: 'PenaltyModel', stereotype: 'Entity', module: 2,
    attrs: [
      ['penaltiesTable', 'String'], ['penaltyRulesTable', 'String'],
      ['id', 'uuid'], ['transaction_item_id', 'uuid'], ['penalty_rule_id', 'uuid'],
      ['branch_id', 'uuid'], ['type', 'String'], ['late_days', 'int'],
      ['calculated_amount', 'numeric'], ['payment_status', 'String'], ['notes', 'String'],
      ['paid_at', 'timestamptz'], ['rule_name', 'String'],
      ['rule_calculation_method', 'String'], ['rule_amount', 'numeric']
    ],
    ops: [
      ['getPenaltyRules', [], 'Array'],
      ['getPenalties', [['branchId', 'uuid']], 'Array'],
      ['insertPenalty', [['penaltyData', 'Object']], 'Object'],
      ['updatePenaltyRule', [['id', 'uuid'], ['amount', 'numeric']], 'Object']
    ]
  },

  // ====== MODULE 3: Inventaris & Paket ======
  {
    name: 'InventoryView', stereotype: 'Boundary', module: 3,
    attrs: [
      ['itemsTable', 'Table'], ['btnAddNewItem', 'Button'], ['itemModal', 'Modal'],
      ['inputItemName', 'TextField'], ['inputBarcode', 'TextField'], ['btnSaveItem', 'Button']
    ],
    ops: [
      ['handleSaveItem', [['formData', 'FormData']], 'void'],
      ['handleDeleteItem', [['id', 'uuid']], 'void']
    ]
  },
  {
    name: 'PackagesView', stereotype: 'Boundary', module: 3,
    attrs: [
      ['packagesTable', 'Table'], ['btnCreatePackage', 'Button'], ['packageModal', 'Modal'],
      ['inputPackageName', 'TextField'], ['btnSavePackage', 'Button']
    ],
    ops: [
      ['handleSavePackage', [['formData', 'FormData']], 'void'],
      ['handleDeletePackage', [['id', 'uuid']], 'void']
    ]
  },
  {
    name: 'ItemController', stereotype: 'Controller', module: 3,
    attrs: [['itemModel', 'Object'], ['categoryModel', 'Object'], ['activityLogModel', 'Object']],
    ops: [
      ['getItems', [['profile', 'Object']], 'Object'],
      ['getItemDetails', [['id', 'uuid']], 'Object'],
      ['saveItem', [['profile', 'Object'], ['formData', 'FormData']], 'Object'],
      ['deleteItem', [['id', 'uuid']], 'Object']
    ]
  },
  {
    name: 'PackageController', stereotype: 'Controller', module: 3,
    attrs: [['packageModel', 'Object'], ['itemModel', 'Object'], ['activityLogModel', 'Object']],
    ops: [
      ['getPackages', [['profile', 'Object']], 'Object'],
      ['savePackage', [['profile', 'Object'], ['formData', 'FormData']], 'Object'],
      ['deletePackage', [['id', 'uuid']], 'Object']
    ]
  },
  {
    name: 'ItemModel', stereotype: 'Entity', module: 3,
    attrs: [
      ['itemsTable', 'String'], ['id', 'uuid'], ['branch_id', 'uuid'], ['category_id', 'uuid'],
      ['name', 'String'], ['description', 'String'], ['barcode', 'String'],
      ['rental_price_per_day', 'numeric'], ['sell_price', 'numeric'],
      ['stock_total', 'int'], ['stock_available', 'int'], ['is_active', 'boolean'],
      ['category_name', 'String'], ['category_type', 'String']
    ],
    ops: [
      ['getItems', [['branchId', 'uuid']], 'Array'],
      ['getActiveSewaItems', [['branchId', 'uuid']], 'Array'],
      ['getActiveItems', [['branchId', 'uuid']], 'Array'],
      ['getItemDetails', [['id', 'uuid']], 'Object'],
      ['insertItem', [['itemData', 'Object']], 'Object'],
      ['updateItem', [['id', 'uuid'], ['itemData', 'Object']], 'Object'],
      ['deleteItem', [['id', 'uuid']], 'boolean'],
      ['bulkInsertItems', [['itemsList', 'Array']], 'boolean']
    ]
  },
  {
    name: 'CategoryModel', stereotype: 'Entity', module: 3,
    attrs: [
      ['categoriesTable', 'String'], ['id', 'uuid'], ['name', 'String'],
      ['type', 'String'], ['is_active', 'boolean']
    ],
    ops: [
      ['getCategories', [['branchId', 'uuid']], 'Array'],
      ['insertCategory', [['categoryData', 'Object']], 'Object'],
      ['updateCategory', [['id', 'uuid'], ['categoryData', 'Object']], 'Object'],
      ['deleteCategory', [['id', 'uuid']], 'boolean']
    ]
  },
  {
    name: 'PackageModel', stereotype: 'Entity', module: 3,
    attrs: [
      ['packagesTable', 'String'], ['packageItemsTable', 'String'],
      ['id', 'uuid'], ['branch_id', 'uuid'], ['name', 'String'], ['description', 'String'],
      ['image_url', 'String'], ['package_price', 'numeric'], ['is_active', 'boolean'],
      ['item_quantity', 'int']
    ],
    ops: [
      ['getPackages', [['branchId', 'uuid']], 'Array'],
      ['getActivePackages', [['branchId', 'uuid']], 'Array'],
      ['getPackageDetails', [['id', 'uuid']], 'Object'],
      ['createPackage', [['data', 'Object'], ['items', 'Array']], 'Object'],
      ['updatePackage', [['id', 'uuid'], ['data', 'Object'], ['items', 'Array']], 'Object'],
      ['deletePackage', [['id', 'uuid']], 'boolean']
    ]
  },

  // ====== MODULE 4: Aset Fisik & Booking ======
  {
    name: 'AssetStatusView', stereotype: 'Boundary', module: 4,
    attrs: [
      ['searchInput', 'TextField'], ['kanbanGrid', 'Grid'],
      ['btnUpdateStatus', 'Button'], ['statusBadge', 'Label']
    ],
    ops: [
      ['handleUpdateStatus', [['assetId', 'uuid'], ['status', 'String']], 'void'],
      ['getAssetsByStatus', [['status', 'String']], 'Array']
    ]
  },
  {
    name: 'BookingView', stereotype: 'Boundary', module: 4,
    attrs: [
      ['calendar', 'Calendar'], ['btnBlockMaintenance', 'Button'],
      ['maintenanceModal', 'Modal'], ['dateRangePicker', 'DateRangePicker'],
      ['btnSaveBlock', 'Button']
    ],
    ops: [
      ['handleCreateBlock', [['formData', 'FormData']], 'void'],
      ['handleCancelBlock', [['id', 'uuid']], 'void']
    ]
  },
  {
    name: 'AssetStatusController', stereotype: 'Controller', module: 4,
    attrs: [['assetModel', 'Object']],
    ops: [
      ['getAssets', [['profile', 'Object']], 'Object'],
      ['updateStatus', [['profile', 'Object'], ['formData', 'FormData']], 'Object']
    ]
  },
  {
    name: 'BookingController', stereotype: 'Controller', module: 4,
    attrs: [
      ['bookingModel', 'Object'], ['categoryModel', 'Object'], ['itemModel', 'Object'],
      ['assetModel', 'Object'], ['branchModel', 'Object'], ['activityLogModel', 'Object']
    ],
    ops: [
      ['getBookingPageData', [['profile', 'Object'], ['searchBranchId', 'uuid']], 'Object'],
      ['createMaintenance', [['profile', 'Object'], ['formData', 'FormData']], 'Object'],
      ['deleteBooking', [['profile', 'Object'], ['formData', 'FormData']], 'Object']
    ]
  },
  {
    name: 'AssetModel', stereotype: 'Entity', module: 4,
    attrs: [
      ['rentalAssetsTable', 'String'], ['id', 'uuid'], ['item_id', 'uuid'],
      ['asset_code', 'String'], ['status', 'String'], ['notes', 'String'],
      ['last_status_change', 'timestamptz']
    ],
    ops: [
      ['getAssetsStatusCounts', [['branchId', 'uuid']], 'Object'],
      ['getAssets', [['params', 'Object']], 'Array'],
      ['updateAssetStatus', [['id', 'uuid'], ['status', 'String'], ['notes', 'String']], 'Object'],
      ['deleteMaintenanceBookingForAsset', [['assetId', 'uuid']], 'boolean'],
      ['getReadyAssetsForItem', [['itemId', 'uuid']], 'Array'],
      ['insertAssets', [['assetsList', 'Array']], 'boolean']
    ]
  },
  {
    name: 'BookingModel', stereotype: 'Entity', module: 4,
    attrs: [
      ['bookingsTable', 'String'], ['id', 'uuid'], ['rental_asset_id', 'uuid'],
      ['transaction_item_id', 'uuid'], ['branch_id', 'uuid'],
      ['start_date', 'date'], ['end_date', 'date'], ['status', 'String']
    ],
    ops: [
      ['getBranchBookings', [['branchId', 'uuid']], 'Array'],
      ['createBooking', [['bookingData', 'Object']], 'Object'],
      ['getBookingDetails', [['id', 'uuid']], 'Object'],
      ['deleteBooking', [['id', 'uuid']], 'boolean'],
      ['updateBookingStatusByTransactionItem', [['transactionItemId', 'uuid'], ['status', 'String']], 'boolean']
    ]
  },

  // ====== MODULE 5: Pengguna, Cabang, & Audit Trail ======
  {
    name: 'BranchManagementView', stereotype: 'Boundary', module: 5,
    attrs: [
      ['branchesTable', 'Table'], ['btnCreateBranch', 'Button'], ['branchModal', 'Modal'],
      ['inputBranchName', 'TextField'], ['btnSaveBranch', 'Button']
    ],
    ops: [
      ['handleSaveBranch', [['formData', 'FormData']], 'void'],
      ['handleDeleteBranch', [['id', 'uuid']], 'void']
    ]
  },
  {
    name: 'ActivityLogView', stereotype: 'Boundary', module: 5,
    attrs: [['logsTable', 'Table'], ['branchSelector', 'Select'], ['searchInput', 'TextField']],
    ops: [['handleFilter', [], 'void']]
  },
  {
    name: 'BranchController', stereotype: 'Controller', module: 5,
    attrs: [['branchModel', 'Object']],
    ops: [
      ['getBranches', [], 'Object'],
      ['saveBranch', [['id', 'uuid'], ['formData', 'FormData']], 'Object'],
      ['deleteBranch', [['id', 'uuid']], 'Object']
    ]
  },
  {
    name: 'ActivityLogController', stereotype: 'Controller', module: 5,
    attrs: [['activityLogModel', 'Object'], ['branchModel', 'Object']],
    ops: [['getActivityLogData', [['profile', 'Object'], ['searchParams', 'URLSearchParams']], 'Object']]
  },
  {
    name: 'BranchModel', stereotype: 'Entity', module: 5,
    attrs: [
      ['branchesTable', 'String'], ['id', 'uuid'], ['name', 'String'],
      ['address', 'String'], ['phone', 'String'], ['is_active', 'boolean'],
      ['created_at', 'timestamptz']
    ],
    ops: [
      ['getBranches', [], 'Array'],
      ['insertBranch', [['branchData', 'Object']], 'Object'],
      ['updateBranch', [['id', 'uuid'], ['branchData', 'Object']], 'Object'],
      ['deleteBranch', [['id', 'uuid']], 'boolean']
    ]
  },
  {
    name: 'ActivityLogModel', stereotype: 'Entity', module: 5,
    attrs: [
      ['activityLogsTable', 'String'], ['id', 'uuid'], ['user_id', 'uuid'],
      ['branch_id', 'uuid'], ['action', 'String'], ['entity_type', 'String'],
      ['entity_id', 'uuid'], ['metadata', 'jsonb'], ['created_at', 'timestamptz']
    ],
    ops: [
      ['getActivityLogs', [['filter', 'Object']], 'Object'],
      ['logActivity', [['logData', 'Object']], 'Object']
    ]
  },

  // ====== MODULE 6: Laporan, Statistik, & Pengaturan ======
  {
    name: 'DashboardView', stereotype: 'Boundary', module: 6,
    attrs: [
      ['kpiCards', 'Card[]'], ['revenueChart', 'Chart'], ['branchChart', 'Chart'],
      ['recentTrxTable', 'Table'], ['monthSelector', 'Select']
    ],
    ops: [['handleRefresh', [], 'void']]
  },
  {
    name: 'SettingsView', stereotype: 'Boundary', module: 6,
    attrs: [
      ['inputDefaultDuration', 'TextField'], ['inputLateFee', 'TextField'],
      ['inputTargetRevenue', 'TextField'], ['btnSaveSettings', 'Button']
    ],
    ops: [['handleSaveSettings', [['formData', 'FormData']], 'void']]
  },
  {
    name: 'DashboardController', stereotype: 'Controller', module: 6,
    attrs: [
      ['transactionModel', 'Object'], ['itemModel', 'Object'],
      ['settingsModel', 'Object'], ['branchModel', 'Object']
    ],
    ops: [['getDashboardData', [['profile', 'Object']], 'Object']]
  },
  {
    name: 'SettingsController', stereotype: 'Controller', module: 6,
    attrs: [['settingsModel', 'Object']],
    ops: [
      ['getRentalSettings', [], 'Object'],
      ['updateRentalSettings', [['profile', 'Object'], ['formData', 'FormData']], 'Object']
    ]
  },
  {
    name: 'SettingsModel', stereotype: 'Entity', module: 6,
    attrs: [
      ['settingsTable', 'String'], ['key', 'String'], ['value', 'jsonb'],
      ['updated_at', 'timestamptz']
    ],
    ops: [
      ['getRentalSettings', [], 'Object'],
      ['upsertRentalSettings', [['value', 'Object']], 'boolean']
    ]
  },
];

// Relationships
const relationships = [
  // Module 1
  ['POSView', 'POSController', 'dependency'],
  ['POSController', 'TransactionModel', 'association'],
  ['POSController', 'CustomerModel', 'association'],
  ['POSController', 'ItemModel', 'association'],
  ['POSController', 'PackageModel', 'association'],
  ['POSController', 'CategoryModel', 'association'],
  ['POSController', 'SettingsModel', 'association'],
  ['POSController', 'ActivityLogModel', 'association'],
  ['TransactionModel', 'CustomerModel', 'association'],
  // Module 2
  ['ReturnsView', 'ReturnsController', 'dependency'],
  ['PenaltiesView', 'PenaltiesController', 'dependency'],
  ['ReturnsController', 'PenaltyModel', 'association'],
  ['ReturnsController', 'TransactionModel', 'association'],
  ['ReturnsController', 'BookingModel', 'association'],
  ['ReturnsController', 'AssetModel', 'association'],
  ['ReturnsController', 'SettingsModel', 'association'],
  ['ReturnsController', 'ActivityLogModel', 'association'],
  ['PenaltiesController', 'PenaltyModel', 'association'],
  ['PenaltiesController', 'ActivityLogModel', 'association'],
  // Module 3
  ['InventoryView', 'ItemController', 'dependency'],
  ['PackagesView', 'PackageController', 'dependency'],
  ['ItemController', 'ItemModel', 'association'],
  ['ItemController', 'CategoryModel', 'association'],
  ['ItemController', 'ActivityLogModel', 'association'],
  ['PackageController', 'PackageModel', 'association'],
  ['PackageController', 'ItemModel', 'association'],
  ['PackageController', 'ActivityLogModel', 'association'],
  ['PackageModel', 'ItemModel', 'association'],
  // Module 4
  ['AssetStatusView', 'AssetStatusController', 'dependency'],
  ['BookingView', 'BookingController', 'dependency'],
  ['AssetStatusController', 'AssetModel', 'association'],
  ['BookingController', 'BookingModel', 'association'],
  ['BookingController', 'AssetModel', 'association'],
  ['BookingController', 'CategoryModel', 'association'],
  ['BookingController', 'ItemModel', 'association'],
  ['BookingController', 'BranchModel', 'association'],
  ['BookingController', 'ActivityLogModel', 'association'],
  ['BookingModel', 'AssetModel', 'association'],
  // Module 5
  ['BranchManagementView', 'BranchController', 'dependency'],
  ['ActivityLogView', 'ActivityLogController', 'dependency'],
  ['BranchController', 'BranchModel', 'association'],
  ['ActivityLogController', 'ActivityLogModel', 'association'],
  ['ActivityLogController', 'BranchModel', 'association'],
  ['ActivityLogModel', 'BranchModel', 'association'],
  // Module 6
  ['DashboardView', 'DashboardController', 'dependency'],
  ['SettingsView', 'SettingsController', 'dependency'],
  ['DashboardController', 'TransactionModel', 'association'],
  ['DashboardController', 'ItemModel', 'association'],
  ['DashboardController', 'SettingsModel', 'association'],
  ['DashboardController', 'BranchModel', 'association'],
  ['SettingsController', 'SettingsModel', 'association'],
];

// ============================================================
// Build IDs
// ============================================================
const PROJECT_ID = 'AAAAAFY0kBEUcEo4Y';
const MODEL_ID = 'AAAAAAFYoXMy1UPa';
const DIAGRAM_ID = 'AAAAAAFYoXMy1UPb';

const classIds = {};
allClasses.forEach(cls => {
  classIds[cls.name] = uid('AAAAAF' + cls.name.substring(0,4));
});

// ============================================================
// Build model elements (UMLClass with _parent)
// ============================================================
function buildClassModel(cls) {
  const classId = classIds[cls.name];

  const attributes = cls.attrs.map(([name, type]) => {
    return {
      _type: 'UMLAttribute',
      _id: uid('ATR'),
      _parent: { $ref: classId },
      name: name,
      visibility: 'private',
      type: type
    };
  });

  const operations = cls.ops.map(([name, params, ret]) => {
    const parameters = params.map(([pName, pType]) => {
      const pId = uid('PRM');
      return {
        _type: 'UMLParameter',
        _id: pId,
        _parent: { $ref: uid('OP_PLACEHOLDER') }, // will be fixed
        name: pName,
        type: pType
      };
    });
    // return param
    parameters.push({
      _type: 'UMLParameter',
      _id: uid('PRM'),
      _parent: { $ref: uid('OP_PLACEHOLDER') },
      name: '',
      type: ret,
      direction: 'return'
    });

    const opId = uid('OPR');
    // fix parent refs
    parameters.forEach(p => { p._parent = { $ref: opId }; });

    return {
      _type: 'UMLOperation',
      _id: opId,
      _parent: { $ref: classId },
      name: name,
      visibility: 'public',
      parameters: parameters
    };
  });

  return {
    _type: 'UMLClass',
    _id: classId,
    _parent: { $ref: MODEL_ID },
    name: cls.name,
    stereotype: cls.stereotype,
    attributes: attributes,
    operations: operations
  };
}

// ============================================================
// Build view elements (UMLClassView) - StarUML proper format
// ============================================================
function buildClassView(cls, x, y, diagId) {
  const classId = classIds[cls.name];
  const viewId = uid('VW');
  const nameCompId = uid('NC');
  const attrCompId = uid('AC');
  const opCompId = uid('OC');
  const stereotypeLabelId = uid('SL');
  const nameLabelId = uid('NL');

  const attrCount = cls.attrs.length;
  const opCount = cls.ops.length;
  const nameH = 40;
  const attrH = Math.max(20, attrCount * 15 + 8);
  const opH = Math.max(20, opCount * 15 + 8);
  const totalH = nameH + attrH + opH;
  const w = 350;

  return {
    view: {
      _type: 'UMLClassView',
      _id: viewId,
      _parent: { $ref: diagId },
      model: { $ref: classId },
      subViews: [
        {
          _type: 'UMLNameCompartmentView',
          _id: nameCompId,
          _parent: { $ref: viewId },
          model: { $ref: classId },
          subViews: [
            {
              _type: 'LabelView',
              _id: stereotypeLabelId,
              _parent: { $ref: nameCompId },
              font: 'Arial;13;0',
              left: x + 5,
              top: y + 5,
              width: w - 10,
              height: 13,
              text: '\u00AB' + cls.stereotype + '\u00BB'
            },
            {
              _type: 'LabelView',
              _id: nameLabelId,
              _parent: { $ref: nameCompId },
              font: 'Arial;13;1',
              left: x + 5,
              top: y + 20,
              width: w - 10,
              height: 13,
              text: cls.name
            }
          ],
          left: x,
          top: y,
          width: w,
          height: nameH
        },
        {
          _type: 'UMLAttributeCompartmentView',
          _id: attrCompId,
          _parent: { $ref: viewId },
          model: { $ref: classId },
          left: x,
          top: y + nameH,
          width: w,
          height: attrH
        },
        {
          _type: 'UMLOperationCompartmentView',
          _id: opCompId,
          _parent: { $ref: viewId },
          model: { $ref: classId },
          left: x,
          top: y + nameH + attrH,
          width: w,
          height: opH
        }
      ],
      left: x,
      top: y,
      width: w,
      height: totalH
    },
    height: totalH
  };
}

// ============================================================
// Build relationship model + view elements
// ============================================================
function buildRelationship(srcName, tgtName, type, modelId, diagId) {
  const srcId = classIds[srcName];
  const tgtId = classIds[tgtName];
  if (!srcId || !tgtId) return null;

  if (type === 'dependency') {
    const depId = uid('DEP');
    const depViewId = uid('DPV');
    return {
      model: {
        _type: 'UMLDependency',
        _id: depId,
        _parent: { $ref: srcId },
        source: { $ref: srcId },
        target: { $ref: tgtId },
        name: 'uses'
      },
      view: {
        _type: 'UMLDependencyView',
        _id: depViewId,
        _parent: { $ref: diagId },
        model: { $ref: depId },
        subViews: [
          {
            _type: 'EdgeLabelView',
            _id: uid('ELV'),
            _parent: { $ref: depViewId },
            model: { $ref: depId },
            visible: false
          }
        ],
        lineStyle: 1,
        head: { $ref: srcId },
        tail: { $ref: tgtId }
      }
    };
  } else {
    const assocId = uid('ASC');
    const assocViewId = uid('ASV');
    const end1Id = uid('AE1');
    const end2Id = uid('AE2');
    return {
      model: {
        _type: 'UMLAssociation',
        _id: assocId,
        _parent: { $ref: srcId },
        name: 'delegates',
        end1: {
          _type: 'UMLAssociationEnd',
          _id: end1Id,
          _parent: { $ref: assocId },
          reference: { $ref: srcId },
          navigable: false
        },
        end2: {
          _type: 'UMLAssociationEnd',
          _id: end2Id,
          _parent: { $ref: assocId },
          reference: { $ref: tgtId },
          navigable: true
        }
      },
      view: {
        _type: 'UMLAssociationView',
        _id: assocViewId,
        _parent: { $ref: diagId },
        model: { $ref: assocId },
        subViews: [
          {
            _type: 'EdgeLabelView',
            _id: uid('ELV'),
            _parent: { $ref: assocViewId },
            model: { $ref: assocId },
            visible: false
          }
        ],
        lineStyle: 1,
        head: { $ref: srcId },
        tail: { $ref: tgtId }
      }
    };
  }
}

// ============================================================
// MAIN GENERATION
// ============================================================
const classModels = [];
const classViews = [];
const relModels = [];
const relViews = [];

// Layout constants
const COL_W = 400;
const MOD_GAP = 80;
const ROW_GAP = 40;

let currentY = 50;

for (let mod = 1; mod <= 6; mod++) {
  const modClasses = allClasses.filter(c => c.module === mod);
  const boundaries = modClasses.filter(c => c.stereotype === 'Boundary');
  const controllers = modClasses.filter(c => c.stereotype === 'Controller');
  const entities = modClasses.filter(c => c.stereotype === 'Entity');
  const columns = [boundaries, controllers, entities];

  let maxColH = 0;

  columns.forEach((col, colIdx) => {
    let y = currentY;
    col.forEach(cls => {
      const x = 50 + colIdx * COL_W;
      classModels.push(buildClassModel(cls));
      const result = buildClassView(cls, x, y, DIAGRAM_ID);
      classViews.push(result.view);
      y += result.height + ROW_GAP;
    });
    const colH = y - currentY;
    if (colH > maxColH) maxColH = colH;
  });

  currentY += maxColH + MOD_GAP;
}

// Build relationships
relationships.forEach(([src, tgt, type]) => {
  const rel = buildRelationship(src, tgt, type, MODEL_ID, DIAGRAM_ID);
  if (rel) {
    relModels.push(rel.model);
    relViews.push(rel.view);
  }
});

// ============================================================
// Compose final MDJ / MFJ
// ============================================================
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
          ownedViews: [...classViews, ...relViews]
        },
        ...classModels,
        ...relModels
      ]
    }
  ]
};

// Write both .mdj and .mfj
const outputMdj = process.argv[2] || 'botanirent_class_diagram.mdj';
const outputMfj = outputMdj.replace('.mdj', '.mfj');

const jsonStr = JSON.stringify(mdj, null, 2);
fs.writeFileSync(outputMdj, jsonStr, 'utf-8');
fs.writeFileSync(outputMfj, jsonStr, 'utf-8');

console.log('✅ Files generated successfully!');
console.log(`   MDJ: ${outputMdj}`);
console.log(`   MFJ: ${outputMfj}`);
console.log(`   Total classes: ${allClasses.length}`);
console.log(`   Total relationships: ${relationships.length}`);
console.log(`   Total attributes: ${allClasses.reduce((s, c) => s + c.attrs.length, 0)}`);
console.log(`   Total operations: ${allClasses.reduce((s, c) => s + c.ops.length, 0)}`);
