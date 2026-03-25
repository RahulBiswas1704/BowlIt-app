import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the SERVICE ROLE KEY
// This bypasses RLS and allows interacting with auth.users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET: Fetch all registered users and merge with their Wallet Balances
 */
export async function GET(request: Request) {
    try {
        // 1. Fetch all users from Auth
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) throw usersError;

        // 2. Fetch all wallets
        const { data: walletsData, error: walletsError } = await supabaseAdmin
            .from('wallets')
            .select('*');

        if (walletsError) throw walletsError;

        // 3. Merge data
        const customers = usersData.users.map(user => {
            const wallet = walletsData?.find(w => w.user_id === user.id);

            return {
                id: user.id,
                email: user.email,
                phone: user.user_metadata?.phone || '',
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown User',
                office: user.user_metadata?.office || 'Not Provided',
                balance: wallet?.balance || 0,
                avatar_url: user.user_metadata?.avatar_url || '',
            };
        });

        return NextResponse.json({ customers });
    } catch (error: any) {
        console.error("Admin API GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH: Update a user's metadata (Name, Phone, Office) and Wallet Balance
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, full_name, phone, office, new_balance } = body;

        if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        // 1. Update Auth Metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            user_metadata: { full_name, phone, office }
        });

        if (updateError) throw updateError;

        // 2. Update Wallet Balance if provided
        if (new_balance !== undefined) {
            const { error: walletError } = await supabaseAdmin
                .from('wallets')
                .upsert({ user_id: id, balance: parseFloat(new_balance) });

            if (walletError) throw walletError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin API PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE: Permanently delete a user account
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        // IMPORTANT: PostgreSQL requires deleting child records BEFORE parent records 
        // to avoid Foreign Key Violations. We also must await and check for errors.

        const throwErr = (e: any, step: string) => { if (e) { console.error(`Failed at ${step}:`, e); throw e; } };

        // 1. Delete Feedback (Child of Orders and Users)
        const resFeedback = await supabaseAdmin.from('feedback').delete().eq('user_id', id);
        throwErr(resFeedback.error, 'feedback');

        // 2. Delete Referrals
        await supabaseAdmin.from('referrals').delete().eq('referrer_id', id);
        await supabaseAdmin.from('referrals').delete().eq('referred_id', id);

        // 3. Delete Orders (Child of Users, Parent of Feedback)
        const resOrders = await supabaseAdmin.from('orders').delete().eq('user_id', id);
        throwErr(resOrders.error, 'orders');

        // 4. Delete Independent User Assets
        await supabaseAdmin.from('wallets').delete().eq('user_id', id);
        await supabaseAdmin.from('paused_dates').delete().eq('user_id', id);
        await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', id);
        
        // 5. Delete from Admins (just in case they are an admin)
        await supabaseAdmin.from('admins').delete().eq('id', id);

        // FINALLY: Delete the User from Auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) {
            console.error("Auth Deletion Error:", error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin API DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST: Manually create a user account by the Admin
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { full_name, phone, office, initial_balance } = body;

        if (!full_name || !phone) return NextResponse.json({ error: "Name and Phone required" }, { status: 400 });

        // Generate a dummy email and password since Auth requires email/password or phone OTP
        // but admin bypass allows direct creation. Phone number is the primary key for BowlIt.
        // If phone auth isn't strict, we can just supply the phone.
        const dummyEmail = `user_${Date.now()}@bowlit.manual`;
        const tempPassword = `BowlIt@${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: dummyEmail,
            phone: phone,
            password: tempPassword,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name,
                phone,
                office,
                added_by_admin: true
            }
        });

        if (createError) throw createError;

        // Create Wallet
        const { error: walletError } = await supabaseAdmin
            .from('wallets')
            .insert([{ 
                user_id: newUser.user.id, 
                balance: parseFloat(initial_balance) || 0 
            }]);

        if (walletError) throw walletError;

        return NextResponse.json({ success: true, user: newUser.user });
    } catch (error: any) {
        console.error("Admin API POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
