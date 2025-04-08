
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No signature provided");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the request body as text
    const body = await req.text();
    
    // Verify the webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log for debugging
    console.log("Received webhook with signature:", signature.substring(0, 20) + "...");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Processing webhook event: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle specific events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        // Get the customer ID from the session
        const customerId = session.customer;
        
        // Log for debugging
        console.log(`Checkout completed. Customer ID: ${customerId}, Subscription ID: ${session.subscription}`);
        
        // Get customer details to find the user ID
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.user_id;
        
        if (!userId) {
          console.error("No user ID in customer metadata");
          break;
        }
        
        console.log(`Checkout completed for user ${userId}, customer ${customerId}`);
        
        // Add or update user subscription record
        const { error } = await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: session.subscription,
            tier: "premium",
            starts_at: new Date().toISOString(),
            is_active: true,
            monthly_usage_count: 0,
            max_monthly_analyses: 100,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Subscription updated successfully for user ${userId}`);
        }
        
        break;
      }
      
      // Handle customer.subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        
        // Get the customer ID from the subscription
        const customerId = subscription.customer;
        
        // Get customer details to find the user ID
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.user_id;
        
        if (!userId) {
          console.error("No user ID in customer metadata");
          break;
        }
        
        console.log(`Subscription updated for user ${userId}, status: ${subscription.status}`);
        
        // Update subscription status - Always set it to active and premium for subscription.created or active status
        const { error } = await supabaseClient
          .from("user_subscriptions")
          .update({
            is_active: subscription.status === "active",
            tier: subscription.status === "active" ? "premium" : "free",
            is_free_trial: false, // Explicitly mark as not a free trial
            updated_at: new Date().toISOString(),
            // Reset usage allowance when subscription is updated
            monthly_usage_count: 0,
            max_monthly_analyses: subscription.status === "active" ? 100 : 10
          })
          .eq("user_id", userId);
        
        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Subscription status updated successfully for user ${userId}`);
        }
        
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        
        // Get the customer ID from the subscription
        const customerId = subscription.customer;
        
        // Get customer details to find the user ID
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.user_id;
        
        if (!userId) {
          console.error("No user ID in customer metadata");
          break;
        }
        
        console.log(`Subscription deleted for user ${userId}`);
        
        // Update subscription status
        const { error } = await supabaseClient
          .from("user_subscriptions")
          .update({
            is_active: false,
            tier: "free",
            ends_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            monthly_usage_count: 0,
            max_monthly_analyses: 10
          })
          .eq("user_id", userId)
          .eq("stripe_subscription_id", subscription.id);
        
        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Subscription marked as inactive for user ${userId}`);
        }
        
        break;
      }
      
      // Also handle payment events to make sure we catch successful payments in test mode
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const customerId = paymentIntent.customer;
        
        if (!customerId) {
          console.error("No customer ID in payment intent");
          break;
        }
        
        // Get customer details to find the user ID
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.user_id;
        
        if (!userId) {
          console.error("No user ID in customer metadata");
          break;
        }
        
        console.log(`Payment succeeded for user ${userId}, customer ${customerId}`);
        
        // Make sure the user subscription is marked as active and not a free trial
        const { error } = await supabaseClient
          .from("user_subscriptions")
          .update({
            is_active: true,
            tier: "premium",
            is_free_trial: false,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);
        
        if (error) {
          console.error("Error updating subscription after payment:", error);
        } else {
          console.log(`Subscription marked as active after payment for user ${userId}`);
        }
        
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
