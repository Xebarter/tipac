# PesaPal Integration Environment Variables

To enable PesaPal payments for tickets, you need to configure the following environment variables in your `.env.local` file:

## Required Environment Variables

```env
# PesaPal API Credentials
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here

# Callback URL for payment completion
PESAPAL_CALLBACK_URL=https://yourdomain.com/payment-complete

# PesaPal IPN ID (obtained after registering your IPN)
PESAPAL_IPN_ID=your_ipn_id_here

# PesaPal Base URL
# For production:
PESAPAL_BASE_URL=https://pay.pesapal.com/v3
# For testing/sandbox:
# PESAPAL_BASE_URL=https://cybqa.pesapal.com/pesapalv3
```

## How to Obtain These Values

1. **Consumer Key & Secret**: Register your application on the PesaPal Merchant Dashboard
2. **Callback URL**: This should point to your payment completion page (`/payment-complete`)
3. **IPN ID**: Register your IPN URL (`/api/pesapal-ipn`) in the PesaPal dashboard and obtain the ID
4. **Base URL**: Use sandbox for testing and production URL for live transactions

## Testing

For testing purposes, use the PesaPal Sandbox environment:
- Dashboard: https://cybqa.pesapal.com/PesapalUI/Dashboard
- Base URL: https://cybqa.pesapal.com/pesapalv3

For production, use:
- Dashboard: https://merchant.pesapal.com/
- Base URL: https://pay.pesapal.com/v3