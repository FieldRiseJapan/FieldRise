# English application narrative — review draft
**NOT FOR SUBMISSION. The current internal-only purpose is BLOCKED against the published review criteria.**
The current Portal narrative has not been retrieved. This is a new factual draft, not a saved Portal revision.

## Short description
Internal FieldRise tool for preparing MP4 videos and testing TikTok account connection and sharing workflows.

## App review narrative
FieldRise Creator Studio is currently a web tool for internal FieldRise use. It is not currently provided as a public service for external creators. A possible future public release is a plan, not an existing feature or user population.

The web interface implements a TikTok Login Kit connection entry point, connected account display, MP4 selection and preview, sharing mode selection, explicit user consent, and API result/status display. The server code contains video Inbox Upload and Direct Post routes. In the inspected implementation, Inbox Upload sends only video source information; captions, privacy settings, and final publication are completed in TikTok. Direct Post allows the user to review the caption/hashtags, available privacy options, interaction settings, and commercial/AI disclosures before sending the request.

This description reflects inspected repository code. Current Production configuration, equivalence with the deployed Supabase version, and recent live verification of all flows remain unconfirmed. Historical Sandbox results are not presented as results of a new demonstration. A new end-to-end recording has not yet been made. Photo and music selection in TikTok's own Studio are not evidence of this application's API integration.

The user.info.basic scope is intended for basic profile information. However, the account display in the inspected frontend/API uses Query Creator Info, which requires video.publish. Separate actual use of user.info.basic must still be verified in the existing OAuth implementation. The video.upload route sends an MP4 to the TikTok inbox for editing in TikTok. The video.publish route implements Direct Post. Actual requested scopes must be confirmed in the Portal.

The present internal-only purpose conflicts with the App Review Guidelines and the Direct Post Intended Use guidance. We do not describe this application as compliant or as a public service. Eligibility of an Upload-only application with this same internal purpose requires clarification from TikTok. If a complete service becomes genuinely available to external creators in the future, the application narrative will be revised to reflect that actual service.

## Feedback response draft
Icon consistency is treated as completed based on verification commit 1467d2192cbf33a0a56425c286879c9bbd82c366. Demo quality and complete scope demonstrations remain unresolved. The existing fieldrise_tiktok_test.mp4 is an eight-second title video and will not be used as the operational review demonstration. Only features actually recorded and verified will be described with timestamps after a new recording is completed.
