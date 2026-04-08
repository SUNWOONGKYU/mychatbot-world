/**
 * /marketplace — /skills로 통합 (S5 결정)
 * 4대 메뉴의 Skills가 공식 경로
 */
import { redirect } from 'next/navigation';

export default function MarketplacePage() {
  redirect('/skills');
}
