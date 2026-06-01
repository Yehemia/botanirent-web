import fs from 'fs';
import path from 'path';

// Helper to generate unique IDs
function genId(prefix) {
    return prefix + '_' + Math.random().toString(36).substring(2, 11);
}

const projectId = genId('Project');
const modelId = genId('UMLModel');
const diagramId = genId('UMLClassDiagram');

// Define classes
const classesData = [
    // --- MODULE: POS & TRANSACTIONS ---
    {
        name: 'POSView',
        stereotype: 'Boundary',
        col: 0, row: 0,
        attributes: [
            { name: 'searchBar', type: 'SearchBar', visibility: 'private' },
            { name: 'catalogGrid', type: 'Grid', visibility: 'private' },
            { name: 'btnAddToCart', type: 'Button', visibility: 'private' },
            { name: 'cartTable', type: 'Table', visibility: 'private' },
            { name: 'btnCheckout', type: 'Button', visibility: 'private' },
            { name: 'customerSelector', type: 'Select', visibility: 'private' },
            { name: 'rentalDateModal', type: 'Modal', visibility: 'private' },
            { name: 'paymentModal', type: 'Modal', visibility: 'private' }
        ],
        operations: [
            { name: 'handleAddToCart', params: [{ name: 'item', type: 'Object' }], ret: 'void' },
            { name: 'handleRemoveFromCart', params: [{ name: 'itemId', type: 'uuid' }], ret: 'void' },
            { name: 'handleCheckout', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' }
        ]
    },
    {
        name: 'POSController',
        stereotype: 'Controller',
        col: 1, row: 0,
        attributes: [
            { name: 'categoryModel', type: 'Object', visibility: 'private' },
            { name: 'itemModel', type: 'Object', visibility: 'private' },
            { name: 'packageModel', type: 'Object', visibility: 'private' },
            { name: 'customerModel', type: 'Object', visibility: 'private' },
            { name: 'settingsModel', type: 'Object', visibility: 'private' },
            { name: 'transactionModel', type: 'Object', visibility: 'private' },
            { name: 'activityLogModel', type: 'Object', visibility: 'private' }
        ],
        operations: [
            { name: 'getPOSData', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
            { name: 'getCheckoutData', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
            { name: 'checkout', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }, { name: 'config', type: 'Object' }], ret: 'Object' }
        ]
    },
    {
        name: 'TransactionModel',
        stereotype: 'Entity',
        col: 2, row: 0,
        attributes: [
            { name: 'transactionsTable', type: 'String', visibility: 'private' },
            { name: 'transactionItemsTable', type: 'String', visibility: 'private' },
            { name: 'id', type: 'uuid', visibility: 'private' },
            { name: 'branch_id', type: 'uuid', visibility: 'private' },
            { name: 'cashier_id', type: 'uuid', visibility: 'private' },
            { name: 'customer_id', type: 'uuid', visibility: 'private' },
            { name: 'transaction_code', type: 'String', visibility: 'private' },
            { name: 'type', type: 'String', visibility: 'private' },
            { name: 'subtotal', type: 'numeric', visibility: 'private' },
            { name: 'discount_amount', type: 'numeric', visibility: 'private' },
            { name: 'discount_percent', type: 'numeric', visibility: 'private' },
            { name: 'total_amount', type: 'numeric', visibility: 'private' },
            { name: 'paid_amount', type: 'numeric', visibility: 'private' },
            { name: 'change_amount', type: 'numeric', visibility: 'private' },
            { name: 'payment_method', type: 'String', visibility: 'private' },
            { name: 'payment_status', type: 'String', visibility: 'private' },
            { name: 'midtrans_transaction_id', type: 'String', visibility: 'private' },
            { name: 'midtrans_snap_token', type: 'String', visibility: 'private' },
            { name: 'item_name', type: 'String', visibility: 'private' },
            { name: 'quantity', type: 'int', visibility: 'private' },
            { name: 'unit_price', type: 'numeric', visibility: 'private' },
            { name: 'rental_start_date', type: 'date', visibility: 'private' },
            { name: 'rental_end_date', type: 'date', visibility: 'private' },
            { name: 'rental_days', type: 'int', visibility: 'private' },
            { name: 'rental_status', type: 'String', visibility: 'private' },
            { name: 'returned_at', type: 'timestamptz', visibility: 'private' },
            { name: 'return_condition', type: 'String', visibility: 'private' },
            { name: 'return_notes', type: 'String', visibility: 'private' }
        ],
        operations: [
            { name: 'checkoutTransaction', params: [{ name: 'payload', type: 'Object' }], ret: 'Object' },
            { name: 'getTransactionDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
            { name: 'getTransactionsHistory', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
            { name: 'updateTransaction', params: [{ name: 'id', type: 'uuid' }, { name: 'data', type: 'Object' }], ret: 'Object' }
        ]
    },
    {
        name: 'CustomerModel',
        stereotype: 'Entity',
        col: 2, row: 1,
        attributes: [
            { name: 'customersTable', type: 'String', visibility: 'private' },
            { name: 'id', type: 'uuid', visibility: 'private' },
            { name: 'branch_id', type: 'uuid', visibility: 'private' },
            { name: 'full_name', type: 'String', visibility: 'private' },
            { name: 'phone', type: 'String', visibility: 'private' },
            { name: 'email', type: 'String', visibility: 'private' },
            { name: 'address', type: 'String', visibility: 'private' },
            { name: 'notes', type: 'String', visibility: 'private' },
            { name: 'created_at', type: 'timestamptz', visibility: 'private' }
        ],
        operations: [
            { name: 'getCustomersMinimal', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
            { name: 'createCustomer', params: [{ name: 'customerData', type: 'Object' }], ret: 'Object' },
            { name: 'getCustomerDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' }
        ]
    },

    // --- MODULE: RETURNS & PENALTIES ---
    {
        name: 'ReturnsView',
        stereotype: 'Boundary',
        col: 0, row: 1,
        attributes: [
            { name: 'invoiceInput', type: 'TextField', visibility: 'private' },
            { name: 'btnSearch', type: 'Button', visibility: 'private' },
            { name: 'rentalsTable', type: 'Table', visibility: 'private' },
            { name: 'btnReturnItems', type: 'Button', visibility: 'private' },
            { name: 'returnModal', type: 'Modal', visibility: 'private' },
            { name: 'btnConfirmReturn', type: 'Button', visibility: 'private' }
        ],
        operations: [
            { name: 'handleSearchTransaction', params: [{ name: 'code', type: 'String' }], ret: 'void' },
            { name: 'handleProcessReturn', params: [{ name: 'payload', type: 'Object' }], ret: 'void' }
        ]
    },
    {
        name: 'PenaltiesView',
        stereotype: 'Boundary',
        col: 0, row: 2,
        attributes: [
            { name: 'rulesTable', type: 'Table', visibility: 'private' },
            { name: 'btnUpdateRule', type: 'Button', visibility: 'private' },
            { name: 'ruleModal', type: 'Modal', visibility: 'private' },
            { name: 'inputAmount', type: 'TextField', visibility: 'private' },
            { name: 'btnSaveRule', type: 'Button', visibility: 'private' }
        ],
        operations: [
            { name: 'handleUpdateRule', params: [{ name: 'ruleId', type: 'uuid' }, { name: 'amount', type: 'numeric' }], ret: 'void' }
        ]
    },
    {
        name: 'ReturnsController',
        stereotype: 'Controller',
        col: 1, row: 1,
        attributes: [
            { name: 'transactionModel', type: 'Object', visibility: 'private' },
            { name: 'penaltyModel', type: 'Object', visibility: 'private' },
            { name: 'settingsModel', type: 'Object', visibility: 'private' },
            { name: 'bookingModel', type: 'Object', visibility: 'private' },
            { name: 'assetModel', type: 'Object', visibility: 'private' },
            { name: 'activityLogModel', type: 'Object', visibility: 'private' }
        ],
        operations: [
            { name: 'getReturnsPageData', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
            { name: 'processReturn', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' }
        ]
    },
    {
        name: 'PenaltiesController',
        stereotype: 'Controller',
        col: 1, row: 2,
        attributes: [
            { name: 'penaltyModel', type: 'Object', visibility: 'private' },
            { name: 'activityLogModel', type: 'Object', visibility: 'private' }
        ],
        operations: [
            { name: 'getPenaltyRules', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
            { name: 'updatePenaltyRule', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' }
        ]
    },
    {
        name: 'PenaltyModel',
        stereotype: 'Entity',
        col: 2, row: 2,
        attributes: [
            { name: 'penaltiesTable', type: 'String', visibility: 'private' },
            { name: 'penaltyRulesTable', type: 'String', visibility: 'private' },
            { name: 'id', type: 'uuid', visibility: 'private' },
            { name: 'transaction_item_id', type: 'uuid', visibility: 'private' },
            { name: 'penalty_rule_id', type: 'uuid', visibility: 'private' },
            { name: 'branch_id', type: 'uuid', visibility: 'private' },
            { name: 'type', type: 'String', visibility: 'private' },
            { name: 'late_days', type: 'int', visibility: 'private' },
            { name: 'calculated_amount', type: 'numeric', visibility: 'private' },
            { name: 'payment_status', type: 'String', visibility: 'private' },
            { name: 'notes', type: 'String', visibility: 'private' },
            { name: 'paid_at', type: 'timestamptz', visibility: 'private' },
            { name: 'rule_name', type: 'String', visibility: 'private' },
            { name: 'rule_calculation_method', type: 'String', visibility: 'private' },
            { name: 'rule_amount', type: 'numeric', visibility: 'private' }
        ],
        operations: [
            { name: 'getPenaltyRules', params: [], ret: 'Array' },
            { name: 'getPenalties', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
            { name: 'insertPenalty', params: [{ name: 'penaltyData', type: 'Object' }], ret: 'Object' },
            { name: 'updatePenaltyRule', params: [{ name: 'id', type: 'uuid' }, { name: 'amount', type: 'numeric' }], ret: 'Object' }
        ]
    },

    // --- MODULE: INVENTORY & PACKAGES ---
    {
        name: 'InventoryView',
        stereotype: 'Boundary',
        col: 0, row: 3,
        attributes: [
            { name: 'itemsTable', type: 'Table', visibility: 'private' },
            { name: 'btnAddNewItem', type: 'Button', visibility: 'private' },
            { name: 'itemModal', type: 'Modal', visibility: 'private' },
            { name: 'inputItemName', type: 'TextField', visibility: 'private' },
            { name: 'inputBarcode', type: 'TextField', visibility: 'private' },
            { name: 'btnSaveItem', type: 'Button', visibility: 'private' }
        ],
        operations: [
            { name: 'handleSaveItem', params: [{ name: 'formData', type: 'FormData' }], ret: 'void' },
            { name: 'handleDeleteItem', params: [{ name: 'id', type: 'uuid' }], ret: 'void' }
        ]
    },
    {
        name: 'ItemController',
        stereotype: 'Controller',
        col: 1, row: 3,
        attributes: [
            { name: 'itemModel', type: 'Object', visibility: 'private' },
            { name: 'categoryModel', type: 'Object', visibility: 'private' },
            { name: 'activityLogModel', type: 'Object', visibility: 'private' }
        ],
        operations: [
            { name: 'getItems', params: [{ name: 'profile', type: 'Object' }], ret: 'Object' },
            { name: 'getItemDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' },
            { name: 'saveItem', params: [{ name: 'profile', type: 'Object' }, { name: 'formData', type: 'FormData' }], ret: 'Object' },
            { name: 'deleteItem', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' }
        ]
    },
    {
        name: 'ItemModel',
        stereotype: 'Entity',
        col: 2, row: 3,
        attributes: [
            { name: 'itemsTable', type: 'String', visibility: 'private' },
            { name: 'id', type: 'uuid', visibility: 'private' },
            { name: 'branch_id', type: 'uuid', visibility: 'private' },
            { name: 'category_id', type: 'uuid', visibility: 'private' },
            { name: 'name', type: 'String', visibility: 'private' },
            { name: 'description', type: 'String', visibility: 'private' },
            { name: 'barcode', type: 'String', visibility: 'private' },
            { name: 'rental_price_per_day', type: 'numeric', visibility: 'private' },
            { name: 'sell_price', type: 'numeric', visibility: 'private' },
            { name: 'stock_total', type: 'int', visibility: 'private' },
            { name: 'stock_available', type: 'int', visibility: 'private' },
            { name: 'is_active', type: 'boolean', visibility: 'private' },
            { name: 'category_name', type: 'String', visibility: 'private' },
            { name: 'category_type', type: 'String', visibility: 'private' }
        ],
        operations: [
            { name: 'getItems', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
            { name: 'getActiveSewaItems', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
            { name: 'getActiveItems', params: [{ name: 'branchId', type: 'uuid' }], ret: 'Array' },
            { name: 'getItemDetails', params: [{ name: 'id', type: 'uuid' }], ret: 'Object' }
        ]
    }
];

// Map classes to IDs
const classMap = {};
classesData.forEach(c => {
    classMap[c.name] = {
        id: genId('UMLClass_' + c.name),
        data: c
    };
});

// Build logical UMLClasses
const umlClasses = Object.keys(classMap).map(name => {
    const item = classMap[name];
    const c = item.data;
    const cid = item.id;

    // Attributes
    const attributes = c.attributes.map(a => ({
        "_type": "UMLAttribute",
        "_id": genId('UMLAttribute'),
        "name": a.name,
        "visibility": a.visibility,
        "type": a.type
    }));

    // Operations
    const operations = c.operations.map(o => {
        const opId = genId('UMLOperation');
        const parameters = [];

        // Input params
        if (o.params) {
            o.params.forEach(p => {
                parameters.push({
                    "_type": "UMLParameter",
                    "_id": genId('UMLParameter'),
                    "name": p.name,
                    "type": p.type
                });
            });
        }

        // Return param
        if (o.ret) {
            parameters.push({
                "_type": "UMLParameter",
                "_id": genId('UMLParameter'),
                "name": "returnVal",
                "type": o.ret,
                "direction": "return"
            });
        }

        return {
            "_type": "UMLOperation",
            "_id": opId,
            "name": o.name,
            "visibility": "public",
            "parameters": parameters
        };
    });

    return {
        "_type": "UMLClass",
        "_id": cid,
        "name": c.name,
        "stereotype": c.stereotype,
        "attributes": attributes,
        "operations": operations
    };
});

// Build relationships (logical dependencies/associations)
const relationships = [];

// Helper to add dependency (dashed arrow)
function addDependency(fromName, toName) {
    if (!classMap[fromName] || !classMap[toName]) return;
    const fromId = classMap[fromName].id;
    const toId = classMap[toName].id;
    relationships.push({
        "_type": "UMLDependency",
        "_id": genId('UMLDependency'),
        "source": { "$ref": fromId },
        "target": { "$ref": toId }
    });
}

// Helper to add association (solid arrow)
function addAssociation(fromName, toName) {
    if (!classMap[fromName] || !classMap[toName]) return;
    const fromId = classMap[fromName].id;
    const toId = classMap[toName].id;
    relationships.push({
        "_type": "UMLAssociation",
        "_id": genId('UMLAssociation'),
        "end1": {
            "_type": "UMLAssociationEnd",
            "_id": genId('UMLAssociationEnd'),
            "reference": { "$ref": fromId },
            "navigable": false
        },
        "end2": {
            "_type": "UMLAssociationEnd",
            "_id": genId('UMLAssociationEnd'),
            "reference": { "$ref": toId },
            "navigable": true
        }
    });
}

// Add POS Modul relationships
addDependency('POSView', 'POSController');
addAssociation('POSController', 'TransactionModel');
addAssociation('POSController', 'CustomerModel');
addAssociation('TransactionModel', 'CustomerModel');

// Add Returns Modul relationships
addDependency('ReturnsView', 'ReturnsController');
addAssociation('ReturnsController', 'PenaltyModel');
addAssociation('ReturnsController', 'TransactionModel');

// Add Inventory Modul relationships
addDependency('InventoryView', 'ItemController');
addAssociation('ItemController', 'ItemModel');

// Attach relationships to source classes
relationships.forEach(rel => {
    const srcRef = rel.source || rel.end1.reference;
    const srcId = srcRef['$ref'];
    const targetClass = umlClasses.find(c => c._id === srcId);
    if (targetClass) {
        if (!targetClass.ownedElements) targetClass.ownedElements = [];
        targetClass.ownedElements.push(rel);
    }
});

// Build visual views
const ownedViews = [];

// Layout coordinates
// Col 0 (Boundary) X=100, Col 1 (Controller) X=450, Col 2 (Entity) X=800
// Rows Y=100, Y=450, Y=800, Y=1150
const colX = [100, 500, 900];
const rowY = [100, 480, 860, 1240];

Object.keys(classMap).forEach(name => {
    const item = classMap[name];
    const c = item.data;
    const cid = item.id;

    const x = colX[c.col];
    const y = rowY[c.row];
    const width = 320;
    const height = 280;

    ownedViews.push({
        "_type": "UMLClassView",
        "_id": genId('UMLClassView'),
        "model": { "$ref": cid },
        "subViews": [
            {
                "_type": "UMLNameCompartmentView",
                "_id": genId('UMLNameCompartmentView'),
                "model": { "$ref": cid },
                "subViews": [
                    {
                        "_type": "LabelView",
                        "_id": genId('LabelView'),
                        "font": "Arial;13;0",
                        "left": x + 5,
                        "top": y + 5,
                        "width": width - 10,
                        "height": 13,
                        "text": "«" + c.stereotype + "»"
                    },
                    {
                        "_type": "LabelView",
                        "_id": genId('LabelView'),
                        "font": "Arial;13;1",
                        "left": x + 5,
                        "top": y + 20,
                        "width": width - 10,
                        "height": 13,
                        "text": c.name
                    }
                ],
                "left": x,
                "top": y,
                "width": width,
                "height": 40
            },
            {
                "_type": "UMLAttributeCompartmentView",
                "_id": genId('UMLAttributeCompartmentView'),
                "model": { "$ref": cid },
                "left": x,
                "top": y + 40,
                "width": width,
                "height": 100
            },
            {
                "_type": "UMLOperationCompartmentView",
                "_id": genId('UMLOperationCompartmentView'),
                "model": { "$ref": cid },
                "left": x,
                "top": y + 140,
                "width": width,
                "height": 100
            }
        ],
        "left": x,
        "top": y,
        "width": width,
        "height": height
    });
});

// Construct full Project JSON structure
const starUMLProject = {
    "_type": "Project",
    "_id": projectId,
    "name": "BotaniRent Class Diagram",
    "ownedElements": [
        {
            "_type": "UMLModel",
            "_id": modelId,
            "name": "Model",
            "ownedElements": [
                {
                    "_type": "UMLClassDiagram",
                    "_id": diagramId,
                    "name": "BotaniRent Class Diagram",
                    "visible": true,
                    "defaultDiagram": true,
                    "ownedViews": ownedViews
                },
                ...umlClasses
            ]
        }
    ]
};

// Write to file in workspace
const outputPath = path.join('c:', 'Users', 'rexzy', 'botanirent-web', 'botanirent_class_diagram.mdj');
fs.writeFileSync(outputPath, JSON.stringify(starUMLProject, null, 2), 'utf-8');
console.log('StarUML .mdj file generated successfully at:', outputPath);
