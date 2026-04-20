/**
 * /marketplace/upload — /skills 로 영구 리다이렉트.
 *
 * S4 시절 스킬 업로드 페이지. 현재 대체 업로드 경로는 별도 구축 예정.
 * 임시로 /skills 목록으로 보낸다.
 */
import { redirect } from 'next/navigation';

export default function MarketplaceUploadRedirect() {
  redirect('/skills');
}
