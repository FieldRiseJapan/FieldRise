import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'FieldRise Creator Studio',description:'Prepare your photos and videos, then finish your post in TikTok.',icons:{icon:'/icon.jpg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body><header><a className="brand" href="/"><img src="/icon.jpg" alt=""/>FieldRise <span>Creator Studio</span></a><nav><a href="/studio">Studio</a><a href="/support">Support</a></nav></header>{children}<footer><span>FieldRise Creator Studio</span><a href="/terms">利用規約 / Terms</a><a href="/privacy">Privacy</a><a href="/support">Support</a></footer></body></html>}
