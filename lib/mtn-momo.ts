import axios from "axios";

const baseUrl = "https://sandbox.momodeveloper.mtn.com"; // change to production when ready

const COLLECTION_SUBSCRIPTION_KEY = process.env.MTN_COLLECTION_KEY!;
const USER_ID = process.env.MTN_USER_ID!;
const API_KEY = process.env.MTN_API_KEY!;

export async function getMtnToken(): Promise<string> {
  const url = `${baseUrl}/collection/token/`;

  const credentials = Buffer.from(`${USER_ID}:${API_KEY}`).toString("base64");

  const res = await axios.post(
    url,
    {},
    {
      headers: {
        "Ocp-Apim-Subscription-Key": COLLECTION_SUBSCRIPTION_KEY,
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  return res.data.access_token;
}

export async function requestMomoPayment(token: string, amount: number, phone: string) {
  const referenceId = crypto.randomUUID();

  const url = `${baseUrl}/collection/v1_0/requesttopay`;
  const body = {
    amount: amount.toFixed(0),
    currency: "RWF",
    externalId: referenceId,
    payer: {
      partyIdType: "MSISDN",
      partyId: phone.replace("+", ""), // example: 25078xxxxxxx
    },
    payerMessage: "Payment for order",
    payeeNote: "E-commerce order",
  };

  await axios.post(url, body, {
    headers: {
      "X-Reference-Id": referenceId,
      "X-Target-Environment": "sandbox",
      "Ocp-Apim-Subscription-Key": COLLECTION_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return referenceId;
}
