import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);

    const error = url.searchParams.get("error");
    if (error) {
      return new Response("YouTube authorization failed.", {
        status: 400,
      });
    }

    const code = url.searchParams.get("code");

    if (!code) {
      return new Response("Authorization code was not received.", {
        status: 400,
      });
    }

    const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
    const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (
      !clientId ||
      !clientSecret ||
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return new Response("Required server configuration is missing.", {
        status: 500,
      });
    }

    const redirectUri =
      "https://nmkcjtrllzkwjxmjromw.supabase.co/functions/v1/youtube-oauth-callback";

    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "Google OAuth token exchange failed:",
        tokenResponse.status
      );

      return new Response(
        "YouTube authorization failed during token exchange.",
        { status: 500 }
      );
    }

    const tokens = await tokenResponse.json();

    if (!tokens.refresh_token) {
      return new Response(
        "Authorization succeeded, but no refresh token was returned.",
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { error: dbError } = await supabase
      .from("youtube_oauth_tokens")
      .upsert(
        {
          id: 1,
          refresh_token: tokens.refresh_token,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (dbError) {
      console.error("Failed to store YouTube OAuth token.");

      return new Response(
        "YouTube authorization succeeded, but secure token storage failed.",
        { status: 500 }
      );
    }

    console.log("YouTube OAuth completed and token stored.");

    return new Response(
      "FieldRise YouTube authorization succeeded. Token stored securely.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
  } catch (err) {
    console.error(
      "YouTube OAuth callback error:",
      err instanceof Error ? err.message : "unknown error"
    );

    return new Response(
      "FieldRise YouTube authorization failed.",
      { status: 500 }
    );
  }
});