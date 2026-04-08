/**
 * /learning — 폐지됨 (S5 결정)
 * 마이페이지 챗봇관리 탭으로 통합
 */
import { redirect } from 'next/navigation';

export default function LearningPage() {
  redirect('/mypage');
}
