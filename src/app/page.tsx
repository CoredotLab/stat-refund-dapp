"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Caver, { AbiItem } from "caver-js";
import { isMobile } from "react-device-detect";
import axios from "axios";
import { CircularProgress } from "@nextui-org/react";
import { NextUIProvider } from "@nextui-org/react";
import StatNFTABI from "../StatNFTABI.json";

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

type StatNFT = {
  tokenId: number;
  refundAmount: number;
};

const KLAYTN_ENNODE_MAINNET = "https://public-en-cypress.klaytn.net";
const KLAYTN_ENNODE_BAOBAB = "https://public-en-baobab.klaytn.net";
const MAINNET_STAT_NFT_CONTRACT_ADDRESS =
  "0x96e423d5cf07bbd8e13a1cee4fe390dcd4b3fb6b";
const BAOBAB_STAT_NFT_CONTRACT_ADDRESS =
  "0xBd34Ea3FEe2c1F35F0950A8D5D957fF1e02cAC2E";

export default function Home() {
  const [connectWalletModal, setConnectWalletModal] = useState(false);
  const [account, setAccount] = useState("");
  const [caver, setCaver] = useState<Caver>();
  const [klipRequestKey, setKlipRequestKey] = useState("");
  const [connectWalletType, setConnectWalletType] = useState<ConnectWalletType>(
    ConnectWalletType.NONE
  );
  const [refundModal, setRefundModal] = useState(false);
  const [tokens, setTokens] = useState<StatNFT[]>([]);
  const [checkedToken, setCheckedToken] = useState<StatNFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completModal, setCompletModal] = useState(false);

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
          // TODO: networkVersion: 8217. 아닐 경우 네트워크 변경
          // if (kaikas.networkVersion !== "8217") {
          //   await kaikas
          //     .request({
          //       method: "wallet_switchEthereumChain",
          //       params: [{ chainId: "0x2019" }],
          //     })
          //     .then((res: any) => {
          //       console.log("res", res);
          //     })
          //     .catch((err: any) => {
          //       console.error("err", err);
          //       const { code } = err;
          //       if (code === 4001) {
          //         alert("메인넷에서만 환불이 가능합니다.");
          //         throw new Error("메인넷에서만 환불이 가능합니다.");
          //       }
          //     });
          // }
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
          console.error("여기", error);
          const { code } = error;
          if (code === -32603) {
            alert("지갑 연결을 취소하셨습니다.");
          }

          setRefundModal(false);
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

  const handleConnectWalletBtn = () => {
    setConnectWalletModal(true);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-8)}`;
  };

  const handleClickToken = (token: StatNFT) => {
    console.log("handleClickToken", token);
    // 클릭한 token이 이미 선택된 token이면 선택 해제
    if (checkedToken?.tokenId === token.tokenId) {
      setCheckedToken(null);
    } else {
      setCheckedToken(token);
    }
  };

  const getFormattedTokenId = (tokenId: number) => {
    return tokenId.toString().padStart(3, "0");
  };

  useEffect(() => {
    const doAsync = async () => {
      try {
        if (caver && account) {
          const statContract = caver.contract.create(
            StatNFTABI as AbiItem[],
            BAOBAB_STAT_NFT_CONTRACT_ADDRESS
          );
          const tokenBalance = await statContract.methods
            .balanceOf(account)
            .call();
          console.log("tokenBalance", tokenBalance);

          const tokenIds = [];
          for (let i = 0; i < tokenBalance; i++) {
            const tokenId = await statContract.methods
              .tokenOfOwnerByIndex(account, i)
              .call();
            tokenIds.push(tokenId);
          }
          console.log("tokenIds", tokenIds);
          // tokenUri 가져오기
          const tokenUris = [];
          for (let i = 0; i < tokenIds.length; i++) {
            const tokenUri = await statContract.methods
              .tokenURI(tokenIds[i])
              .call();
            tokenUris.push(tokenUri);
          }
          console.log("tokenUris", tokenUris);
          // token URI 에서 attributes[] 에서 trait_type이 "트레이더"의 value 가져오기
          const traders = [];
          for (let i = 0; i < tokenUris.length; i++) {
            const tokenUri = tokenUris[i];
            const response = await axios.get(tokenUri);
            const { attributes } = response.data;
            const trader = attributes.find(
              (attribute: any) => attribute.trait_type === "트레이더"
            );
            traders.push(trader);
          }

          // 모멘텀 스켈퍼 = 10451 KLAY, 박리다메 = 6197 KLAY, 멘탈리스크 = 5616 KLAY, 흑구 = 5424 KLAY, 라이노 = 5318 KLAY
          const refundAmounts = [];
          for (let i = 0; i < traders.length; i++) {
            const trader = traders[i];
            if (trader.value === "모멘텀 스켈퍼") {
              refundAmounts.push(10451);
            } else if (trader.value === "박리다메") {
              refundAmounts.push(6197);
            } else if (trader.value === "멘탈리스크") {
              refundAmounts.push(5616);
            } else if (trader.value === "흑구") {
              refundAmounts.push(5424);
            } else if (trader.value === "라이노") {
              refundAmounts.push(5318);
            } else {
              refundAmounts.push(100);
            }
          }

          // tokenIds, refundAmounts 합치기
          const tokens = [];
          for (let i = 0; i < tokenIds.length; i++) {
            const token = {
              tokenId: tokenIds[i],
              refundAmount: refundAmounts[i],
            };
            tokens.push(token);
          }

          setTokens(tokens);
          console.log("traders", traders);
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (caver && account) {
      doAsync();
    }
  }, [caver, account]);

  return (
    <NextUIProvider>
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
            <br /> 곧{" "}
            <span className="font-bold">새로운 스탯 트레이더 카드</span>로
            돌아오겠습니다.
          </p>
        </div>

        <button
          onClick={() => handleConnectWalletBtn()}
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
                    <span className="text-[16px] font-[700]">
                      클립 연결하기
                    </span>
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
              className="max-w-[600px] w-full min-w-[320px] z-50 bg-gradient-to-r from-[#5DE7E7] via-[#5D9DF7] to-[#A05DF7] rounded-[15px] shadow-none mx-[10px] p-[1px]"
            >
              <div className="bg-[#16191F] w-full rounded-[15px] flex flex-col justify-center items-center pt-[20px] pb-[40px] px-[20px] space-y-[20px]">
                {/* 지갑 */}
                <div
                  className={
                    `h-[24px] w-full flex` +
                    " " +
                    (isMobile ? "justify-center" : "justify-end")
                  }
                >
                  <div className="flex justify-center items-center space-x-[7px] bg-gradient-to-r from-[#5DE7E7] via-[#5D9DF7] to-[#A05DF7] rounded-[100px] p-[1px]">
                    <div className="flex px-[10px] w-full h-full bg-[#16191F] rounded-[100px] border border-transparent">
                      <Image
                        src="/icon_wallet.svg"
                        alt="wallet"
                        width={11.35}
                        height={12}
                      />
                      <span className="text-[12px] text-white flex justify-center items-center font-[500px] font-normal ml-[7px]">
                        {shortenAddress(account)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* 환불안내 */}
                <div className="flex flex-col items-center space-y-[10px] w-full">
                  <span className="text-white text-[20px] font-[700]">
                    stat NFT 환불 안내
                  </span>
                  <span className="px-[30px] w-full text-white text-[16px] font-[400] leading-[30px]">
                    1. stat 환불은{" "}
                    <span className="font-[700]">stat NFT 보유자</span>에 한해서
                    환불됩니다. <br />
                    2. 환불하기{" "}
                    <span className="font-[700]">
                      원하는 NFT를 선택
                    </span>하고 <span className="font-[700]">확인 버튼</span>을
                    누르면 환불됩니다. <br />
                    3. 환불한 NFT는{" "}
                    <span className="font-[700]">2024년 1월</span>
                    부터 순차적으로 환불될 예정입니다.
                  </span>
                </div>
                {/* 보유 stat NFT 목록 */}
                <div className="w-full flex flex-col items-center px-[30px] space-y-[10px] h-[261px]">
                  <span className="text-white text-[14px] font-[500] h-[22px]">
                    보유 NFT 목록
                  </span>
                  <div className="flex flex-col w-full min-w-[280px] py-[10px] px-[20px] justify-start items-center rounded-[10px] bg-[#0A0A0A] h-full overflow-y-auto">
                    <span className="text-white h-[40px] flex items-center text-[16px] font-[400] leading-[40px]">
                      NFT 번호
                    </span>
                    <div className="w-full h-[0.5px] bg-white mt-[2px] mb-[10px]" />
                    <div className="flex flex-col w-full -space-y-[10px] max-h-[100px]">
                      {
                        // NFT 번호
                        tokens.map((token, index) => {
                          return (
                            <button
                              key={index}
                              className="flex justify-start items-center w-full min-h-[40px] text-white space-x-[10px]"
                              onClick={() => handleClickToken(token)}
                            >
                              {
                                // 선택된 NFT 번호
                                checkedToken?.tokenId === token.tokenId ? (
                                  <Image
                                    src="/icon_checked.png"
                                    alt="check"
                                    width={18}
                                    height={18}
                                  />
                                ) : (
                                  <Image
                                    src="/icon_notchecked.png"
                                    alt="uncheck"
                                    width={18}
                                    height={18}
                                  />
                                )
                              }
                              <span className="text-[16px] font-[400] ">
                                #{getFormattedTokenId(token.tokenId)}{" "}
                              </span>
                            </button>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
                {/* 환불금액 안내 */}
                <div className="flex flex-col w-full space-y-[5px]">
                  {/* 선 */}
                  <div className="w-full flex items-center justify-center p-[10px]">
                    <div className="w-full h-[1px] bg-white" />
                  </div>
                  {/* 금액 */}
                  <div
                    className={
                      "w-full flex px-[20px] space-x-[20px]" +
                      " " +
                      (isMobile ? "justify-center" : "justify-end")
                    }
                  >
                    <div className="flex flex-col justify-center items-center px-[20px] bg-black rounded-[10px] text-[30px] font-[700] text-white">
                      {checkedToken?.refundAmount || 0}
                    </div>
                    <span className="text-[20px] font-[500] text-white flex items-center">
                      stat
                    </span>
                  </div>
                </div>
                {/* 취소하기 / 환불하기 버튼 */}
                <div className="flex justify-center py-[10px] space-x-[5px] items-center w-full">
                  {/* 취소하기 */}
                  <button
                    onClick={() => setRefundModal(false)}
                    className="min-w-[124px] flex justify-center items-center h-[60px] py-[18px] px-[26px] text-[20px] font-[700] text-[#808080]"
                  >
                    취소하기
                  </button>
                  {/* 환불하기 */}
                  <button className="flex items-center justify-center h-[62px] w-full rounded-[15px] bg-gradient-to-r from-[#47A9B1] via-[#4171A0] to-[#A25EF8] text-[20px] font-[700] text-[white]">
                    환불하기
                  </button>
                </div>
                {/* 로딩 */}
                {isLoading && (
                  <div
                    className="absolute inset-0 w-full h-full flex justify-center items-center backdrop-blur-sm pointer-events-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CircularProgress
                      color="secondary"
                      aria-label="Loading..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* 완료 모달 */}
        {completModal && (
          <div
            onClick={() => setCompletModal(false)}
            className="fixed top-0 left-0 w-full h-full z-50 bg-center bg-lightgray bg-cover bg-no-repeat bg-[url('/modal_background_img.png')] flex justify-center items-center"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="max-w-[600px] w-full min-w-[320px] h-[360px] min-h-[325px] z-50 bg-gradient-to-r from-[#5DE7E7] via-[#5D9DF7] to-[#A05DF7] border border-transparent rounded-[15px] shadow-none mx-[10px]"
            >
              <div className="bg-[#16191F] w-full h-full rounded-[15px] flex flex-col justify-center items-center py-[40px] px-[20px] space-y-[59px]">
                <span className="text-white text-[20px] font-[500] leading-normal mx-[40px] text-center">
                  환불이 완료되었습니다. <br /> 감사합니다.
                </span>
                <button
                  onClick={() => setCompletModal(false)}
                  className="flex min-w-[280px] max-w-[400px] w-full justify-center items-center rounded-[10px] bg-gradient-to-r from-[#47A9B1] via-[#4171A0] to-[#A25EF8] h-[50px] w-[270px] space-y-[30px]"
                >
                  <span className="text-white text-[20px] font-[500]">
                    처음으로
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </NextUIProvider>
  );
}
