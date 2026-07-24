import { getPayload } from "payload";
import config from "../payload.config";

const payload = await getPayload({ config });
const alt = "김세규 부동산 프로필";
const existing = await payload.find({ collection: "media", where: { alt: { equals: alt } }, limit: 1, depth: 0, overrideAccess: true });
let profileImage = existing.docs[0];

if (!profileImage) {
  const source = "https://pub-8ca6b7121e244bc5a6e95146a35297bf.r2.dev/legacy/wordpress/uploads/2023/07/%EA%B9%80%EC%84%B8%EA%B7%9C-%EB%B6%80%EB%8F%99%EC%82%B0-%EC%9C%A0%ED%8A%9C%EB%B8%8C-%EB%A1%9C%EA%B3%A0-%EC%82%AC%EC%A7%84-875x1024.jpg";
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Profile image download failed: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  profileImage = await payload.create({ collection: "media", data: { alt }, file: { data, mimetype: response.headers.get("content-type") || "image/jpeg", name: "kim-sekyu-profile.jpg", size: data.length }, overrideAccess: true });
}

await payload.updateGlobal({
  slug: "homepage",
  overrideAccess: true,
  data: {
    hero: { eyebrow: "AUSTIN GRACE REALTY LLC", heading: "집을 찾는 일,", emphasis: "삶을 이해하는 일부터.", description: "오스틴과 센트럴 텍사스에서 20년의 경험으로, 당신의 다음 주소를 함께 찾습니다.", primaryLabel: "매물 검색하기", primaryHref: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", secondaryLabel: "상담 문의하기", secondaryHref: "mailto:kimsekyu@gmail.com", sideNote: "A considered approach\nto Austin real estate." },
    introduction: { eyebrow: "LOCAL KNOWLEDGE, LASTING GUIDANCE", heading: "오스틴의 변화와\n당신의 기준을", emphasis: "모두 읽습니다.", description: "김세규 부동산은 주거용·상업용 매매와 임대, 부동산 관리까지 폭넓게 돕습니다. 시장의 숫자만이 아니라, 동네의 리듬과 가족의 다음 장까지 살펴봅니다.", linkLabel: "김세규 부동산 소개", linkHref: "/agent", stats: [{ value: "20+", label: "Years in Austin real estate" }, { value: "2005", label: "Serving Central Texas since" }, { value: "1:1", label: "Personal, full-service guidance" }] },
    services: { eyebrow: "HOW WE HELP", cards: [{ title: "주택 매매", description: "단독주택, 콘도, 타운홈. 생활 방식에 맞는 선택을 함께 정리합니다.", linkLabel: "시장 정보 보기", linkHref: "/news/austin-real-estate" }, { title: "상업용 부동산", description: "상가, 오피스, 토지와 아파트까지. 더 큰 계획을 위한 든든한 파트너가 됩니다.", linkLabel: "부동산 정보 보기", linkHref: "/news/property-info" }, { title: "정착 & 학군", description: "학교와 생활권, 지역 소식까지. 오스틴에서의 새로운 시작을 설계합니다.", linkLabel: "교육·학군 보기", linkHref: "/school" }] },
    newsSection: { eyebrow: "FROM AUSTIN", heading: "새로운 지역 소식", allLinkLabel: "모든 소식 보기", allLinkHref: "/news", readLabel: "조회", articleLinkLabel: "Read story", emptyStateLabel: "Migration in progress", emptyCardTitles: [{ title: "오스틴의 시장을 읽는 새로운 방법" }, { title: "센트럴 텍사스, 다음 성장의 중심" }, { title: "좋은 동네를 고르는 기준" }] },
    contact: { eyebrow: "LET'S TALK", heading: "오스틴에서의\n다음 장을 시작해 볼까요?", introduction: "오스틴 및 라운드락 인근 지역 (센트락 텍사스 지역) 의 각종 부동산 중개 서비스를 하고 있습니다. 김세규 부동산은 단독 주택, 타운홈, 다세대 주택, 상업용 부동산 (상가, 아파트, 대지, 오피스, 빌딩) 소개 및 매매, 렌트, 리스, 부동산 관리 등의 일을 합니다.", phone: "512.947.5599", email: "kimsekyu@gmail.com", profileImage: profileImage.id, profileName: "김세규 · REALTOR® / Broker", profileCaption: "2005년부터 풀타임으로 일해 온 텍사스 어스틴의 김세규에게 연락 주세요." },
    footer: { kicker: "AUSTIN · TEXAS", brand: "김세규 부동산", company: "Austin Grace Realty LLC\nAustin, Round Rock & Central Texas", copyright: "© {year} Kim Sekyu Real Estate" },
  },
});

console.log(`Homepage global seeded; profile media ID: ${profileImage.id}`);
