// このファイルは中身リダイレクトだけだよ
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}