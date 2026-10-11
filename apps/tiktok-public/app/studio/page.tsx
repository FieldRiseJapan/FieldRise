import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import Studio from './studio';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();if(!user)return <main className="narrow"><p className="eyebrow">YOUR CREATIVE SPACE</p><h1>Creator Studioへ<br/>ようこそ。</h1><p>ChatGPTアカウントでサインインし、FieldRiseの利用登録へ進みます。TikTokの連携は別の操作です。</p><a className="button" target="_top" href={chatGPTSignInPath('/studio')}>ChatGPTでサインイン / 新規登録</a><p className="muted">素材の保存先はFieldRise専用の環境です。社内の音源・投稿データは含まれません。</p></main>;return <Studio/>}
