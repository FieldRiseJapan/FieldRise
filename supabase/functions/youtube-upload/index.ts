import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return Response.json(
        { success: false, error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    // ─────────────────────────────
    // FieldRise 専用認証
    // ─────────────────────────────
    const uploadSecret = Deno.env.get("YOUTUBE_UPLOAD_SECRET");
    const providedSecret = req.headers.get("x-fieldrise-upload-secret");

    if (!uploadSecret) {
      console.error("YOUTUBE_UPLOAD_SECRET is not configured.");

      return Response.json(
        { success: false, error: "Server authentication is not configured." },
        { status: 500 }
      );
    }

    if (!providedSecret || providedSecret !== uploadSecret) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ─────────────────────────────
    // Server configuration
    // ─────────────────────────────
    const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
    const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret || !supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { success: false, error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // ─────────────────────────────
    // Refresh Token取得
    // ─────────────────────────────
    const { data: tokenData, error: tokenError } = await supabase
      .from("youtube_oauth_tokens")
      .select("refresh_token")
      .eq("id", 1)
      .single();

    if (tokenError || !tokenData?.refresh_token) {
      console.error("YouTube refresh token could not be loaded.");

      return Response.json(
        { success: false, error: "YouTube authorization is not configured." },
        { status: 500 }
      );
    }

    // ─────────────────────────────
    // Google Access Token更新
    // ─────────────────────────────
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("Google token refresh failed:", tokenResponse.status);

      return Response.json(
        { success: false, error: "YouTube authentication refresh failed." },
        { status: 500 }
      );
    }

    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token;

    if (!accessToken) {
      return Response.json(
        { success: false, error: "Access token was not received." },
        { status: 500 }
      );
    }

    // ─────────────────────────────
    // 動画・タイトル・説明を受信
    // ─────────────────────────────
    const formData = await req.formData();

    const video = formData.get("video");
    const titleValue = formData.get("title");
    const descriptionValue = formData.get("description");

    if (!(video instanceof File)) {
      return Response.json(
        { success: false, error: "Video file is required." },
        { status: 400 }
      );
    }

    const title =
      typeof titleValue === "string" && titleValue.trim()
        ? titleValue.trim().slice(0, 100)
        : "FieldRise YouTube Upload Test";

    const description =
      typeof descriptionValue === "string"
        ? descriptionValue.slice(0, 5000)
        : "FieldRise YouTube API private upload test.";

    // ─────────────────────────────
    // YouTube resumable upload開始
    // private固定
    // ─────────────────────────────
    const metadata = {
      snippet: {
        title,
        description,
        categoryId: "10",
      },
      status: {
        privacyStatus: "private",
        selfDeclaredMadeForKids: false,
      },
    };

    const initResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status&notifySubscribers=false",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(video.size),
          "X-Upload-Content-Type": video.type || "video/mp4",
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();

      console.error(
        "YouTube upload initialization failed:",
        initResponse.status,
        errorText.slice(0, 500)
      );

      return Response.json(
        {
          success: false,
          error: "YouTube upload initialization failed.",
          status: initResponse.status,
        },
        { status: 500 }
      );
    }

    const uploadUrl = initResponse.headers.get("location");

    if (!uploadUrl) {
      return Response.json(
        { success: false, error: "YouTube upload URL was not returned." },
        { status: 500 }
      );
    }

    // ─────────────────────────────
    // 動画本体をYouTubeへ送信
    // ─────────────────────────────
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": video.type || "video/mp4",
        "Content-Length": String(video.size),
      },
      body: video.stream(),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();

      console.error(
        "YouTube video upload failed:",
        uploadResponse.status,
        errorText.slice(0, 500)
      );

      return Response.json(
        {
          success: false,
          error: "YouTube video upload failed.",
          status: uploadResponse.status,
        },
        { status: 500 }
      );
    }

    const result = await uploadResponse.json();

    console.log("YouTube private upload succeeded.");

    return Response.json({
      success: true,
      message: "FieldRise YouTube private upload succeeded.",
      videoId: result.id ?? null,
      privacyStatus: "private",
    });
  } catch (err) {
    console.error(
      "YouTube upload function error:",
      err instanceof Error ? err.message : "unknown error"
    );

    return Response.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
});