/**
 * /home — /mypage 로 영구 리다이렉트.
 *
 * 과거 S4 시절 대시보드가 /home 에 있었으나 S7 에서 /mypage (8탭) 로 일원화됨.
 * 기존 북마크·링크를 깨지 않도록 서버 리다이렉트로 유지.
 * 구 대시보드 소스(components/home/*)는 안정화까지 보존.
 */

import { redirect } from 'next/navigation';

export default function HomeRedirect() {
  redirect('/mypage');
}
