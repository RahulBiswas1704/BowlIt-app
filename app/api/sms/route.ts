import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Log entry for debugging in Vercel/Production logs
  console.log("SMS Hook received a request");

  try {
    // 1. Validate Environment Variable
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: FAST2SMS_API_KEY is missing in environment variables.");
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    // 2. Parse and Validate Request Body
    // We use a broader type to handle variations in Supabase Hook payloads
    const body = await request.json();
    console.log("Received Hook Payload:", JSON.stringify(body));

    // Supabase Hooks can send data at the root or nested in an 'sms' object
    // depending on whether you configured the custom payload template.
    let phone = body.phone || body.sms?.phone;
    let message = body.message || body.sms?.message;

    // Fallback: If Supabase sends 'otp' directly (some hook versions do)
    const directOtp = body.otp || body.sms?.otp;

    if (!phone || (!message && !directOtp)) {
      console.error("MISSING DATA: Phone or message not found in payload.");
      return NextResponse.json({ 
        error: 'Phone or message missing in request',
        received_keys: Object.keys(body)
      }, { status: 400 });
    }

    // 3. Extract or use the 6-digit OTP
    let otp: string | null = null;
    
    if (directOtp) {
      otp = String(directOtp);
    } else if (typeof message === 'string') {
      const otpMatch = message.match(/\d{6}/);
      otp = otpMatch ? otpMatch[0] : null;
    }

    if (!otp) {
      console.error("OTP EXTRACTION FAILED: Content was:", message || "Empty");
      return NextResponse.json({ error: 'OTP not found in message template' }, { status: 400 });
    }

    // 4. Format Phone Number for Fast2SMS (Indian 10-digit format)
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      console.error("INVALID PHONE:", phone);
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    console.log(`Sending OTP ${otp} to ${cleanPhone} via Fast2SMS`);

    // 5. Call Fast2SMS (OTP Route)
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`;

    const response = await fetch(fast2smsUrl, {
      method: 'GET',
      headers: { "cache-control": "no-cache" }
    });

    const result = await response.json();

    if (result.return === true) {
      console.log("Fast2SMS success:", result.message);
      return NextResponse.json({ success: true });
    } else {
      console.error("Fast2SMS Provider Rejected Request:", result);
      return NextResponse.json({ 
        error: 'Fast2SMS Provider Error', 
        details: result.message || "Request failed" 
      }, { status: 500 });
    }

  } catch (error: any) {
    // This catches the TypeError you saw and logs it with context
    console.error('INTERNAL BRIDGE ERROR:', error.message);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
