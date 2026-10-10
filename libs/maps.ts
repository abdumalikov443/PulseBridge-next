// Korean map services for clinic addresses (Kakao Map first, Naver Map as a second choice)
export const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '';

export const kakaoMapUrl = (address: string) => `https://map.kakao.com/link/search/${encodeURIComponent(address)}`;

export const naverMapUrl = (address: string) => `https://map.naver.com/p/search/${encodeURIComponent(address)}`;
