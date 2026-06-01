const fs = require('fs');

// Helper to generate unique IDs
let idCounter = 0;
function uid(prefix) {
  idCounter++;
  return `${prefix}_${idCounter.toString(36).padStart(4, '0')}`;
}

// Define all classes organized by module
const allClasses = [
  // ====== MODULE 1: POS & Transaksi ======
  {
    name: 'POSView', stereotype: 'Boundary', module: 1,
    attributes: [
      { name: 'searchBar', type: 'SearchBar', vis: 'private' },
      { name: 'catalogGrid', type: 'Grid', vis: 'private' },
      { name: 'btnAddToCart', type: 'Button', vis: 'private' },
      { name: 'cartTable', type: 'Table', vis: 'private' },
      { name: 'btnCheckout', type: 'Button', vis: 'private' },
      { name: 'customerSelector', type: 'Select', vis: 'private' },
      { name: 'rentalDateModal', type: 'Modal', vis: 'private' },
      { name: 'paymentModal', type: 'Modal', vis: 'private' },
    ],
    operations: [
      { name: 'handleAddToCart', params: [{ name: 'item', type: 'Object' }], ret: 'void' },
      { name: 'handleRemoveFromCart', params: [{ name: 'itemId', type: 'uuid' }], ret: 'void' },
      { name: 'handleCheckout', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' },
    ]
  },
  {
    name: 'POSController', stereotype: 'Controller', module: 1,
    attributes: [
      { name: 'categoryModel', type: 'Object', vis: 'private' },
      { name: 'itemModel', type: 'Object', vis: 'private' },
      { name: 'packageModel', type: 'Object', vis: 'private' },
      { name: 'customerModel', type: 'Object', vis: 'private' },
      { name: 'settingsModel', type: 'Object', vis: 'private' },
      { name: 'transactionModel', type: 'Object', vis: 'private' },
      { name: 'activityLogModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getPOSData', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
      { name: 'getCheckoutData', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
      { name: 'checkout', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }, { name: 'config', type: 'Object' }], ret: 'Object' },
    ]
  },
  {
    name: 'TransactionModel', stereotype: 'Entity', module: 1,
    attributes: [
      { name: 'transactionsTable', type: 'String', vis: 'private' },
      { name: 'transactionItemsTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'branch_id', type: 'uuid', vis: 'private' },
      { name: 'cashier_id', type: 'uuid', vis: 'private' },
      { name: 'customer_id', type: 'uuid', vis: 'private' },
      { name: 'transaction_code', type: 'String', vis: 'private' },
      { name: 'type', type: 'String', vis: 'private' },
      { name: 'subtotal', type: 'numeric', vis: 'private' },
      { name: 'discount_amount', type: 'numeric', vis: 'private' },
      { name: 'discount_percent', type: 'numeric', vis: 'private' },
      { name: 'total_amount', type: 'numeric', vis: 'private' },
      { name: 'paid_amount', type: 'numeric', vis: 'private' },
      { name: 'change_amount', type: 'numeric', vis: 'private' },
      { name: 'payment_method', type: 'String', vis: 'private' },
      { name: 'payment_status', type: 'String', vis: 'private' },
      { name: 'midtrans_transaction_id', type: 'String', vis: 'private' },
      { name: 'midtrans_snap_token', type: 'String', vis: 'private' },
      { name: 'item_name', type: 'String', vis: 'private' },
      { name: 'quantity', type: 'int', vis: 'private' },
      { name: 'unit_price', type: 'numeric', vis: 'private' },
      { name: 'rental_start_date', type: 'date', vis: 'private' },
      { name: 'rental_end_date', type: 'date', vis: 'private' },
      { name: 'rental_days', type: 'int', vis: 'private' },
      { name: 'rental_status', type: 'String', vis: 'private' },
      { name: 'returned_at', type: 'timestamptz', vis: 'private' },
      { name: 'return_condition', type: 'String', vis: 'private' },
      { name: 'return_notes', type: 'String', vis: 'private' },
    ],
    operations: [
      { name: 'checkoutTransaction', params: [{ name: 'payload', type: 'Object' }], ret: 'Object' },
      { name: 'getTransactionDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
      { name: 'getTransactionsHistory', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'updateTransaction', params: [{ name: 'id', type: 'uuid' }, { name: 'data', type: 'Object' }], ret: 'Object' },
      { name: 'getActiveRentalsForReturns', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'updateTransactionItem', params: [{ name: 'id', type: 'uuid' }, { name: 'data', type: 'Object' }], ret: 'Object' },
    ]
  },
  {
    name: 'CustomerModel', stereotype: 'Entity', module: 1,
    attributes: [
      { name: 'customersTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'branch_id', type: 'uuid', vis: 'private' },
      { name: 'full_name', type: 'String', vis: 'private' },
      { name: 'phone', type: 'String', vis: 'private' },
      { name: 'email', type: 'String', vis: 'private' },
      { name: 'address', type: 'String', vis: 'private' },
      { name: 'notes', type: 'String', vis: 'private' },
      { name: 'created_at', type: 'timestamptz', vis: 'private' },
    ],
    operations: [
      { name: 'getCustomers', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'getCustomersMinimal', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'createCustomer', params: [{ name: 'customerData', type: 'Object' }], ret: 'Object' },
      { name: 'getCustomerDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
    ]
  },

  // ====== MODULE 2: Pengembalian & Denda ======
  {
    name: 'ReturnsView', stereotype: 'Boundary', module: 2,
    attributes: [
      { name: 'invoiceInput', type: 'TextField', vis: 'private' },
      { name: 'btnSearch', type: 'Button', vis: 'private' },
      { name: 'rentalsTable', type: 'Table', vis: 'private' },
      { name: 'btnReturnItems', type: 'Button', vis: 'private' },
      { name: 'returnModal', type: 'Modal', vis: 'private' },
      { name: 'btnConfirmReturn', type: 'Button', vis: 'private' },
    ],
    operations: [
      { name: 'handleSearchTransaction', params: [{ name: 'code', type: 'String' }], ret: 'void' },
      { name: 'handleProcessReturn', params: [{ name: 'payload', type: 'Object' }], ret: 'void' },
    ]
  },
  {
    name: 'PenaltiesView', stereotype: 'Boundary', module: 2,
    attributes: [
      { name: 'rulesTable', type: 'Table', vis: 'private' },
      { name: 'btnUpdateRule', type: 'Button', vis: 'private' },
      { name: 'ruleModal', type: 'Modal', vis: 'private' },
      { name: 'inputAmount', type: 'TextField', vis: 'private' },
      { name: 'btnSaveRule', type: 'Button', vis: 'private' },
    ],
    operations: [
      { name: 'handleUpdateRule', params: [{ name: 'ruleId', type: 'uuid' }, { name: 'amount', type: 'numeric' }], ret: 'void' },
    ]
  },
  {
    name: 'ReturnsController', stereotype: 'Controller', module: 2,
    attributes: [
      { name: 'transactionModel', type: 'Object', vis: 'private' },
      { name: 'penaltyModel', type: 'Object', vis: 'private' },
      { name: 'settingsModel', type: 'Object', vis: 'private' },
      { name: 'bookingModel', type: 'Object', vis: 'private' },
      { name: 'assetModel', type: 'Object', vis: 'private' },
      { name: 'activityLogModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getReturnsPageData', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
      { name: 'processReturn', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
    ]
  },
  {
    name: 'PenaltiesController', stereotype: 'Controller', module: 2,
    attributes: [
      { name: 'penaltyModel', type: 'Object', vis: 'private' },
      { name: 'activityLogModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getPenaltyRules', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
      { name: 'updatePenaltyRule', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
    ]
  },
  {
    name: 'PenaltyModel', stereotype: 'Entity', module: 2,
    attributes: [
      { name: 'penaltiesTable', type: 'String', vis: 'private' },
      { name: 'penaltyRulesTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'transaction_item_id', type: 'uuid', vis: 'private' },
      { name: 'penalty_rule_id', type: 'uuid', vis: 'private' },
      { name: 'branch_id', type: 'uuid', vis: 'private' },
      { name: 'type', type: 'String', vis: 'private' },
      { name: 'late_days', type: 'int', vis: 'private' },
      { name: 'calculated_amount', type: 'numeric', vis: 'private' },
      { name: 'payment_status', type: 'String', vis: 'private' },
      { name: 'notes', type: 'String', vis: 'private' },
      { name: 'paid_at', type: 'timestamptz', vis: 'private' },
      { name: 'rule_name', type: 'String', vis: 'private' },
      { name: 'rule_calculation_method', type: 'String', vis: 'private' },
      { name: 'rule_amount', type: 'numeric', vis: 'private' },
    ],
    operations: [
      { name: 'getPenaltyRules', params: [], ret: 'Array' },
      { name: 'getPenalties', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'insertPenalty', params: [{ name: 'penaltyData', type: 'Object' }], ret: 'Object' },
      { name: 'updatePenaltyRule', params: [{ name: 'id', type: 'uuid' }, { name: 'amount', type: 'numeric' }], ret: 'Object' },
    ]
  },

  // ====== MODULE 3: Inventaris & Paket ======
  {
    name: 'InventoryView', stereotype: 'Boundary', module: 3,
    attributes: [
      { name: 'itemsTable', type: 'Table', vis: 'private' },
      { name: 'btnAddNewItem', type: 'Button', vis: 'private' },
      { name: 'itemModal', type: 'Modal', vis: 'private' },
      { name: 'inputItemName', type: 'TextField', vis: 'private' },
      { name: 'inputBarcode', type: 'TextField', vis: 'private' },
      { name: 'btnSaveItem', type: 'Button', vis: 'private' },
    ],
    operations: [
      { name: 'handleSaveItem', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' },
      { name: 'handleDeleteItem', params: [{ name: 'id', type: 'uuid' }], ret: 'void' },
    ]
  },
  {
    name: 'PackagesView', stereotype: 'Boundary', module: 3,
    attributes: [
      { name: 'packagesTable', type: 'Table', vis: 'private' },
      { name: 'btnCreatePackage', type: 'Button', vis: 'private' },
      { name: 'packageModal', type: 'Modal', vis: 'private' },
      { name: 'inputPackageName', type: 'TextField', vis: 'private' },
      { name: 'btnSavePackage', type: 'Button', vis: 'private' },
    ],
    operations: [
      { name: 'handleSavePackage', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' },
      { name: 'handleDeletePackage', params: [{ name: 'id', type: 'uuid' }], ret: 'void' },
    ]
  },
  {
    name: 'ItemController', stereotype: 'Controller', module: 3,
    attributes: [
      { name: 'itemModel', type: 'Object', vis: 'private' },
      { name: 'categoryModel', type: 'Object', vis: 'private' },
      { name: 'activityLogModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getItems', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
      { name: 'getItemDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
      { name: 'saveItem', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
      { name: 'deleteItem', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
    ]
  },
  {
    name: 'PackageController', stereotype: 'Controller', module: 3,
    attributes: [
      { name: 'packageModel', type: 'Object', vis: 'private' },
      { name: 'itemModel', type: 'Object', vis: 'private' },
      { name: 'activityLogModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getPackages', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
      { name: 'savePackage', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
      { name: 'deletePackage', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
    ]
  },
  {
    name: 'ItemModel', stereotype: 'Entity', module: 3,
    attributes: [
      { name: 'itemsTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'branch_id', type: 'uuid', vis: 'private' },
      { name: 'category_id', type: 'uuid', vis: 'private' },
      { name: 'name', type: 'String', vis: 'private' },
      { name: 'description', type: 'String', vis: 'private' },
      { name: 'barcode', type: 'String', vis: 'private' },
      { name: 'rental_price_per_day', type: 'numeric', vis: 'private' },
      { name: 'sell_price', type: 'numeric', vis: 'private' },
      { name: 'stock_total', type: 'int', vis: 'private' },
      { name: 'stock_available', type: 'int', vis: 'private' },
      { name: 'is_active', type: 'boolean', vis: 'private' },
      { name: 'category_name', type: 'String', vis: 'private' },
      { name: 'category_type', type: 'String', vis: 'private' },
    ],
    operations: [
      { name: 'getItems', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'getActiveSewaItems', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'getActiveItems', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'getItemDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
      { name: 'insertItem', params: [{ name: 'itemData', type: 'Object' }], ret: 'Object' },
      { name: 'updateItem', params: [{ name: 'id', type: 'uuid' }, { name: 'itemData', type: 'Object' }], ret: 'Object' },
      { name: 'deleteItem', params: [{ name: 'id', type: 'uuid' }], ret: 'boolean' },
      { name: 'bulkInsertItems', params: [{ name: 'itemsList', type: 'Array' }], ret: 'boolean' },
    ]
  },
  {
    name: 'CategoryModel', stereotype: 'Entity', module: 3,
    attributes: [
      { name: 'categoriesTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'name', type: 'String', vis: 'private' },
      { name: 'type', type: 'String', vis: 'private' },
      { name: 'is_active', type: 'boolean', vis: 'private' },
    ],
    operations: [
      { name: 'getCategories', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'insertCategory', params: [{ name: 'categoryData', type: 'Object' }], ret: 'Object' },
      { name: 'updateCategory', params: [{ name: 'id', type: 'uuid' }, { name: 'categoryData', type: 'Object' }], ret: 'Object' },
      { name: 'deleteCategory', params: [{ name: 'id', type: 'uuid' }], ret: 'boolean' },
    ]
  },
  {
    name: 'PackageModel', stereotype: 'Entity', module: 3,
    attributes: [
      { name: 'packagesTable', type: 'String', vis: 'private' },
      { name: 'packageItemsTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'branch_id', type: 'uuid', vis: 'private' },
      { name: 'name', type: 'String', vis: 'private' },
      { name: 'description', type: 'String', vis: 'private' },
      { name: 'image_url', type: 'String', vis: 'private' },
      { name: 'package_price', type: 'numeric', vis: 'private' },
      { name: 'is_active', type: 'boolean', vis: 'private' },
      { name: 'item_quantity', type: 'int', vis: 'private' },
    ],
    operations: [
      { name: 'getPackages', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'getActivePackages', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'getPackageDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
      { name: 'createPackage', params: [{ name: 'data', type: 'Object' }, { name: 'items', type: 'Array' }], ret: 'Object' },
      { name: 'updatePackage', params: [{ name: 'id', type: 'uuid' }, { name: 'data', type: 'Object' }, { name: 'items', type: 'Array' }], ret: 'Object' },
      { name: 'deletePackage', params: [{ name: 'id', type: 'uuid' }], ret: 'boolean' },
    ]
  },

  // ====== MODULE 4: Aset Fisik & Booking ======
  {
    name: 'AssetStatusView', stereotype: 'Boundary', module: 4,
    attributes: [
      { name: 'searchInput', type: 'TextField', vis: 'private' },
      { name: 'kanbanGrid', type: 'Grid', vis: 'private' },
      { name: 'btnUpdateStatus', type: 'Button', vis: 'private' },
      { name: 'statusBadge', type: 'Label', vis: 'private' },
    ],
    operations: [
      { name: 'handleUpdateStatus', params: [{ name: 'assetId', type: 'uuid' }, { name: 'status', type: 'String' }], ret: 'void' },
      { name: 'getAssetsByStatus', params: [{ name: 'status', type: 'String' }], ret: 'Array' },
    ]
  },
  {
    name: 'BookingView', stereotype: 'Boundary', module: 4,
    attributes: [
      { name: 'calendar', type: 'Calendar', vis: 'private' },
      { name: 'btnBlockMaintenance', type: 'Button', vis: 'private' },
      { name: 'maintenanceModal', type: 'Modal', vis: 'private' },
      { name: 'dateRangePicker', type: 'DateRangePicker', vis: 'private' },
      { name: 'btnSaveBlock', type: 'Button', vis: 'private' },
    ],
    operations: [
      { name: 'handleCreateBlock', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' },
      { name: 'handleCancelBlock', params: [{ name: 'id', type: 'uuid' }], ret: 'void' },
    ]
  },
  {
    name: 'AssetStatusController', stereotype: 'Controller', module: 4,
    attributes: [
      { name: 'assetModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getAssets', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
      { name: 'updateStatus', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
    ]
  },
  {
    name: 'BookingController', stereotype: 'Controller', module: 4,
    attributes: [
      { name: 'bookingModel', type: 'Object', vis: 'private' },
      { name: 'categoryModel', type: 'Object', vis: 'private' },
      { name: 'itemModel', type: 'Object', vis: 'private' },
      { name: 'assetModel', type: 'Object', vis: 'private' },
      { name: 'branchModel', type: 'Object', vis: 'private' },
      { name: 'activityLogModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getBookingPageData', params: [{ name: 'profile', type: 'Object' }, { name: 'searchBranchId', type: 'uuid' }], ret: 'Object' },
      { name: 'createMaintenance', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
      { name: 'deleteBooking', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
    ]
  },
  {
    name: 'AssetModel', stereotype: 'Entity', module: 4,
    attributes: [
      { name: 'rentalAssetsTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'item_id', type: 'uuid', vis: 'private' },
      { name: 'asset_code', type: 'String', vis: 'private' },
      { name: 'status', type: 'String', vis: 'private' },
      { name: 'notes', type: 'String', vis: 'private' },
      { name: 'last_status_change', type: 'timestamptz', vis: 'private' },
    ],
    operations: [
      { name: 'getAssetsStatusCounts', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Object' },
      { name: 'getAssets', params: [{ name: 'params', type: 'Object' }], ret: 'Array' },
      { name: 'updateAssetStatus', params: [{ name: 'id', type: 'uuid' }, { name: 'status', type: 'String' }, { name: 'notes', type: 'String' }], ret: 'Object' },
      { name: 'deleteMaintenanceBookingForAsset', params: [{ name: 'assetId', type: 'uuid' }], ret: 'boolean' },
      { name: 'getReadyAssetsForItem', params: [{ name: 'itemId', type: 'uuid' }], ret: 'Array' },
      { name: 'insertAssets', params: [{ name: 'assetsList', type: 'Array' }], ret: 'boolean' },
    ]
  },
  {
    name: 'BookingModel', stereotype: 'Entity', module: 4,
    attributes: [
      { name: 'bookingsTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'rental_asset_id', type: 'uuid', vis: 'private' },
      { name: 'transaction_item_id', type: 'uuid', vis: 'private' },
      { name: 'branch_id', type: 'uuid', vis: 'private' },
      { name: 'start_date', type: 'date', vis: 'private' },
      { name: 'end_date', type: 'date', vis: 'private' },
      { name: 'status', type: 'String', vis: 'private' },
    ],
    operations: [
      { name: 'getBranchBookings', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
      { name: 'createBooking', params: [{ name: 'bookingData', type: 'Object' }], ret: 'Object' },
      { name: 'getBookingDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
      { name: 'deleteBooking', params: [{ name: 'id', type: 'uuid' }], ret: 'boolean' },
      { name: 'updateBookingStatusByTransactionItem', params: [{ name: 'transactionItemId', type: 'uuid' }, { name: 'status', type: 'String' }], ret: 'boolean' },
    ]
  },

  // ====== MODULE 5: Pengguna, Cabang, & Audit Trail ======
  {
    name: 'BranchManagementView', stereotype: 'Boundary', module: 5,
    attributes: [
      { name: 'branchesTable', type: 'Table', vis: 'private' },
      { name: 'btnCreateBranch', type: 'Button', vis: 'private' },
      { name: 'branchModal', type: 'Modal', vis: 'private' },
      { name: 'inputBranchName', type: 'TextField', vis: 'private' },
      { name: 'btnSaveBranch', type: 'Button', vis: 'private' },
    ],
    operations: [
      { name: 'handleSaveBranch', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' },
      { name: 'handleDeleteBranch', params: [{ name: 'id', type: 'uuid' }], ret: 'void' },
    ]
  },
  {
    name: 'ActivityLogView', stereotype: 'Boundary', module: 5,
    attributes: [
      { name: 'logsTable', type: 'Table', vis: 'private' },
      { name: 'branchSelector', type: 'Select', vis: 'private' },
      { name: 'searchInput', type: 'TextField', vis: 'private' },
    ],
    operations: [
      { name: 'handleFilter', params: [], ret: 'void' },
    ]
  },
  {
    name: 'BranchController', stereotype: 'Controller', module: 5,
    attributes: [
      { name: 'branchModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getBranches', params: [], ret: 'Object' },
      { name: 'saveBranch', params: [{ name: 'id', type: 'uuid' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
      { name: 'deleteBranch', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
    ]
  },
  {
    name: 'ActivityLogController', stereotype: 'Controller', module: 5,
    attributes: [
      { name: 'activityLogModel', type: 'Object', vis: 'private' },
      { name: 'branchModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getActivityLogData', params: [{ name: 'profile', type: 'Object' }, { name: 'searchParams', type: 'URLSearchParams' }], ret: 'Object' },
    ]
  },
  {
    name: 'BranchModel', stereotype: 'Entity', module: 5,
    attributes: [
      { name: 'branchesTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'name', type: 'String', vis: 'private' },
      { name: 'address', type: 'String', vis: 'private' },
      { name: 'phone', type: 'String', vis: 'private' },
      { name: 'is_active', type: 'boolean', vis: 'private' },
      { name: 'created_at', type: 'timestamptz', vis: 'private' },
    ],
    operations: [
      { name: 'getBranches', params: [], ret: 'Array' },
      { name: 'insertBranch', params: [{ name: 'branchData', type: 'Object' }], ret: 'Object' },
      { name: 'updateBranch', params: [{ name: 'id', type: 'uuid' }, { name: 'branchData', type: 'Object' }], ret: 'Object' },
      { name: 'deleteBranch', params: [{ name: 'id', type: 'uuid' }], ret: 'boolean' },
    ]
  },
  {
    name: 'ActivityLogModel', stereotype: 'Entity', module: 5,
    attributes: [
      { name: 'activityLogsTable', type: 'String', vis: 'private' },
      { name: 'id', type: 'uuid', vis: 'private' },
      { name: 'user_id', type: 'uuid', vis: 'private' },
      { name: 'branch_id', type: 'uuid', vis: 'private' },
      { name: 'action', type: 'String', vis: 'private' },
      { name: 'entity_type', type: 'String', vis: 'private' },
      { name: 'entity_id', type: 'uuid', vis: 'private' },
      { name: 'metadata', type: 'jsonb', vis: 'private' },
      { name: 'created_at', type: 'timestamptz', vis: 'private' },
    ],
    operations: [
      { name: 'getActivityLogs', params: [{ name: 'filter', type: 'Object' }], ret: 'Object' },
      { name: 'logActivity', params: [{ name: 'logData', type: 'Object' }], ret: 'Object' },
    ]
  },

  // ====== MODULE 6: Laporan, Statistik, & Pengaturan ======
  {
    name: 'DashboardView', stereotype: 'Boundary', module: 6,
    attributes: [
      { name: 'kpiCards', type: 'Card[]', vis: 'private' },
      { name: 'revenueChart', type: 'Chart', vis: 'private' },
      { name: 'branchChart', type: 'Chart', vis: 'private' },
      { name: 'recentTrxTable', type: 'Table', vis: 'private' },
      { name: 'monthSelector', type: 'Select', vis: 'private' },
    ],
    operations: [
      { name: 'handleRefresh', params: [], ret: 'void' },
    ]
  },
  {
    name: 'SettingsView', stereotype: 'Boundary', module: 6,
    attributes: [
      { name: 'inputDefaultDuration', type: 'TextField', vis: 'private' },
      { name: 'inputLateFee', type: 'TextField', vis: 'private' },
      { name: 'inputTargetRevenue', type: 'TextField', vis: 'private' },
      { name: 'btnSaveSettings', type: 'Button', vis: 'private' },
    ],
    operations: [
      { name: 'handleSaveSettings', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' },
    ]
  },
  {
    name: 'DashboardController', stereotype: 'Controller', module: 6,
    attributes: [
      { name: 'transactionModel', type: 'Object', vis: 'private' },
      { name: 'itemModel', type: 'Object', vis: 'private' },
      { name: 'settingsModel', type: 'Object', vis: 'private' },
      { name: 'branchModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getDashboardData', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
    ]
  },
  {
    name: 'SettingsController', stereotype: 'Controller', module: 6,
    attributes: [
      { name: 'settingsModel', type: 'Object', vis: 'private' },
    ],
    operations: [
      { name: 'getRentalSettings', params: [], ret: 'Object' },
      { name: 'updateRentalSettings', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
    ]
  },
  {
    name: 'SettingsModel', stereotype: 'Entity', module: 6,
    attributes: [
      { name: 'settingsTable', type: 'String', vis: 'private' },
      { name: 'key', type: 'String', vis: 'private' },
      { name: 'value', type: 'jsonb', vis: 'private' },
      { name: 'updated_at', type: 'timestamptz', vis: 'private' },
    ],
    operations: [
      { name: 'getRentalSettings', params: [], ret: 'Object' },
      { name: 'upsertRentalSettings', params: [{ name: 'value', type: 'Object' }], ret: 'boolean' },
    ]
  },
];

// Relationships: [sourceName, targetName, type]
// type: 'dependency' = ..> uses, 'association' = --> delegates/references
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

// Build class ID map
const classIdMap = {};
allClasses.forEach(cls => {
  classIdMap[cls.name] = uid('CLS_' + cls.name);
});

// Build UML class elements
function buildAttribute(attr) {
  return {
    _type: 'UMLAttribute',
    _id: uid('ATTR'),
    name: attr.name,
    visibility: attr.vis || 'private',
    type: attr.type
  };
}

function buildParameter(param) {
  return {
    _type: 'UMLParameter',
    _id: uid('PRM'),
    name: param.name,
    type: param.type
  };
}

function buildOperation(op) {
  const params = op.params.map(buildParameter);
  // Add return parameter
  params.push({
    _type: 'UMLParameter',
    _id: uid('PRM'),
    name: '',
    type: op.ret,
    direction: 'return'
  });
  return {
    _type: 'UMLOperation',
    _id: uid('OP'),
    name: op.name,
    visibility: 'public',
    parameters: params
  };
}

function buildClassElement(cls) {
  const classId = classIdMap[cls.name];
  const element = {
    _type: 'UMLClass',
    _id: classId,
    name: cls.name,
    stereotype: cls.stereotype,
    attributes: cls.attributes.map(buildAttribute),
    operations: cls.operations.map(buildOperation)
  };
  return element;
}

// Build class views with layout
// Layout: modules are stacked vertically, each module has 3 columns (Boundary, Controller, Entity)
function getModuleClasses(moduleNum) {
  return allClasses.filter(c => c.module === moduleNum);
}

function buildClassView(cls, x, y) {
  const classId = classIdMap[cls.name];
  const viewId = uid('CV');
  const attrCount = cls.attributes.length;
  const opCount = cls.operations.length;
  const nameHeight = 40;
  const attrHeight = Math.max(20, attrCount * 16 + 8);
  const opHeight = Math.max(20, opCount * 16 + 8);
  const totalHeight = nameHeight + attrHeight + opHeight;
  const width = 340;

  return {
    view: {
      _type: 'UMLClassView',
      _id: viewId,
      model: { $ref: classId },
      subViews: [
        {
          _type: 'UMLNameCompartmentView',
          _id: uid('NCV'),
          model: { $ref: classId },
          subViews: [
            {
              _type: 'LabelView',
              _id: uid('LV'),
              font: 'Arial;13;0',
              left: x + 5,
              top: y + 5,
              width: width - 10,
              height: 13,
              text: `\u00AB${cls.stereotype}\u00BB`
            },
            {
              _type: 'LabelView',
              _id: uid('LV'),
              font: 'Arial;13;1',
              left: x + 5,
              top: y + 20,
              width: width - 10,
              height: 13,
              text: cls.name
            }
          ],
          left: x,
          top: y,
          width: width,
          height: nameHeight
        },
        {
          _type: 'UMLAttributeCompartmentView',
          _id: uid('ACV'),
          model: { $ref: classId },
          left: x,
          top: y + nameHeight,
          width: width,
          height: attrHeight
        },
        {
          _type: 'UMLOperationCompartmentView',
          _id: uid('OCV'),
          model: { $ref: classId },
          left: x,
          top: y + nameHeight + attrHeight,
          width: width,
          height: opHeight
        }
      ],
      left: x,
      top: y,
      width: width,
      height: totalHeight
    },
    height: totalHeight
  };
}

// Build relationship views
function buildDependencyView(srcId, tgtId) {
  const depId = uid('DEP');
  return {
    element: {
      _type: 'UMLDependency',
      _id: depId,
      source: { $ref: srcId },
      target: { $ref: tgtId }
    },
    view: {
      _type: 'UMLDependencyView',
      _id: uid('DV'),
      model: { $ref: depId },
      head: { $ref: srcId },
      tail: { $ref: tgtId }
    }
  };
}

function buildAssociationView(srcId, tgtId) {
  const assocId = uid('ASSOC');
  return {
    element: {
      _type: 'UMLAssociation',
      _id: assocId,
      end1: {
        _type: 'UMLAssociationEnd',
        _id: uid('AE'),
        reference: { $ref: srcId },
        navigable: false
      },
      end2: {
        _type: 'UMLAssociationEnd',
        _id: uid('AE'),
        reference: { $ref: tgtId },
        navigable: true
      }
    },
    view: {
      _type: 'UMLAssociationView',
      _id: uid('AV'),
      model: { $ref: assocId },
      head: { $ref: srcId },
      tail: { $ref: tgtId }
    }
  };
}

// ---- Main generation ----

const classElements = [];
const classViews = [];
const relElements = [];
const relViews = [];

// Layout constants
const COL_WIDTH = 380;
const MODULE_GAP = 60;
const ROW_GAP = 30;

// Process each module
let currentY = 50;

for (let mod = 1; mod <= 6; mod++) {
  const modClasses = getModuleClasses(mod);
  
  // Separate by stereotype
  const boundaries = modClasses.filter(c => c.stereotype === 'Boundary');
  const controllers = modClasses.filter(c => c.stereotype === 'Controller');
  const entities = modClasses.filter(c => c.stereotype === 'Entity');

  const columns = [boundaries, controllers, entities];
  let maxColHeight = 0;

  columns.forEach((col, colIdx) => {
    let y = currentY;
    col.forEach(cls => {
      const x = 50 + colIdx * COL_WIDTH;
      const result = buildClassView(cls, x, y);
      classViews.push(result.view);
      classElements.push(buildClassElement(cls));
      y += result.height + ROW_GAP;
    });
    const colHeight = y - currentY;
    if (colHeight > maxColHeight) maxColHeight = colHeight;
  });

  currentY += maxColHeight + MODULE_GAP;
}

// Process relationships
// We need to store relationship elements on the owning class
// For simplicity, store them at the model level
relationships.forEach(([srcName, tgtName, type]) => {
  const srcId = classIdMap[srcName];
  const tgtId = classIdMap[tgtName];
  if (!srcId || !tgtId) return;

  if (type === 'dependency') {
    const dep = buildDependencyView(srcId, tgtId);
    relElements.push(dep.element);
    relViews.push(dep.view);
  } else {
    const assoc = buildAssociationView(srcId, tgtId);
    relElements.push(assoc.element);
    relViews.push(assoc.view);
  }
});

// Compose final MDJ
const mdj = {
  _type: 'Project',
  _id: uid('PROJ'),
  name: 'BotaniRent Class Diagram',
  ownedElements: [
    {
      _type: 'UMLModel',
      _id: uid('MODEL'),
      name: 'BotaniRent',
      ownedElements: [
        {
          _type: 'UMLClassDiagram',
          _id: uid('DIAG'),
          name: 'BotaniRent BCE Class Diagram',
          visible: true,
          defaultDiagram: true,
          ownedViews: [...classViews, ...relViews]
        },
        ...classElements,
        ...relElements
      ]
    }
  ]
};

const outputPath = process.argv[2] || 'botanirent_class_diagram.mdj';
fs.writeFileSync(outputPath, JSON.stringify(mdj, null, 2), 'utf-8');

console.log(`✅ MDJ file generated successfully: ${outputPath}`);
console.log(`   Total classes: ${allClasses.length}`);
console.log(`   Total relationships: ${relationships.length}`);
console.log(`   Total attributes: ${allClasses.reduce((s, c) => s + c.attributes.length, 0)}`);
console.log(`   Total operations: ${allClasses.reduce((s, c) => s + c.operations.length, 0)}`);
