// Deployment of this artifact closes legacy real upload; rollback must keep it closed.
export function legacyClosed() {
  return new Response(JSON.stringify({ success: false, code: 'legacy_upload_closed' }), {
    status: 410, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
