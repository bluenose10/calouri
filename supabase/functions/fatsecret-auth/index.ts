
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get credentials from Supabase secrets
    const CLIENT_ID = Deno.env.get("FATSECRET_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("FATSECRET_CLIENT_SECRET");
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing FatSecret API credentials in secrets");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing FatSecret API credentials" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Try to get the server IP address (not always possible in Edge Functions)
    let serverIp = "Unknown";
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        serverIp = ipData.ip;
      }
    } catch (ipError) {
      console.log("Could not determine server IP:", ipError);
    }

    console.log(`Authenticating with FatSecret API using Client ID: ${CLIENT_ID.substring(0, 5)}... from server IP: ${serverIp}`);
    
    // Create Basic auth credential
    const authString = `${CLIENT_ID}:${CLIENT_SECRET}`;
    const encodedAuth = btoa(authString);
    
    // Get OAuth token from FatSecret
    const tokenResponse = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedAuth}`,
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'scope': 'basic'  // Basic scope is sufficient for our needs
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`FatSecret OAuth error: ${tokenResponse.status}`, errorText);
      
      // Enhanced IP restriction detection
      if (tokenResponse.status === 403 || errorText.includes("IP") || errorText.includes("unauthorized")) {
        return new Response(
          JSON.stringify({ 
            error: `IP Restriction Error: Your server's IP address (${serverIp}) is not whitelisted in FatSecret.`,
            details: `Please go to https://platform.fatsecret.com, login to your account, go to Account and Settings > IP Restrictions, and add your server's IP address (${serverIp}). Changes may take up to 24 hours to propagate.`,
            serverIp: serverIp
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `FatSecret OAuth error (${tokenResponse.status}): ${errorText}`,
          serverIp: serverIp
        }),
        { 
          status: tokenResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Pass the token response back to the client
    const tokenData = await tokenResponse.json();
    console.log("Successfully obtained FatSecret token, expires in:", tokenData.expires_in);
    
    return new Response(
      JSON.stringify({
        ...tokenData,
        serverIp: serverIp,
        message: "Successfully authenticated with FatSecret API"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in FatSecret authentication:", error);
    
    return new Response(
      JSON.stringify({ 
        error: `Server error: ${error.message || "Unknown error"}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
