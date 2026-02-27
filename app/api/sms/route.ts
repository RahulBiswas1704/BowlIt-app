import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing FAST2SMS_API_KEY' }, { status: 500 });
    }

    const body = await request.json();
    let phone = body.phone || body.sms?.phone;
    let message = body.message || body.sms?.message;
    const directOtp = body.otp || body.sms?.otp;

    // 1. Extract OTP
    let otp = directOtp ? String(directOtp) : (message?.match(/\d{6}/)?.[0] || null);

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

    /** * ROUTE SELECTION:
     * 'otp' -> Most reliable but requires Website Verification (The 996 error).
     * 'q'   -> Quick SMS. Try this if 'otp' menu is missing. Use 'message' instead of variables.
     * 'dlt' -> Professional route, requires DLT registration.
     */
    const useQuickRoute = true; // SET THIS TO TRUE IF OTP ROUTE FAILS

    let fast2smsUrl = "";
    
    if (useQuickRoute) {
      // Quick SMS Route (Experimental fallback)
      const encodedMsg = encodeURIComponent(`Your BowlIt verification code is ${otp}. Please do not share this with anyone.`);
      fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodedMsg}&flash=0&numbers=${cleanPhone}`;
    } else {
      // Standard OTP Route
      fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`;
    }

    const response = await fetch(fast2smsUrl, { method: 'GET' });
    const result = await response.json();

    if (result.return === true) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Fast2SMS Error:", result);
      return NextResponse.json({ 
        error: 'Fast2SMS Rejected', 
        details: result.message,
        code: result.status_code 
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
