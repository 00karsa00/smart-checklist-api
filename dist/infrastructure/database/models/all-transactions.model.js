"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllTransaction = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const accounts_model_1 = require("./accounts.model");
const transaction_types_model_1 = require("./transaction-types.model");
const user_model_1 = require("./user.model");
let AllTransaction = class AllTransaction extends sequelize_typescript_1.Model {
};
exports.AllTransaction = AllTransaction;
__decorate([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Default)(sequelize_typescript_1.DataType.UUIDV4),
    (0, sequelize_typescript_1.IsUUID)(4),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], AllTransaction.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DATEONLY),
    __metadata("design:type", String)
], AllTransaction.prototype, "transactionDate", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], AllTransaction.prototype, "year", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], AllTransaction.prototype, "month", void 0);
__decorate([
    sequelize_typescript_1.Index,
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.ForeignKey)(() => accounts_model_1.Account),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], AllTransaction.prototype, "accountId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => accounts_model_1.Account),
    __metadata("design:type", accounts_model_1.Account)
], AllTransaction.prototype, "account", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", Object)
], AllTransaction.prototype, "paymentMethod", void 0);
__decorate([
    sequelize_typescript_1.Index,
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.ForeignKey)(() => transaction_types_model_1.TransactionType),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], AllTransaction.prototype, "transactionTypeId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => transaction_types_model_1.TransactionType),
    __metadata("design:type", transaction_types_model_1.TransactionType)
], AllTransaction.prototype, "transactionType", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DECIMAL(15, 2)),
    __metadata("design:type", String)
], AllTransaction.prototype, "amount", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", Object)
], AllTransaction.prototype, "remarks", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", Object)
], AllTransaction.prototype, "note", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_model_1.User),
    (0, sequelize_typescript_1.AllowNull)(false),
    sequelize_typescript_1.Index,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], AllTransaction.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_model_1.User),
    __metadata("design:type", user_model_1.User)
], AllTransaction.prototype, "user", void 0);
exports.AllTransaction = AllTransaction = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "all_transactions",
        timestamps: true,
        underscored: true,
    })
], AllTransaction);
//# sourceMappingURL=all-transactions.model.js.map