// Vipps MobilePay eCom v2 API client
// Docs: https://developer.vippsmobilepay.com/docs/APIs/ecom-api/

const BASE_URL = process.env.MOBILEPAY_TEST_MODE === "true"
  ? "https://apitest.vipps.no"
  : "https://api.vipps.no";

function isMobilePayConfigured() {
  return Boolean(
    process.env.MOBILEPAY_CLIENT_ID &&
    process.env.MOBILEPAY_CLIENT_SECRET &&
    process.env.MOBILEPAY_SUBSCRIPTION_KEY &&
    process.env.MOBILEPAY_MERCHANT_SERIAL
  );
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/accessToken/get`, {
    method: "POST",
    headers: {
      "client_id": process.env.MOBILEPAY_CLIENT_ID!,
      "client_secret": process.env.MOBILEPAY_CLIENT_SECRET!,
      "Ocp-Apim-Subscription-Key": process.env.MOBILEPAY_SUBSCRIPTION_KEY!
    }
  });

  if (!res.ok) {
    throw new Error(`MobilePay auth failed: ${res.status}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

type CreatePaymentOptions = {
  orderId: string;
  amountOere: number;
  description: string;
  callbackPrefix: string;
  fallbackUrl: string;
};

type CreatePaymentResult = {
  orderId: string;
  url: string;
};

export async function createMobilePayPayment(
  opts: CreatePaymentOptions
): Promise<CreatePaymentResult> {
  if (!isMobilePayConfigured()) {
    throw new Error("MobilePay is not configured");
  }

  const token = await getAccessToken();
  const merchantSerial = process.env.MOBILEPAY_MERCHANT_SERIAL!;
  const subscriptionKey = process.env.MOBILEPAY_SUBSCRIPTION_KEY!;

  const res = await fetch(`${BASE_URL}/ecomm/v2/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Merchant-Serial-Number": merchantSerial,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      merchantInfo: {
        merchantSerialNumber: merchantSerial,
        callbackPrefix: opts.callbackPrefix,
        fallBack: opts.fallbackUrl,
        isApp: false,
        paymentType: "eComm Regular Payment"
      },
      customerInfo: {},
      transaction: {
        orderId: opts.orderId,
        amount: opts.amountOere,
        timeStamp: new Date().toISOString(),
        description: opts.description,
        skipLandingPage: false
      }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MobilePay payment creation failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<CreatePaymentResult>;
}

export async function captureMobilePayPayment(
  orderId: string,
  amountOere: number
): Promise<void> {
  if (!isMobilePayConfigured()) {
    throw new Error("MobilePay is not configured");
  }

  const token = await getAccessToken();
  const merchantSerial = process.env.MOBILEPAY_MERCHANT_SERIAL!;
  const subscriptionKey = process.env.MOBILEPAY_SUBSCRIPTION_KEY!;

  const res = await fetch(`${BASE_URL}/ecomm/v2/payments/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Merchant-Serial-Number": merchantSerial,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      merchantInfo: { merchantSerialNumber: merchantSerial },
      transaction: { amount: amountOere }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MobilePay capture failed: ${res.status} ${text}`);
  }
}

export { isMobilePayConfigured };
