export function sendBlocked(me){return !!me?.deleting||me?.sendGate?.allowed!==true;}
