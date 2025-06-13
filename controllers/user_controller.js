const userData = require("../data_access_module/user_data");
const sendErrorResponse = require("../utils/sendErrorResponse");
const ACCOUNT_STATUS = require("../config/verify_status");

const removeUser = async (req, res) => {
    try {
    const userId = req?.params?.id;

    if (!userId) {
      return sendErrorResponse(res, 400, "Incomplete information!");
    }
    const result = await userData.deleteUser(userId);
    if (result.affectedRows > 0) {
      return res.status(200).json({
          success: true,
          message: `successfully deleted user : ${userId}`
      });
    }
    return sendErrorResponse(res, 409, "Unable to remove user");
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, 500, "Internal server error!");
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = req?.params?.page;
    if (!page) return sendErrorResponse(res, 400, "Incomplete information!");

    const result = await userData.getAllUsers(page);
    if (!result) return sendErrorResponse(res,404,"Not found, unable to show users!");

    return res.status(200).json({
        success: true,
        message: `successfully loaded page ${page} users!`,
        body: result,
    });

  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, 500, "Internal server error!");
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req?.params?.id;
    const userRole = req.userRole;

    if (!userId) return sendErrorResponse(res, 400, "Incomplete information!");
    const result = await userData.getUser(userId);

    if (result) {
      return res.status(200).json({
          success: true,
          message: `successfully retrieved user : ${userId}`,
          body: result,
      });
    } else {
      return res.status(200).json({
          success: false,
          message: `No users found with ${userId} id!`,
          body: result,
      });
    }
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, 500, "Internal server error!");
  }
};

const suspendUser = async (req, res) => {
  try {
    const userId = req?.params?.id;
    if (!userId) {
      return sendErrorResponse(res, 400, "Incomplete information!");
    }

    const result = await userData.changeUserStatus(userId, ACCOUNT_STATUS.SUSPENDED);
    if (result.affectedRows < 1) {
      return res.status(200).json({
          success: false,
          message: `No users found with ${userId} id!`,
          body: result,
      });
    } else {
      return res.status(200).json({
          success: true,
          message: `successfully suspended user : ${userId}`,
          body: result,
      });
    }
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, 500, "Internal server error!");
  }
};

const activateUser = async (req, res) => {
  try {
    const userId = req?.params?.id;

    if (!userId) {
      return sendErrorResponse(res, 400, "Incomplete information!");
    }

    const result = await userData.changeUserStatus(userId, ACCOUNT_STATUS.ACTIVE);
    if (result.affectedRows < 1) {
      return res.status(200).json({
          success: false,
          message: `No users found with ${userId} id`,
          body: result,
      });
    } else {
      return res.status(200).json({
          success: true,
          message: `successfully activated user : ${userId}`,
          body: result,
      });
    }
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, 500, "Internal server error!");
  }
};

module.exports = {
  getAllUsers,
  getUser,
  suspendUser,
  removeUser,
  activateUser,
};
