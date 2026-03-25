import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, user_id } = body;

        if (!code || !user_id) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // 1. Find the promo code
        const { data: promoCode, error: promoError } = await supabaseAdmin
            .from('promo_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (promoError || !promoCode) {
            return NextResponse.json({ error: "Invalid or unrecognized promo code." }, { status: 400 });
        }

        // 2. Check if already used
        if (promoCode.is_used) {
            return NextResponse.json({ error: "This promo code has already been redeemed." }, { status: 400 });
        }

        // 3. Mark as used atomically
        const { data: updateData, error: updateError } = await supabaseAdmin
            .from('promo_codes')
            .update({ is_used: true, used_by: user_id, used_at: new Date().toISOString() })
            .eq('id', promoCode.id)
            .eq('is_used', false)
            .select()
            .single();

        if (updateError || !updateData) {
            return NextResponse.json({ error: "Code was already redeemed or could not be processed." }, { status: 400 });
        }

        // 4. Add the amount to the user's wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('user_id', user_id)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json({ error: "Wallet not found for user." }, { status: 400 });
        }

        const newBalance = Number(wallet.balance) + Number(promoCode.amount);

        const { error: walletUpdateError } = await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('user_id', user_id);

        if (walletUpdateError) {
            return NextResponse.json({ error: "Failed to update wallet balance." }, { status: 500 });
        }

        // 5. Log the transaction
        await supabaseAdmin.from('wallet_transactions').insert({
            user_id: user_id,
            amount: promoCode.amount,
            type: 'CREDIT',
            description: `Redeemed Promo Code: ${promoCode.code}`
        });

        return NextResponse.json({ success: true, amount: promoCode.amount, newBalance });

    } catch (err: any) {
        console.error("Redeem API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
