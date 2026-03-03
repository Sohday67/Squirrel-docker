const User = require('./User');
const Spending = require('./Spending');
const Category = require('./Category');
const Return = require('./Return');

// Associations
User.hasMany(Spending, { foreignKey: 'userId', onDelete: 'CASCADE' });
Spending.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Category, { foreignKey: 'userId', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Return, { foreignKey: 'userId', onDelete: 'CASCADE' });
Return.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Spending, { foreignKey: 'categoryId' });
Spending.belongsTo(Category, { foreignKey: 'categoryId' });

Spending.hasMany(Return, { foreignKey: 'spendingId' });
Return.belongsTo(Spending, { foreignKey: 'spendingId' });

module.exports = { User, Spending, Category, Return };
