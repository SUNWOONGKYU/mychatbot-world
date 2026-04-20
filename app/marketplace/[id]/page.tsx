/**
 * /marketplace/[id] — /skills/[id] 로 영구 리다이렉트.
 *
 * S4 시절 상세 페이지가 /marketplace/[id] 에 있었으나 S7 에서 /skills/[id] 로 일원화.
 * 구 링크·북마크 보존용으로 파라미터 전달 redirect 만 남김.
 */
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MarketplaceDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/skills/${id}`);
}
