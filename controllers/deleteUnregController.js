const User = require("../model/User");

User.createIndexes({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const deleteUnregisteredUsers = async () => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await User.deleteMany({ status: 0, createdAt: { $lt: cutoffTime } });
    // console.log("Unregistered users deleted successfully.");
  } catch (error) {
    // console.error("Error deleting inactive users:", error);
  }
};

module.exports = {
  deleteUnregisteredUsers,
};
