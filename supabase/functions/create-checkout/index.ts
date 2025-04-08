
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log the request for debugging
    console.log("Received checkout request");
    
    // Get Stripe key - log error if missing
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      throw new Error("Stripe secret key is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.error("Error getting user:", userError);
      throw new Error("Error getting user");
    }
    
    const user = userData.user;
    console.log("User authenticated:", user.id);

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Check if the request has a body
    const requestBody = await req.json().catch(e => {
      console.error("Error parsing request body:", e);
      throw new Error("Invalid request body");
    });
    
    const { price, existingCustomerId } = requestBody;
    
    if (!price) {
      console.error("No price provided in request body");
      throw new Error("No price provided");
    }

    console.log(`Creating checkout for price: ${price}, existingCustomerId: ${existingCustomerId || 'none'}`);

    let customerId = existingCustomerId;
    
    // If no existing customer ID was provided, try to find or create one
    if (!customerId) {
      console.log(`Looking up or creating customer for user ${user.id} with email ${user.email}`);
      
      try {
        // Check if an existing Stripe customer record exists
        const customersResponse = await stripe.customers.search({
          query: `email:'${user.email}'`,
        });
        
        if (customersResponse && customersResponse.data && customersResponse.data.length > 0) {
          customerId = customersResponse.data[0].id;
          console.log(`Found existing customer: ${customerId}`);
        } else {
          // Create a new customer
          console.log("Creating new Stripe customer");
          const newCustomer = await stripe.customers.create({
            email: user.email,
            metadata: {
              user_id: user.id,
            },
          });
          customerId = newCustomer.id;
          console.log(`Created new customer: ${customerId}`);
        }
      } catch (lookupError) {
        console.error("Error finding/creating Stripe customer:", lookupError);
        throw new Error(`Failed to find or create Stripe customer: ${lookupError.message}`);
      }
    }

    // Create a checkout session
    console.log("Creating checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Calouri Premium",
              description: "Access to all premium features including NutriChat, FoodInsights, and HealthTracker",
            },
            unit_amount: price, // $3.99 -> 399 cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?payment=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?payment=cancelled`,
    });

    console.log(`Created checkout session: ${session.id}, URL: ${session.url}`);

    // Update or create user subscription record to track the Stripe customer ID
    const { error: upsertError } = await supabaseClient
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        // Don't set is_active to true yet - will be updated by webhook
        updated_at: new Date().toISOString(),
      });
      
    if (upsertError) {
      console.error("Error updating user subscription record:", upsertError);
      // Continue anyway, as this isn't critical for checkout
    } else {
      console.log("Updated user subscription record");
    }

    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
