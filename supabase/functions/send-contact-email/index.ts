import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
console.log("Resend API Key present:", !!resendApiKey);
console.log("Resend API Key length:", resendApiKey ? resendApiKey.length : 0);

const resend = new Resend(resendApiKey);
const adminEmail = "markmoran.moran2@googlemail.com"; // Updated admin email

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Contact form submission handler called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const requestBody = await req.text();
    console.log("Request body:", requestBody);
    
    let data: ContactFormData;
    try {
      data = JSON.parse(requestBody);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body: " + String(parseError) 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, message } = data;

    if (!name || !email || !message) {
      console.error("Missing required fields:", { name, email, message });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields",
          data: { name: !!name, email: !!email, message: !!message }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing contact form submission from ${name} (${email})`);
    console.log("Message content:", message);
    console.log("Will send admin notification to:", adminEmail);

    try {
      console.log("Testing Resend API connection...");
      const resendTest = await resend.emails.send({
        from: "Test <onboarding@resend.dev>",
        to: ["test@example.com"],
        subject: "Test Email",
        html: "<p>This is a test email</p>",
        text: "This is a test email"
      });
      console.log("Resend test response:", resendTest);
    } catch (testError) {
      console.error("Resend API test failed:", testError);
    }

    console.log("Sending admin notification email to:", adminEmail);
    let adminEmailResponse;
    try {
      adminEmailResponse = await resend.emails.send({
        from: "Calouri Contact <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `New contact form submission from ${name}`,
        html: `
          <h1>New Contact Form Submission</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
        text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`
      });
      console.log("Admin email response:", adminEmailResponse);
    } catch (emailError) {
      console.error("Error sending admin email:", emailError);
      console.error("Error details:", JSON.stringify(emailError));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send admin notification: " + String(emailError),
          errorDetails: JSON.stringify(emailError)
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending user confirmation email...");
    let userEmailResponse;
    try {
      userEmailResponse = await resend.emails.send({
        from: "Calouri <onboarding@resend.dev>",
        to: [email],
        subject: "We've received your message",
        html: `
          <h1>Thank you for contacting us, ${name}!</h1>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p>For your reference, here's what you sent us:</p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p>Best regards,<br>The Calouri Team</p>
        `,
        text: `Thank you for contacting us, ${name}!\n\nWe have received your message and will get back to you as soon as possible.\n\nFor your reference, here's what you sent us:\n\n${message}\n\nBest regards,\nThe Calouri Team`
      });
      console.log("User email response:", userEmailResponse);
    } catch (emailError) {
      console.error("Error sending user email:", emailError);
      console.error("Error details:", JSON.stringify(emailError));
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: "Admin notification sent but failed to send user confirmation: " + String(emailError),
          errorDetails: JSON.stringify(emailError),
          adminResponse: adminEmailResponse,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Emails sent successfully!");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Your message has been sent successfully!",
        adminEmailResponse,
        userEmailResponse
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An error occurred while sending your message",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
