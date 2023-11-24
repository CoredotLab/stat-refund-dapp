"use client";

import Image from "next/image";
import { useState } from "react";
import Caver from "caver-js";
import { isMobile } from "react-device-detect";
import axios from "axios";

declare global {
  interface Window {
    klip: any;
    klaytn: any;
  }
}

// klip
const bappName = "STAT NFT REFUND";
const successLink = "https://stat-refund-dapp.vercel.app/";
const failLink = "https://stat-refund-dapp.vercel.app/";

enum KlipActionType {
  AUTH = "auth",
  SEND_CARD = "send_card",
}

enum ConnectWalletType {
  KAIKAS = "kaikas",
  KLIP = "klip",
  NONE = "none",
}

const KLAYTN_ENNODE_MAINNET = "https://public-en-cypress.klaytn.net";
const KLAYTN_ENNODE_BAOBAB = "https://public-en-baobab.klaytn.net";

export default function Home() {
  const [connectWalletModal, setConnectWalletModal] = useState(false);
  const [account, setAccount] = useState("");
  const [caver, setCaver] = useState<Caver>();
  const [klipRequestKey, setKlipRequestKey] = useState("");
  const [connectWalletType, setConnectWalletType] = useState<ConnectWalletType>(
    ConnectWalletType.NONE
  );
  const [refundModal, setRefundModal] = useState(false);

  const handleConnectKaikas = async () => {
    // 모바일에서는 안됨
    if (isMobile) {
      alert("카이카스는 모바일에서 지원하지 않습니다.");
      return;
    }

    // kaikas 있는지 확인
    if (window.klaytn) {
      const kaikas = window.klaytn;
      // kaikas가 설치되어 있지 않으면 설치 페이지로 이동
      if (!kaikas.isKaikas) {
        handleNotInstalledKaikas();
      } else {
        // kaikas가 설치되어 있으면 지갑 연결
        try {
          const accounts = await kaikas.enable();
          const account = accounts[0];
          // networkVersion: 8217. 아닐 경우 네트워크 변경
          if (kaikas.networkVersion !== "8217") {
            kaikas.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x2019" }],
            });
          }
          setAccount(account);

          kaikas.on("accountsChanged", (accounts: any) => {
            const account = accounts[0];
            setAccount(account);
          });

          const caver = new Caver(kaikas);
          setCaver(caver);
          setConnectWalletModal(false);
          setConnectWalletType(ConnectWalletType.KAIKAS);
          setRefundModal(true);
        } catch (error: any) {
          console.error(error);
          const { code } = error;
          if (code === -32603) {
            alert("지갑 연결을 취소하셨습니다.");
          }
        }
      }
    } else {
      // kaikas가 설치되어 있지 않으면 설치 페이지로 이동
      handleNotInstalledKaikas();
    }
  };

  const handleNotInstalledKaikas = () => {
    window.open(
      "https://chrome.google.com/webstore/detail/kaikas/jblndlipeogpafnldhgmapagcccfchpi"
    );
    alert("카이카스를 설치해주세요.");
    setConnectWalletModal(false);
  };

  const handleConnectKlip = async () => {
    if (!isMobile) {
      alert("클립은 모바일에서만 지원합니다.");
      return;
    }

    const prepareUrl = "https://a2a-api.klipwallet.com/v2/a2a/prepare";

    try {
      let requestKeyTmp = "";
      const response = await axios
        .post(
          "https://a2a-api.klipwallet.com/v2/a2a/prepare",
          {
            bapp: { name: "My BApp" },
            callback: {
              success: "mybapp://klipwallet/success",
              fail: "mybapp://klipwallet/fail",
            },
            type: "auth",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          const { request_key } = res.data;
          if (!request_key) {
            alert("클립 지갑 연결을 실패했습니다.1");
            throw new Error("클립 지갑 연결을 실패했습니다.");
          }
          setKlipRequestKey(request_key);
          requestKeyTmp = request_key;
        })
        .catch((err: any) => {
          console.error(err);
        });

      // eoa 요청
      const resultCheckInterval = setInterval(() => {
        checkKlipAuthResult(requestKeyTmp)
          .then((res) => {
            clearInterval(resultCheckInterval);
          })
          .catch((err) => {
            console.error("인증 결과 확인 중 오류 발생:", err);
          });
      }, 3000);

      // deep link
      requestKlipDeeplink(requestKeyTmp);
    } catch (error) {
      console.error(error);
    }
  };

  const requestKlipDeeplink = (requestKey: string) => {
    const deeplinkUrl = `kakaotalk://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${requestKey}`;

    window.location.href = deeplinkUrl;
  };

  const checkKlipAuthResult = async (requestKey: string) => {
    console.log("checkKlipAuthResult", requestKey);
    if (!requestKey) {
      console.log("requestKey is null");
      return;
    }
    console.log("requestKey is not null");
    try {
      const response = await axios
        .get(
          `https://a2a-api.klipwallet.com/v2/a2a/result?request_key=${requestKey}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          console.log("res", res);
          if (res.status !== 200) {
            alert("클립 지갑 연결을 실패했습니다.");
            throw new Error("클립 지갑 연결을 실패했습니다.");
          }

          const result = res.data;
          if (!result) {
            alert("클립 지갑 연결을 실패했습니다.");
            throw new Error("클립 지갑 연결을 실패했습니다.");
          }

          if (result.status === "completed") {
            const eoa = result.result?.klaytn_address;
            if (!eoa) {
              alert("클립 지갑 연결을 실패했습니다.3");
              throw new Error("클립 지갑 연결을 실패했습니다.");
            }
            alert(`클립 지갑 연결에 성공했습니다. 지갑주소: ${eoa}`);
            setAccount(eoa);
            setConnectWalletModal(false);
            setConnectWalletType(ConnectWalletType.KLIP);
            const caver = new Caver(KLAYTN_ENNODE_MAINNET);
            setCaver(caver);
            setRefundModal(true);
            return result;
          } else {
            console.debug("인증 대기 중 또는 실패:", result);
            return;
          }
        })
        .catch((err: any) => {
          console.error(err);
          return err;
        });
    } catch (error) {
      console.error("인증 결과 확인 중 오류 발생:", error);
      return error;
    }
  };

  return (
    <main className="flex flex-col min-w-[360px] w-full font-pretendard min-h-[1047px] py-[50px] px-[30px] gap-[10px] justify-center items-center bg-[#121212]">
      <div className="min-w-[360px] w-full max-w-[1000px] min-h-[368px] max-h-[920px]">
        <Image
          src="/main_image2.png"
          alt="main"
          width={4096}
          height={3750}
          quality={100}
        ></Image>
      </div>
      <div className="w-full flex items-center justify-center py-[20px]">
        <p className="text-white text-center text-sm font-normal leading-[16px]">
          그동안 탑트레이더 카드를 사랑해주셔서 감사합니다.
          <br /> 곧 <span className="font-bold">새로운 스탯 트레이더 카드</span>
          로 돌아오겠습니다.
        </p>
      </div>

      <button
        onClick={() => setConnectWalletModal(true)}
        className="flex flex-col justify-center items-center flex-shrink-0 w-[270px] h-[50px] max-w-[386px] p-2 rounded-[10px] bg-gradient-to-r from-[#47A9B1] via-[#4171A0] to-[#A25EF8] text-white text-center text-sm font-normal font-bold leading-normal my-[20px]"
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
          <tbody className="font-normal text-[11px]">
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[4px] border-r border-white">
                모멘텀 스켈퍼
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                10451
                <span className="ml-1 font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                353만2438원{" "}
                <span className="ml-1 font-normal">상당의 KLAY</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                박리다메
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                6197<span className="ml-1 font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                209만4586원{" "}
                <span className="ml-1 font-normal">상당의 KLAY</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                멘탈리스크
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                5616<span className="ml-1 font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                189만8208원{" "}
                <span className="ml-1 font-normal">상당의 KLAY</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                흑구
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                5424<span className="ml-1 font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                183만3312원{" "}
                <span className="ml-1 font-normal">상당의 KLAY</span>
              </td>
            </tr>
            <tr className="flex border-b border-white">
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                라이노
              </td>
              <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                5318<span className="ml-1 font-normal">KLAY</span>
              </td>
              <td className="w-1/2 flex justify-center items-center py-[10px]">
                179만7484원{" "}
                <span className="ml-1 font-normal">상당의 KLAY</span>
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
      {/* wallet connect modal */}
      {refundModal && (
        <div
          onClick={() => setRefundModal(false)}
          className="fixed top-0 left-0 w-full h-full z-50 bg-center bg-lightgray bg-cover bg-no-repeat bg-[url('/modal_background_img.png')] flex justify-center items-center"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="max-w-[600px] w-full min-w-[320px] h-[360px] min-h-[325px] z-50 bg-gradient-to-r from-[#5DE7E7] via-[#5D9DF7] to-[#A05DF7] border border-transparent rounded-[15px] shadow-none mx-[10px]"
          >
            <div className="bg-[#16191F] w-full h-full rounded-[15px] flex flex-col justify-center items-center py-[40px] px-[20px] space-y-[59px]"></div>
          </div>
        </div>
      )}
    </main>
  );
}
