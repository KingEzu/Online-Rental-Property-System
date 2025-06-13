const notificationData = require('../data_access_module/notification_data');
const notificationTypes = require('../config/notification_types');
const paymentData = require('../data_access_module/payment_data');
const sendErrorResponse = require('../utils/sendErrorResponse');
const {getDate} = require('../utils/date');
const { getUser } = require('../data_access_module/user_data');
const crypto = require('crypto');
const instance = require('axios');
const CSK = process.env.CSK;

const axios = instance.create({
    validateStatus: function (status) {return status < 500;}
});

const deleteSubAccount = async (req, res) =>{
    try {
        if (!req?.userId) return sendErrorResponse(res, 400, "Payment initialization failed!");
        const userId = req?.userId;
        const deleteSubAccountResullt = await paymentData.deleteSubAccount(userId);

        if (deleteSubAccountResullt.affectedRows < 1) return sendErrorResponse(
            res,500,"Internal server error, Couldn't delete the sub-accunt!");

        res.status(200).json({ 
            "success" : true,
            "message" : "Your sub-account has been deleted!"
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(
            res, 
            500, 
            "Internal server error!"
        );
    }
}

const getPaymentInfo = async (req, res) =>{
    try {
        const owner_id = req?.params?.id;
        if(!owner_id) return sendErrorResponse(res, 400, "Invalid information, no owner specified!");

        const paymentInfo = await paymentData.getPaymentInfo(owner_id);
        if(!paymentInfo) return sendErrorResponse(res,404,"The owner has no payment information specified!");
        res.status(200).json({ 
            "success" : true,
            "body" : paymentInfo.sub_account_id,
            "message" : "Successfully retrieved payment informtion!"
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");
    }
}

const getMyPaymentInfo = async (req, res) =>{
    try {
        const owner_id = req?.userId;
        if(!owner_id) return sendErrorResponse(res, 400, "Invalid information, no owner specified!");

        const paymentInfo = await paymentData.getPaymentInfo(owner_id);
        if(!paymentInfo) return sendErrorResponse(res, 404, "No payment information!");

        res.status(200).json({ 
            "success" : true,
            "body" : paymentInfo,
            "message" : "Successfully retrieved payment informtion!"
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");
    }
}


const createSubAccount = async (req, res) =>{
    try {
        if(
            !req?.body?.account_number ||
            !req?.body?.business_name ||
            !req?.body?.account_owner_name ||
            !req?.body?.bank_id || !req?.body?.bank_name
        ) return sendErrorResponse(res, 400, "Incomplete information!");

        if (!req?.userId) return sendErrorResponse(res, 400, "There is something wrong with the data you provided!");

        const {account_number, business_name, account_owner_name, bank_id, bank_name} = req?.body;
        
        const response = await axios.post(
            "https://api.chapa.co/v1/subaccount",{
                business_name: business_name,
                account_name: account_owner_name,
                bank_code: bank_id,
                account_number: account_number,
                split_type: "percentage",
                split_value: 0.02,
            },{ 
            headers : {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CSK}`,
               }
            },
        );

        console.log(response);
        

        const sub_account_id = response.data.data["subaccounts[id]"];

        const result = await paymentData.createSubAccount(
            req?.userId, 
            account_number,
            sub_account_id,
            business_name,
            account_owner_name,
            bank_id,
            bank_name
        );

        if(result.affectedRows < 1) return sendErrorResponse(res, 500, "Internal server error!");
        return res.status(200).json({
            "success" : true,
            "message" : "Sub-account created successfully!"
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error, Couldn't create the subaccount!");
    }
}

const initialize = async (req, res) =>{
  try{
    if (
        !req?.body?.title ||
        !req?.body?.description ||
        !req?.body?.amount ||
        !req?.body?.currency ||
        !req?.body?.receiver_id
    ) return sendErrorResponse(res, 400, "Incomplete information!");

    if (!req?.userId) return sendErrorResponse(res, 400, "Payment initialization failed!");
    const userId = req?.userId;
    const ownerId = req?.body?.receiver_id;

//    const paymentReceiverData = await paymentData.getPaymentInfo(req?.body?.receiver_id);
//    if (!paymentReceiverData) return sendErrorResponse(res,404,"Owner has no patment information!");

    const {title,description,amount,currency} = req?.body;

    const payee = await getUser(userId);
    if (!payee) return sendErrorResponse(res, 400, "Payment initialization failed!");
    
    const {full_name,phone_number, email} = payee;
    const nameArray = full_name.split(' ');

    const fname = nameArray[0];
    const lname = nameArray.length > 1 ? nameArray[1] : "NA";

    const txsuffix = crypto.randomBytes(8).toString('hex');
    const txReference = `OPRS-${txsuffix}`;

    const response = await axios.post(
        "https://api.chapa.co/v1/transaction/initialize",{
          first_name: fname,
          last_name: lname,
          email: email,
          currency: currency,
          amount: amount,
          tx_ref: txReference,
          phone_number: phone_number,
          callback_url: `https://oprs.vercel.app/payment/verify/${txReference}`,
          return_url: '',
          "customization[title]": title ?? 'Title',
          "customization[description]": description ?? 'Description',
          "subaccounts[id]": "a9dbdf67-603e-4b75-bab3-884cca206ee5"
        },{
        headers : {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${CSK}`,
           }
        },
    );
    await paymentData.createPaymentReference(userId, ownerId, txReference);
    res.status(200).json({ 
        "success" : true,
        "body" : {
            "checkOutLink" : response.data.data,
            "txRef" : txReference
        },
        "message" : "Use this link for checkout!"
    });

    }catch(error){
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");
    }
}

const verifyPayment = async (req, res) =>{
    try {
        const tReference = req?.params?.txref;
        if (!tReference) return sendErrorResponse(res, 400, "Couldn't verify the payment!");

        const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tReference}`,
            {
                headers : {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CSK}`,
                }
            },
        );

        const reference = {
            "first_name" : response.data.data.first_name ?? "",
            "last_name" : response.data.data.last_name ?? "",
            "email" : response.data.data.email ?? "",
            "currency" : response.data.data.currency ?? "",
            "amount" : response.data.data.amount ?? 0,
            "charge" : response.data.data.charge ?? 0,
            "mode" : response.data.data.mode ?? "",
            "method" : response.data.data.method ?? "",
            "type" : response.data.data.type ?? "",
            "status" : response.data.data.status ?? "",
            "reference" : response.data.data.reference ?? "",
            "tReference" : response.data.data.tx_ref ?? "",
            "created_at" : response.data.data.created_at ?? "",
            "updated_at" : response.data.data.updated_at ?? "",
        };

        const result = await paymentData.verifyPaymentReference(reference);

        if(result.affectedRows < 1) return sendErrorResponse(res, 500, "Internal server error!, could not verify the payment!");

        const paymentRefrence = await paymentData.getPaymentReference(tReference);

        await notificationData.createNotification(
            paymentRefrence.tenant_id,
            paymentRefrence.owner_id,
            notificationTypes.PAYMENT,
            "Payment Received",
            `Dear User You have received a payment from ${paymentRefrence.first_name} ${paymentRefrence.last_name} for the amount of ${paymentRefrence.amount} in ${paymentRefrence.currency} with the charge of ${paymentRefrence.charge} with the total of ${paymentRefrence.amount - paymentRefrence.charge} The transaction reference is ${paymentRefrence.reference}. Thank you for using our service!`,
            getDate()
        );

        res.status(200).json({
            "success" : true,
            "message" : "Payment successful",
            "body" : null
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Couldn't verify the payment!");
    }
}

module.exports = {
    createSubAccount,
    deleteSubAccount,
    verifyPayment,
    initialize,
    getPaymentInfo,
    getMyPaymentInfo
}