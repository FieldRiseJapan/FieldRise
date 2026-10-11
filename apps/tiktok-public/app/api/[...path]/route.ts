import {handle} from '../../../lib/server';
export const dynamic='force-dynamic';
async function route(request:Request,context:{params:Promise<{path:string[]}>}){return handle(request,(await context.params).path);}
export {route as GET,route as POST,route as PUT,route as DELETE};
