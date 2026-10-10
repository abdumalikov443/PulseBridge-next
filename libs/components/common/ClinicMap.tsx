import React, { useEffect, useRef, useState } from 'react';
import { KAKAO_MAP_KEY, kakaoMapUrl, naverMapUrl } from '../../maps';
import Icon from '../ui/Icon';

declare global {
	interface Window {
		kakao?: any;
	}
}

const SDK_ID = 'kakao-map-sdk';

// loads the Kakao Maps SDK once (only when a JavaScript key is set)
const loadKakao = (): Promise<any> =>
	new Promise((resolve, reject) => {
		if (window.kakao?.maps?.services) return resolve(window.kakao);
		let script = document.getElementById(SDK_ID) as HTMLScriptElement | null;
		if (!script) {
			script = document.createElement('script');
			script.id = SDK_ID;
			script.async = true;
			script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services&autoload=false`;
			document.head.appendChild(script);
		}
		script.addEventListener('load', () => window.kakao.maps.load(() => resolve(window.kakao)));
		script.addEventListener('error', reject);
	});

// finds the address (or, failing that, the clinic name) and returns its coordinates
const locate = (kakao: any, address: string, name: string): Promise<any | null> =>
	new Promise((resolve) => {
		const OK = kakao.maps.services.Status.OK;
		new kakao.maps.services.Geocoder().addressSearch(address, (result: any[], status: string) => {
			if (status === OK && result[0]) return resolve(new kakao.maps.LatLng(result[0].y, result[0].x));
			new kakao.maps.services.Places().keywordSearch(`${name} ${address}`, (places: any[], placeStatus: string) => {
				resolve(placeStatus === OK && places[0] ? new kakao.maps.LatLng(places[0].y, places[0].x) : null);
			});
		});
	});

interface ClinicMapProps {
	address: string;
	name: string;
}

// clinic location inside the page: Kakao map with a marker when the SDK key is set,
// otherwise the Kakao Map search page in an iframe; both open Kakao or Naver Map for directions
const ClinicMap = ({ address, name }: ClinicMapProps) => {
	const mapRef = useRef<HTMLDivElement>(null);
	const [mode, setMode] = useState<'loading' | 'sdk' | 'iframe'>(KAKAO_MAP_KEY ? 'loading' : 'iframe');

	useEffect(() => {
		if (!KAKAO_MAP_KEY || !address) return;
		let active = true;
		loadKakao()
			.then(async (kakao) => {
				const position = await locate(kakao, address, name);
				if (!active) return;
				if (!position || !mapRef.current) return setMode('iframe');
				const map = new kakao.maps.Map(mapRef.current, { center: position, level: 3 });
				new kakao.maps.Marker({ map, position });
				map.setZoomable(false);
				setMode('sdk');
			})
			.catch(() => active && setMode('iframe'));
		return () => {
			active = false;
		};
	}, [address, name]);

	return (
		<div className="pb-map">
			<div className={`pb-map__frame ${mode === 'iframe' ? 'is-iframe' : ''}`}>
				{KAKAO_MAP_KEY && <div ref={mapRef} className="pb-map__canvas" hidden={mode !== 'sdk'} />}
				{mode === 'iframe' && (
					<iframe className="pb-map__iframe" src={kakaoMapUrl(address)} title={`${name} on Kakao Map`} loading="lazy" referrerPolicy="no-referrer" />
				)}
				{/* phones: the Kakao page is too cramped in a frame, so a simple pin card is shown instead */}
				{mode !== 'sdk' && (
					<a href={kakaoMapUrl(address)} target="_blank" rel="noreferrer" className={`pb-map__placeholder ${mode === 'iframe' ? 'is-fallback' : ''}`}>
						<Icon name="pin" size={30} />
						<strong>{address}</strong>
						<span>{mode === 'loading' ? 'Loading map…' : 'Tap to open the map'}</span>
					</a>
				)}
			</div>
			<div className="pb-map__foot">
				<span className="pb-map__address">
					<Icon name="pin" size={16} />
					{address}
				</span>
				<span className="pb-map__links">
					<a href={kakaoMapUrl(address)} target="_blank" rel="noreferrer" className="pb-btn pb-btn--outline pb-btn--sm">
						<Icon name="navigate" size={14} />
						Kakao Map
					</a>
					<a href={naverMapUrl(address)} target="_blank" rel="noreferrer" className="pb-btn pb-btn--light pb-btn--sm">
						Naver Map
					</a>
				</span>
			</div>
		</div>
	);
};

export default ClinicMap;
