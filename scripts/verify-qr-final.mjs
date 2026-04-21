// 프로덕션 배포된 qr-image.tsx 와 동일한 옵션(margin:4, ecc:H)으로 생성 → jsQR 디코드
// + 실제 mypage 에서 카드 확장해 렌더된 QR 캡처 시도 (보조)
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { writeFileSync } from 'fs';

const testUrls = [
  'https://mychatbot.world/bot/seonhoegyesa',
  'https://mychatbot.world/bot/honggildong',
  'https://mychatbot.world/bot/bot_mo83mh1h_rzeznd',
];

let passed = 0;
for (const url of testUrls) {
  // qr-image.tsx 와 동일한 옵션
  const buf = await QRCode.toBuffer(url, { type: 'png', width: 92, margin: 4, errorCorrectionLevel: 'H' });
  const png = PNG.sync.read(buf);
  const result = jsQR(new Uint8ClampedArray(png.data.buffer), png.width, png.height);
  writeFileSync(`scripts/final-qr-${testUrls.indexOf(url)}.png`, buf);
  if (result && result.data === url) {
    console.log(`✅ ${url} → 디코드 성공 (${png.width}x${png.height})`);
    passed++;
  } else {
    console.log(`❌ ${url} → 실패`);
  }
}

console.log(`\n총 ${passed}/${testUrls.length} 통과`);
process.exit(passed === testUrls.length ? 0 : 1);
