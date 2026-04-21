// QR 스캔 가능 여부 프로덕션 실측 — 1) qrcode 생성 PNG 직접 디코드 2) 디코드 성공률
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { readFileSync } from 'fs';

const testUrl = 'https://mychatbot.world/bot/seonhoegyesa';

async function makeAndDecode(opts, label) {
  const buf = await QRCode.toBuffer(testUrl, { type: 'png', ...opts });
  const png = PNG.sync.read(buf);
  const result = jsQR(new Uint8ClampedArray(png.data.buffer), png.width, png.height);
  console.log(`[${label}]`);
  console.log(`  options:`, JSON.stringify(opts));
  console.log(`  size: ${png.width}x${png.height}`);
  console.log(`  decoded:`, result ? 'SUCCESS' : 'FAIL');
  if (result) console.log(`  data:`, result.data);
  return !!result;
}

console.log('\n=== QR 스캔 가능 여부 실측 ===\n');

console.log('[1] 이전 (버그) 옵션 — margin:1, ecc:M @ 144px');
const before = await makeAndDecode({ width: 144, margin: 1, errorCorrectionLevel: 'M' }, 'BEFORE');

console.log('\n[2] 수정 후 옵션 — margin:4, ecc:H @ 144px');
const after = await makeAndDecode({ width: 144, margin: 4, errorCorrectionLevel: 'H' }, 'AFTER');

console.log('\n=== 결과 ===');
console.log(`BEFORE: ${before ? 'PASS' : 'FAIL'}`);
console.log(`AFTER:  ${after ? 'PASS' : 'FAIL'}`);
process.exit(after ? 0 : 1);
