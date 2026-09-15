"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const user_model_1 = require("../../infrastructure/database/models/user.model");
class UserRepository {
    async findAll(offset, limit) {
        const { rows, count } = await user_model_1.User.findAndCountAll({
            order: [["createdAt", "DESC"]],
            offset,
            limit,
        });
        return { rows, count };
    }
    async findById(id) {
        return user_model_1.User.findByPk(id);
    }
    async findByEmail(email) {
        return user_model_1.User.findOne({
            where: {
                email: email.toLowerCase(),
            },
        });
    }
    async create(data) {
        return user_model_1.User.create({
            name: data.name,
            email: data.email.toLowerCase(),
            isActive: true,
        });
    }
    async update(id, data) {
        const user = await user_model_1.User.findByPk(id);
        if (!user) {
            return null;
        }
        if (data.name !== undefined) {
            user.name = data.name;
        }
        if (data.email !== undefined) {
            user.email = data.email.toLowerCase();
        }
        if (data.isActive !== undefined) {
            user.isActive = data.isActive;
        }
        await user.save();
        return user;
    }
    async delete(id) {
        const deletedCount = await user_model_1.User.destroy({
            where: {
                id,
            },
        });
        return deletedCount > 0;
    }
}
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map