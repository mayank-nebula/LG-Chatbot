import { NextResponse } from 'next/server';
// ⚠️ Update this import to match your actual file structure
// Using runQuery instead of query to avoid your unstable_cache wrapper
import { runQuery } from '@/lib/db'; 

// Force Next.js to never cache this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  // Define your services status object
  const services = {
    database: 'disconnected',
    wordpress: 'disconnected',
  };

  try {
    // ---------------------------------------------------------
    // 1. Check Database (Postgres/MySQL Pool)
    // ---------------------------------------------------------
    await runQuery('SELECT 1', []);
    services.database = 'connected';

    // ---------------------------------------------------------
    // 2. Check WordPress System Status API
    // ---------------------------------------------------------
    // ⚠️ Replace with your actual WordPress domain!
    const WP_URL = 'https://YOUR_WP_DOMAIN.com/wp-json/v1/options/system-status';
    
    const wpResponse = await fetch(WP_URL, {
      method: 'GET',
      cache: 'no-store', // CRITICAL: Forces fetch to bypass Next.js cache
    });

    if (!wpResponse.ok) {
      throw new Error(`WordPress API failed with status: ${wpResponse.status}`);
    }

    // You mentioned "if any result it is ok"
    const wpData = await wpResponse.json();
    if (wpData) {
      services.wordpress = 'connected';
    } else {
      throw new Error('WordPress API returned empty data');
    }

    // ---------------------------------------------------------
    // 3. Return Success (200 OK) if everything passed
    // ---------------------------------------------------------
    return NextResponse.json(
      { 
        status: 'ok', 
        services,
        timestamp: new Date().toISOString() 
      },
      { status: 200 }
    );

  } catch (error: any) {
    // If ANY check fails, catch block catches it and returns 503
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        services, // Shows exactly which service failed (e.g., db connected, wp disconnected)
        message: error.message,
        timestamp: new Date().toISOString() 
      },
      { status: 503 } // 503 Service Unavailable
    );
  }
}
