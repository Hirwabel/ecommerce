import axios from "axios";

const MTN_BASE_URL = "https://sandbox.momodeveloper.mtn.com/collection/v1_0";
const MTN_SUBSCRIPTION_KEY = process.env.MTN_COLLECTION_KEY;

export const getMtnAccessToken = async (): Promise<string> => {
  const authString = `${MTN_SUBSCRIPTION_KEY}:`;
  const base64Auth = Buffer.from(authString).toString("base64");

  const response = await axios.post(
    `${MTN_BASE_URL}/token/`,
    null,
    {
      headers: {
        Authorization: `Basic ${base64Auth}`,
        "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
      },
    }
  );

  return response.data.access_token;
};

export const requestMomoPayment = async (
  accessToken: string,
  amount: number,
  phoneNumber: string,
  orderId: string,
  currency = "RWF"
) => {
  const response = await axios.post(
    `${MTN_BASE_URL}/requesttopay`,
    {
      amount: amount.toString(),
      currency,
      externalId: orderId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phoneNumber,
      },
      payerMessage: "Payment for your order",
      payeeNote: "E-commerce order",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Reference-Id": orderId,
        "X-Target-Environment": "sandbox", // change to "mtnrwanda" for production
        "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
