"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [connectWalletModal, setConnectWalletModal] = useState(false);

  const handleConnectKaikas = () => {};

  const handleConnectKlip = () => {};

  return (
    <main className="flex flex-col min-w-[360px] font-pretendard min-h-[1047px] py-[50px] px-[30px] justify-center items-center gap-[37px] bg-[#121212]">
      <div className="min-w-[360px] max-w-[1200px] min-h-[368px] max-h-[920px]">
        <Image
          src="/main_image.png"
          alt="main"
          width={4096}
          height={3750}
          quality={100}
        ></Image>
      </div>
      <div className="flex-grow flex-shrink-0 flex-basis-0 py-[20px]">
        <p className="text-white text-center text-sm font-normal leading-[16px]">
          그동안 탑트레이더 카드를 사랑해주셔서 감사합니다.
          <br /> 곧 <span className="font-bold">새로운 스탯 트레이더 카드</span>
          로 돌아오겠습니다.
        </p>
      </div>

      <button
        onClick={() => setConnectWalletModal(true)}
        className="flex flex-col justify-center items-center gap-2 flex-shrink-0 w-[270px] h-[50px] max-w-[386px] p-2 rounded-[10px] bg-gradient-to-r from-[#5EF8F8] via-[#5E9FF8] to-[#A25EF8] text-white text-center text-sm font-normal font-bold leading-normal my-[37px]"
      >
        지갑 연결하기
      </button>
      {/* NFT 보상정책 */}
      <div className="flex flex-col w-full min-w-[300px] max-w-[1028px] py-[40px] justify-center items-start gap-[16px]">
        <span className="font-pretendard text-[20px] font-bold leading-normal bg-clip-text text-transparent bg-gradient-to-r from-[#5EF8F8] via-[#5E9FF8] to-[#A25EF8]">
          NFT 보상정책
        </span>
        <table className="w-full text-xs text-white font-pretendard font-bold">
          <thead>
            <tr className="flex border-b border-white">
              <th className="w-1/4 py-[21px] px-[10px] flex justify-center items-center border-r border-white bg-gradient-to-r from-[#337175] to-[#305B6D]">
                NFT명
              </th>
              <th className="w-1/4 py-[21px] px-[10px] flex justify-center items-center border-r border-white bg-gradient-to-r from-[#305B6D] to-[#2E4A66]">
                최종낙찰가
              </th>
              <th className="w-1/2 py-[11px] flex flex-col justify-center items-center bg-gradient-to-r from-[#2E4866] to-[#68409B]">
                NFT당 보상금액
                <br />
                <span className="text-[10px] font-normal">
                  기준:22.8.20 KLAY 종가[338원]
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="font-normal text-[12px]">
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[4px] border-r border-white">
                모멘텀 스켈퍼
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                10451
                <span className="text-[10px] font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                353만2438원{" "}
                <span className="text-[10px] font-normal">상당의 암호화폐</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                박리다메
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                6197<span className="text-[10px] font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                209만4586원{" "}
                <span className="text-[10px] font-normal">상당의 암호화폐</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                멘탈리스크
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                6197<span className="text-[10px] font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                189만8208원{" "}
                <span className="text-[10px] font-normal">상당의 암호화폐</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                흑구
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                5424<span className="text-[10px] font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                189만8208원{" "}
                <span className="text-[10px] font-normal">상당의 암호화폐</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                라이노
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                5318<span className="text-[10px] font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                179만7484원{" "}
                <span className="text-[10px] font-normal">상당의 암호화폐</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* wallet connect modal */}
      {connectWalletModal && (
        <div
          onClick={() => setConnectWalletModal(false)}
          className="fixed top-0 left-0 w-full h-full z-50 bg-center bg-lightgray bg-cover bg-no-repeat bg-[url('/modal_background_img.png')] flex justify-center items-center"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="max-w-[600px] w-full min-w-[320px] h-[360px] min-h-[325px] z-50 bg-gradient-to-r from-[#5DE7E7] via-[#5D9DF7] to-[#A05DF7] border border-transparent rounded-[15px] shadow-none mx-[10px]"
          >
            <div className="bg-[#16191F] w-full h-full rounded-[15px] flex flex-col justify-center items-center py-[40px] px-[20px] space-y-[59px]">
              <span className="text-white text-center text-[18px] font-normal leading-normal mx-[40px]">
                Stat NFT를 보유하고 있는 지갑을 선택해주세요.
              </span>
              <div className="flex w-full h-full max-h-[300px] px-[10px] space-x-[20px] items-center">
                <button
                  onClick={() => handleConnectKaikas()}
                  className="flex flex-col justify-center items-center rounded-[10px] bg-[#D9D9D9] h-full w-full space-y-[30px]"
                >
                  <div className="w-[86.202px] h-[71.938px] flex justify-center items-center">
                    <Image
                      src={"/logo_kaikas.png"}
                      width={58.295}
                      height={53.533}
                      alt="kaikas"
                    />
                  </div>
                  <span className="text-[16px] font-[700]">
                    카이카스 연결하기
                  </span>
                </button>
                <button
                  onClick={() => handleConnectKlip()}
                  className="flex flex-col justify-center items-center rounded-[10px] bg-[#D9D9D9] h-full w-full space-y-[30px]"
                >
                  <div className="w-[86.202px] h-[71.938px] flex justify-center items-center">
                    <Image
                      src={"/logo_klip.png"}
                      width={86.202}
                      height={71.938}
                      alt="klip"
                    />
                  </div>
                  <span className="text-[16px] font-[700]">클립 연결하기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
