"use client";

import Image from "next/image";
import { SetStateAction, useEffect, useState } from "react";
import Caver, { AbiItem } from "caver-js";
import { isMobile } from "react-device-detect";
import axios from "axios";
import { CircularProgress } from "@nextui-org/react";
import { NextUIProvider } from "@nextui-org/react";
import StatNFTABI from "../StatNFTABI.json";
import dayjs from "dayjs";

declare global {
  interface Window {
    klip: any;
    klaytn: any;
  }
}

// klip
const bappName = "STAT Top Trader Card REFUND";

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
  refundAmount: string;
  traderName: string;
};

const KLAYTN_ENNODE_MAINNET = "https://public-en-cypress.klaytn.net";
const KLAYTN_ENNODE_BAOBAB = "https://public-en-baobab.klaytn.net";
const MAINNET_STAT_NFT_CONTRACT_ADDRESS =
  "0x96e423d5cf07bbd8e13a1cee4fe390dcd4b3fb6b"; // real
// const MAINNET_STAT_NFT_CONTRACT_ADDRESS =
//   "0xa84cb2207cb80f8af82c44f7f41f804323f86289"; // test
// const STAT_REFUND_ACCOUNT_ADDRESS =
//   "0xBd2A5960d60241E5b7d888c986F8fe4dbFf986b1"; //TODO test: klip
// const STAT_REFUND_ACCOUNT_ADDRESS =
//   "0x8b56758B52cC56A7a0aB4C9d7698C73737eDCcbA"; //TODO test: kaikas
const STAT_REFUND_ACCOUNT_ADDRESS =
  "0x138fbb060fa77887b8dd1888407ca7b1ce24dc83"; //TODO real address

const startDate = dayjs("2023-12-15T17:00:00+09:00").unix();
const endDate = dayjs("2024-02-19T17:00:00+09:00").unix();


type RefundHistory = {
  nftId: string;
  traderName: string;
  ercWalletAddress: string;
}

export default function Home() {
  const [connectWalletModal, setConnectWalletModal] = useState(false);
  const [account, setAccount] = useState("");
  const [caver, setCaver] = useState<Caver>();
  const [klipRequestKey, setKlipRequestKey] = useState("");
  const [kaikasRequestKey, setKaikasRequestKey] = useState(""); // only mobile
  const [connectWalletType, setConnectWalletType] = useState<ConnectWalletType>(
    ConnectWalletType.NONE
  );
  const [refundModal, setRefundModal] = useState(false);
  const [tokens, setTokens] = useState<StatNFT[]>([]);

  const [checkedToken, setCheckedToken] = useState<StatNFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completModal, setCompletModal] = useState(false);
  const [inputAddress, setInputAddress] = useState(""); // TODO: test, if real, ""

  const [isDate, setIsDate] = useState(false); // TODO: real is false

  const [refundHistories, setRefundHistories] = useState<RefundHistory[]>([]);

  useEffect(() => {
    const now = dayjs().unix();
    if (now >= startDate && now <= endDate) {
      setIsDate(true);
    }
  }, []);

  const handleConnectKaikasBtn = () => {
    if (isMobile) {
      handleConnectKaikasMobile();
    } else {
      handleConnectKaikas();
    }
  };

  // kaikas는 웹, 모바일에서 사용 가능
  const handleConnectKaikas = async () => {
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
          if (kaikas.networkVersion !== "8217") {
            await kaikas
              .request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x2019" }],
              })
              .then((res: any) => {
                // console.log("res", res);
              })
              .catch((err: any) => {
                // console.error("err", err);
                const { code } = err;
                if (code === 4001) {
                  alert("메인넷에서만 환불이 가능합니다.");
                  throw new Error("메인넷에서만 환불이 가능합니다.");
                }
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

  const handleConnectKaikasMobile = async () => {
    const prepareUrl = "https://api.kaikas.io/api/v1/k/prepare";
    const body = {
      bapp: { name: bappName },
      type: KlipActionType.AUTH.valueOf(),
    };
    const header = {
      "Content-Type": "application/json",
    };

    try {
      const prepareResponse = await axios.post(prepareUrl, body, {
        headers: header,
      });
      const { request_key } = prepareResponse.data;
      if (!request_key) {
        alert("카이카스 지갑 연결을 실패했습니다.");
        throw new Error("카이카스 지갑 연결을 실패했습니다.");
      }
      setKaikasRequestKey(request_key);

      const deeplinkUrl = `kaikas://wallet/api?request_key=${request_key}`;
      window.location.href = deeplinkUrl;
      // 앱 열렸는지 확인
      checkInstallApp();

      const resultCheckInterval = setInterval(() => {
        checkKaikasAuthResult(request_key).then((res) => {
          if (res) {
            clearInterval(resultCheckInterval);
          }
        });
      }, 3000);
    } catch (error) {
      alert("카이카스 지갑 연결을 실패했습니다.");
    }
  };

  const checkInstallApp = () => {
    let appOpened = false;

    const clearTimers = () => {
      clearInterval(check);
      clearTimeout(timer);
    };

    const checkVisibility = () => {
      if (document.visibilityState === "visible") {
        if (appOpened) {
          clearTimers();
        } else {
          alert("지갑 앱을 먼저 설치해주세요.");
          clearTimers();
        }
      }
    };

    const check = setInterval(() => {
      // console.log(`check app opened: ${appOpened}`);
      if (document.hidden) {
        appOpened = true;
      }
    }, 200);

    const timer = setTimeout(() => {
      // if (!appOpened) {
      checkVisibility();
      clearTimers();
      // }
    }, 3000);

    // document.addEventListener("visibilitychange", checkVisibility);
  };

  const checkKaikasAuthResult = async (requestKey: string) => {
    if (!requestKey) {
      return false;
    }

    try {
      const response = await axios
        .get(`https://api.kaikas.io/api/v1/k/result/${requestKey}`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((res) => {
          if (res.status !== 200) {
            return false;
          }

          const result = res.data;
          if (!result) {
            return false;
          }

          if (result.status === "completed") {
            const eoa = result.result?.klaytn_address;
            if (!eoa) {
              return false;
            }

            setAccount(eoa);
            setConnectWalletModal(false);
            setConnectWalletType(ConnectWalletType.KAIKAS);
            const caver = new Caver(KLAYTN_ENNODE_MAINNET);
            setCaver(caver);
            setRefundModal(true);
            return true;
          } else {
            return false;
          }
        })
        .catch((err: any) => {
          return false;
        });

      return response;
    } catch (error) {
      return false;
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

    try {
      let requestKeyTmp = "";
      const response = await axios
        .post(
          "https://a2a-api.klipwallet.com/v2/a2a/prepare",
          {
            bapp: { name: "STAT NFT REFUND" },
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
            throw new Error("클립 지갑 연결을 실패했습니다.");
          }
          setKlipRequestKey(request_key);
          requestKeyTmp = request_key;
        })
        .catch((err: any) => {
          throw new Error("클립 지갑 연결을 실패했습니다.");
        });

      // deep link
      requestKlipDeeplink(requestKeyTmp);
      checkInstallApp();

      // eoa 요청
      const resultCheckInterval = setInterval(() => {
        checkKlipAuthResult(requestKeyTmp).then((res) => {
          if (res) clearInterval(resultCheckInterval);
        });
      }, 3000);
    } catch (error) {
      alert("클립 지갑 연결을 실패했습니다.");
    }
  };

  const requestKlipDeeplink = (requestKey: string) => {
    const deeplinkUrl = `kakaotalk://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${requestKey}`;

    window.location.href = deeplinkUrl;
  };

  const checkKlipAuthResult = async (requestKey: string) => {
    if (!requestKey) {
      return false;
    }

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
          if (res.status !== 200) {
            return false;
          }

          const result = res.data;
          if (!result) {
            return false;
          }

          if (result.status === "completed") {
            const eoa = result.result?.klaytn_address;
            if (!eoa) {
              return false;
            }

            setAccount(eoa);
            setConnectWalletModal(false);
            setConnectWalletType(ConnectWalletType.KLIP);
            const caver = new Caver(KLAYTN_ENNODE_MAINNET);
            setCaver(caver);
            setRefundModal(true);
            return true;
          } else {
            return false;
          }
        })
        .catch((err: any) => {
          return false;
        });

      return response;
    } catch (error) {
      return false;
    }
  };

  const handleConnectWalletBtn = () => {
    // 시간 체크
    if (!isDate) {
      alert("환불 기간이 아닙니다.");
      return;
    }
    setConnectWalletModal(true);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-8)}`;
  };

  const handleClickToken = (token: StatNFT) => {
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
    if (caver && account) {
      updateToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caver, account]);

  const updateToken = async () => {
    try {
      if (caver && account) {
        const statContract = caver.contract.create(
          StatNFTABI as AbiItem[],
          MAINNET_STAT_NFT_CONTRACT_ADDRESS
        );
        const tokenBalance = await statContract.methods
          .balanceOf(account)
          .call();
        // console.log("tokenBalance", tokenBalance);

        const tokenIds = [];
        for (let i = 0; i < tokenBalance; i++) {
          const tokenId = await statContract.methods
            .tokenOfOwnerByIndex(account, i)
            .call();
          tokenIds.push(tokenId);
        }

        // tokenUri 가져오기
        const tokenUris = [];
        for (let i = 0; i < tokenIds.length; i++) {
          const tokenUri = await statContract.methods
            .tokenURI(tokenIds[i])
            .call();
          tokenUris.push(tokenUri);
        }

        // token URI 에서 attributes[] 에서 trait_type이 "트레이더"의 value 가져오기
        const traders = [];
        for (let i = 0; i < tokenUris.length; i++) {
          const tokenUri = tokenUris[i];
          const response = await axios.get(tokenUri); // TODO real
          // const response = await axios.get(
          //   "https://metadata-store.klaytnapi.com/c3bca402-e5c0-38c3-48bd-cfdcf99ea681/9e4f3b82-b706-c4a4-dba7-727c9278065b.json"
          // ); // TODO test -> 모멘텀 스켈퍼
          // const response = await axios.get(
          //   "https://metadata-store.klaytnapi.com/c3bca402-e5c0-38c3-48bd-cfdcf99ea681/a070bda2-334a-999a-9af0-5ec08eff1df4.json"
          // ); // TODO test -> 흑구
          // const response = await axios.get(
          //   "https://metadata-store.klaytnapi.com/c3bca402-e5c0-38c3-48bd-cfdcf99ea681/21133b31-f7d6-26ac-37a7-251c2e7b879d.json"
          // ); // TODO test -> 라이노
          // const response = await axios.get(
          //   "https://metadata-store.klaytnapi.com/c3bca402-e5c0-38c3-48bd-cfdcf99ea681/91c3ef4c-4007-4554-9d01-6b9d898f902a.json"
          // ); // TODO test -> 멘탈리스트
          // const response = await axios.get(
          //   "https://metadata-store.klaytnapi.com/c3bca402-e5c0-38c3-48bd-cfdcf99ea681/16a3ea95-8b04-b413-d5a9-d9b6f11e2d15.json"
          // ); // TODO test -> 박리다매

          const { attributes } = response.data;
          const trader = attributes.find(
            (attribute: any) => attribute.trait_type === "트레이더"
          );
          traders.push(trader);
        }

        const refundAmounts = [];
        for (let i = 0; i < traders.length; i++) {
          const trader = traders[i];
          if (trader.value === "모멘텀 스켈퍼") {
            refundAmounts.push("353만 2438원");
          } else if (trader.value === "박리다매") {
            refundAmounts.push("209만 4586원");
          } else if (trader.value === "멘탈리스트") {
            refundAmounts.push("189만 8208원");
          } else if (trader.value === "흑구") {
            refundAmounts.push("183만 3312원");
          } else if (trader.value === "라이노") {
            refundAmounts.push("179만 7484원");
          } else {
            refundAmounts.push("0원");
          }
        }

        // tokenIds, refundAmounts 합치기
        const tokens = [];
        for (let i = 0; i < tokenIds.length; i++) {
          const token = {
            tokenId: tokenIds[i],
            refundAmount: refundAmounts[i],
            traderName: traders[i].value,
          };
          tokens.push(token);
        }

        setCheckedToken(null);
        setTokens(tokens);
      }
    } catch (error) {
      alert("NFT 정보를 가져오는 중 오류가 발생했습니다.");
    }
  };

  const handleAddressChange = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setInputAddress(event.target.value);
  };

  // 1) web3 utils.isAddress()로 이더리움 주소 형식인지 확인 +
  // 2) 선택된 tokenId가 상태값으로 존재하는 지 확인
  // 3) 토큰 아이디의 주소가 현재 지갑 주소의 주인이 맞는지 확인
  // 4) transfer를 해줘야하는데, kaikas랑 klip이랑 다르게 처리
  // 5) kaikas는 caver로 처리하면 됨.
  // 6) klip은 card transfer docs 참고해서 처리
  // 7) 가스비 미리 확인해서 가스비가 부족하면 안내
  // 8) transfer 트랜잭션 중에는 loading 표시
  // 9) 트랜잭션 완료되면, 완료 모달 띄우기
  // 10) 완료 후에는 완료 모달만 닫고 statNFT 목록을 최신화 해야한다.
  const handleRefundBtn = async () => {
    if (!caver) {
      alert("지갑 연결을 먼저 해주세요.");
      return;
    }

    if (!checkedToken) {
      alert("환불할 NFT를 선택해주세요.");
      return;
    }

    if (!inputAddress) {
      alert("이더리움 지갑 주소를 입력해주세요.");
      return;
    }

    if (!caver.utils.isAddress(inputAddress)) {
      alert("이더리움 지갑 주소가 올바르지 않습니다.");
      return;
    }

    try {
      const statContract = caver.contract.create(
        StatNFTABI as AbiItem[],
        MAINNET_STAT_NFT_CONTRACT_ADDRESS
      );
      const gasPrice = await caver.klay.getGasPrice();
      let gasLimit = 0;
      await statContract.methods
        .safeTransferFrom(
          account,
          STAT_REFUND_ACCOUNT_ADDRESS,
          checkedToken.tokenId
        )
        .estimateGas({ from: account })
        .then((res: any) => {
          gasLimit = res as number;
        })
        .catch((err: any) => {
          throw new Error("가스비 계산 중 오류가 발생했습니다.");
        });
      const gasFee = caver.utils.convertFromPeb(
        caver.utils.toPeb(gasPrice, "peb") * gasLimit * 1.05,
        "KLAY"
      );

      // 가스비가 부족하면 안내
      const balance = await caver.klay.getBalance(account);
      const balanceKLAY = caver.utils.convertFromPeb(balance, "KLAY");
      if (balanceKLAY < gasFee) {
        alert("가스비가 부족합니다.");
        return;
      }

      // api 먼저 호출
      const requestResult = await requestPostEthAddress(
        account,
        inputAddress,
        checkedToken.tokenId,
        checkedToken.traderName
      );

      console.log("requestResult", requestResult);

      if (!requestResult) {
        return;
      }

      if (connectWalletType === ConnectWalletType.KAIKAS) {
        if (isMobile) {
          const prepareUrl = "https://api.kaikas.io/api/v1/k/prepare";
          const header = {
            "Content-Type": "application/json",
          };
          // abi 는 string으로
          // ex) "{\\n  \\"constant\\": false,\\n  \\"inputs\\": [\\n    {\\n      \\"name\\": \\"_to\\",\\n      \\"type\\": \\"address\\"\\n    },\\n    {\\n      \\"name\\": \\"_value\\",\\n      \\"type\\": \\"uint256\\"\\n    }\\n  ],\\n  \\"name\\": \\"transfer\\",\\n  \\"outputs\\": [\\n    {\\n      \\"name\\": \\"\\",\\n      \\"type\\": \\"bool\\"\\n    }\\n  ],\\n  \\"payable\\": false,\\n  \\"stateMutability\\": \\"nonpayable\\",\\n  \\"type\\": \\"function\\"\\n}"
          // safeTransferFrom(address,address,uint256)
          const body = {
            bapp: { name: bappName },
            type: "execute_contract",
            transaction: {
              to: MAINNET_STAT_NFT_CONTRACT_ADDRESS,
              abi: JSON.stringify({
                constant: false,
                inputs: [
                  {
                    name: "_from",
                    type: "address",
                  },
                  {
                    name: "_to",
                    type: "address",
                  },
                  {
                    name: "_tokenId",
                    type: "uint256",
                  },
                ],
                name: "safeTransferFrom",
                outputs: [],
                payable: false,
                stateMutability: "nonpayable",
                type: "function",
              } as AbiItem),
              value: "0",
              params: JSON.stringify([
                account,
                STAT_REFUND_ACCOUNT_ADDRESS,
                checkedToken.tokenId,
              ]),
            },
          };
          const prepareResponse = await axios.post(prepareUrl, body, {
            headers: header,
          });
          const { request_key } = prepareResponse.data;
          // console.log("request_key", prepareResponse.data);
          if (!request_key) {
            alert("카이카스 지갑 연결을 실패했습니다.");
            throw new Error("카이카스 지갑 연결을 실패했습니다.");
          }

          const deeplinkUrl = `kaikas://wallet/api?request_key=${request_key}`;
          window.location.href = deeplinkUrl;
          setIsLoading(true);

          const resultCheckInterval = setInterval(() => {
            checkKaikasResult(request_key).then((res) => {
              if (res) {
                setIsLoading(false);
                clearInterval(resultCheckInterval);
              }
            });
          }, 3000);
        } else {
          const overGasPrice = caver.utils.toPeb(gasPrice, "peb") * 1.05;
          // transfer
          await caver.klay
            .sendTransaction({
              type: "SMART_CONTRACT_EXECUTION",
              from: account,
              to: MAINNET_STAT_NFT_CONTRACT_ADDRESS,
              data: statContract.methods
                .safeTransferFrom(
                  account,
                  STAT_REFUND_ACCOUNT_ADDRESS,
                  checkedToken.tokenId
                )
                .encodeABI(),
              gas: gasLimit,
              gasPrice: overGasPrice,
            })
            .on("transactionHash", (hash: any) => {
              setIsLoading(true);
            })
            .on("receipt", async (receipt: any) => {
              // const requestResult = await requestPostEthAddress(
              //   account,
              //   inputAddress,
              //   checkedToken.tokenId,
              //   checkedToken.traderName
              // );
              setIsLoading(false);
              await updateToken();
              // if (!requestResult) {
              //   return;
              // }
              setCompletModal(true);
            })
            .on("error", (error: any) => {
              setIsLoading(false);
              if (error.code === -32603) {
                alert("트랜잭션을 취소하셨습니다.");
                return;
              } else {
                alert("환불 중 오류가 발생했습니다.");
              }
            });
        }
      } else if (connectWalletType === ConnectWalletType.KLIP) {
        // prepare -> request -> result
        /*  prepare curl 예시, axios로 변환
        curl -X POST "https://a2a-api.klipwallet.com/v2/a2a/prepare" \
      -d '{"bapp": { "name" : "My BApp" }, "type": "send_card", "transaction": { "contract": "0xB21F0285d27beb2373ECB5c17E119ccEAd7Ee10A", "from": "0xcD1722f2947Def4CF144679da39c4C32bDc35681", "to": "0x85c17299e9462e035c149847776e4edb7f4b2aa9", "card_id": "1234" } }' \
      -H "Content-Type: application/json"
        */
        const prepareUrl = "https://a2a-api.klipwallet.com/v2/a2a/prepare";

        // prepare
        const prepareBody = {
          bapp: { name: bappName },
          type: KlipActionType.SEND_CARD.valueOf(),
          transaction: {
            contract: MAINNET_STAT_NFT_CONTRACT_ADDRESS,
            from: account,
            to: STAT_REFUND_ACCOUNT_ADDRESS,
            card_id: checkedToken.tokenId,
          },
        };
        // const prepareBody = {
        //   bapp: { name: "klip test" },
        //   type: "send_card",
        //   transaction: {
        //     contract: "0xa84cb2207cb80f8af82c44f7f41f804323f86289",
        //     from: "0xbd2a5960d60241e5b7d888c986f8fe4dbff986b1",
        //     to: "0x8b56758B52cC56A7a0aB4C9d7698C73737eDCcbA",
        //     card_id: "118717",
        //   },
        // };
        const prepareResponse = await axios.post(prepareUrl, prepareBody, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const { request_key } = prepareResponse.data;

        if (!request_key) {
          alert("클립 지갑 연결을 실패했습니다.");
          throw new Error("클립 지갑 연결을 실패했습니다.");
        }

        // deep link
        requestSendCardDeepLink(request_key);
        setIsLoading(true);

        const resultCheckInterval = setInterval(() => {
          checkSendCardResult(request_key).then((res) => {
            if (res) {
              setIsLoading(false);
              clearInterval(resultCheckInterval);
            }
          });
        }, 3000);
      }
    } catch (error) {
      setIsLoading(false);
      alert("환불 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const checkKaikasResult = async (requestKey: string) => {
    if (!requestKey) {
      return false;
    }

    try {
      const response = await axios
        .get(`https://api.kaikas.io/api/v1/k/result/${requestKey}`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then(async (res) => {
          if (res.status !== 200) {
            return false;
          }

          const result = res.data;
          if (!result) {
            return false;
          }

          if (result.status === "completed") {
            if (!checkedToken) {
              throw new Error(
                "환불 신청에 실패했습니다. 스탯 공식 디스코드로 문의해주세요."
              );
            }
            // const requestResult = await requestPostEthAddress(
            //   account,
            //   inputAddress,
            //   checkedToken?.tokenId,
            //   checkedToken?.traderName
            // );
            // if (!requestResult) {
            //   return false;
            // }
            await updateToken();
            setCompletModal(true);
            // 성공
            return true;
          } else {
            return false;
          }
        })
        .catch((err: any) => {
          return false;
        });
      return response;
    } catch (error) {
      return false;
    }
  };

  /**
   * 결과 타입 예시
   * {
        "request_key": "0b0ee0ad-62b3-4146-980b-531b3201265d",
        "expiration_time": 1600011054,
        "status": "completed",
        "result": {
          "tx_hash": "0x82d018556e88b8f8f43dc2c725a683afc204bfd3c17230c41252354980f77fb3",
          "status": "success"
        }
      }
      status는 pending, success, fail 이 있는데, success가 아니면 pending이나 fail이므로 pending이면 다시 요청하고, fail이면 실패 메시지 띄우기
   */
  const checkSendCardResult = async (requestKey: string) => {
    if (!requestKey) {
      return false;
    }

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
        .then(async (res) => {
          if (res.status !== 200) {
            return false;
          }

          const result = res.data;
          if (!result) {
            return false;
          }

          if (result.status === "completed") {
            const status = result.result?.status;
            if (status !== "success") {
              return false;
            }
            if (status === "success") {
              if (!checkedToken) {
                throw new Error(
                  "환불 신청에 실패했습니다. 스탯 공식 디스코드로 문의해주세요."
                );
              }
              // const requestResult = await requestPostEthAddress(
              //   account,
              //   inputAddress,
              //   checkedToken?.tokenId,
              //   checkedToken?.traderName
              // );
              // if (!requestResult) {
              //   return false;
              // }
              await updateToken();
              setCompletModal(true);
              // 성공
              return true;
            } else if (status === "fail") {
              // 실패

              return false;
            } else if (status === "pending") {
              // 대기

              return false;
            }
          } else {
            return false;
          }
        })
        .catch((err: any) => {
          return false;
        });
      return response;
    } catch (error) {
      return false;
    }
  };

  const requestSendCardDeepLink = (requestKey: string) => {
    const deeplinkUrl = `kakaotalk://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${requestKey}`;

    window.location.href = deeplinkUrl;
  };

  // transfer 성공시 호출해야하는 함수
  // stat api 호출
  /**
   * POST: https://stat-live-api.shop:8080/refundDetail
  200 'success': True <- 성공
  400 'success': False, 'message': {exception message}  <- 실패
  body
  kipWalletAddress : 연결한 kaikas 혹은 klip 지갑 주소
  ercWalletAddress : 입력한 환불 받을 메타마스크 지갑 주소
  nftId : 환불 신청 한 NFT ID
  traderName: 환불 신청 한 트레이더 이름
  JSON 포멧 예제
  {
      "kipWalletAddress":"0x000",
      "ercWalletAddress":"0x111",
      "nftId":"12",
      "traderName":"모멘텀 스켈퍼"
  }
   */
  const requestPostEthAddress = async (
    klaytnAddress: string,
    ercAddress: string,
    tokenId: number,
    traderName: string
  ) => {
    const url = "https://stat-live-api.shop:8080/refundDetail";
    const body = {
      kipWalletAddress: klaytnAddress,
      ercWalletAddress: ercAddress,
      nftId: tokenId,
      traderName: traderName,
    };
    try {
      const response = await axios.post(url, body);

      if (response.status === 200) {
        return true;
      } else {
        alert("환불 신청에 실패했습니다. 스탯 공식 디스코드로 문의해주세요.");
        return false;
      }
    } catch (error) {
      alert("환불 신청에 실패했습니다. 스탯 공식 디스코드로 문의해주세요.");
      return false;
    }
  };

  const handleOutRefundModal = () => {
    setRefundModal(false);
    setCheckedToken(null);
    setInputAddress("");
  };

  /*
  GET: https://stat-live-api.shop:8080/refundHistory
    200 'success': True, 'result': []    <- 정상 값
    400 'success': False, 'message': {exception message}  <- 실패

    Query parameters
    kipWalletAddress-> 유저가 사용한 kip wallet 주소

    Response
    {"success": true, "result": [...]
  */
  const getRefundHistory = async (account: string) => {
    const url = `https://stat-live-api.shop:8080/refundHistory?kipWalletAddress=${account}`;
    try {
      const response = await axios.get(url);
      if (response.status === 200) {
        const result = response.data.result;

        if (result.length > 0) {
          const refundHistory = result.map((item: any) => {
            const { ercWalletAddress, nftId, traderName } = item;
            return {
              ercWalletAddress,
              nftId,
              traderName,
            };
          });
          
          setRefundHistories(refundHistory);
        }
      }
    } catch (error) {
      
    }
  }

  useEffect(() => {
    if (account) {
      getRefundHistory(account); 
    }
  }, [account]);

  return (
    <NextUIProvider>
      <main className="flex flex-col min-w-screen w-full font-pretendard min-h-[1047px] py-[50px] px-[30px] gap-[10px] justify-center items-center bg-[#121212]">
        <div className="min-w-[349px] w-full max-w-[1000px] min-h-[368px] max-h-[920px]">
          <div className="w-full h-full md:flex hidden">
            <Image
              src="/main_image5.png"
              alt="main"
              width={6560}
              height={6602}
              quality={100}
            ></Image>
          </div>
          <div className="w-full h-full md:hidden flex">
            <Image
              src="/main_image5.png"
              alt="main"
              width={6560}
              height={6602}
              quality={100}
            ></Image>
          </div>
        </div>
        <div className="w-full flex items-center justify-center py-[20px]">
          <p className="text-white text-center text-sm font-normal leading-[16px]">
            그동안 탑트레이더 카드를 사랑해주셔서 감사합니다.
            <br /> 곧 새로운 서비스로 리뉴얼하여 돌아오겠습니다.
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
                  <span className="ml-1 font-normal">상당의 USDT</span>
                </td>
              </tr>
              <tr className="flex border-b border-white">
                <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                  박리다매
                </td>
                <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                  6197<span className="ml-1 font-normal">KLAY</span>
                </td>
                <td className="w-1/2 flex justify-center items-center py-[10px]">
                  209만4586원{" "}
                  <span className="ml-1 font-normal">상당의 USDT</span>
                </td>
              </tr>
              <tr className="flex border-b border-white">
                <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                  멘탈리스트
                </td>
                <td className="w-1/4 flex justify-center items-center p-[10px] border-r border-white">
                  5616<span className="ml-1 font-normal">KLAY</span>
                </td>
                <td className="w-1/2 flex justify-center items-center py-[10px]">
                  189만8208원{" "}
                  <span className="ml-1 font-normal">상당의 USDT</span>
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
                  <span className="ml-1 font-normal">상당의 USDT</span>
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
                  <span className="ml-1 font-normal">상당의 USDT</span>
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
                  STAT Top Trader Card를 보유하고 있는 지갑을 선택해주세요.
                </span>
                <div className="flex w-full h-full max-h-[300px] px-[10px] space-x-[20px] items-center">
                  <button
                    onClick={() => handleConnectKaikasBtn()}
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
            onClick={() => handleOutRefundModal()}
            className={
              "fixed top-0 left-0 w-full h-full z-50 bg-center bg-lightgray bg-cover bg-no-repeat bg-[url('/modal_background_img.png')] flex justify-center" +
              " " +
              (isMobile ? "items-start my-[1px]" : "items-center")
            }
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="max-w-[600px] w-full min-w-[320px] z-50 bg-gradient-to-r from-[#5DE7E7] via-[#5D9DF7] to-[#A05DF7] rounded-[15px] shadow-none p-[1px] max-h-screen overflow-y-auto"
            >
              <div
                className={
                  "bg-[#16191F] w-full rounded-[15px] flex flex-col justify-center items-center p-[10px]" +
                  " " +
                  (isMobile ? "space-y-[10px]" : "space-y-[20px]")
                }
              >
                {/* 지갑 */}
                <div
                  className={
                    `h-[24px] w-full flex` +
                    " " +
                    (isMobile ? "justify-center" : "justify-end")
                  }
                >
                  {/* 지갑주소 */}
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
                  <span
                    className={
                      "px-[30px] w-full text-white font-[700]" +
                      " " +
                      (isMobile ? "text-[16px]" : "text-[20px]")
                    }
                  >
                    • STAT Top Trader Card 환불 안내
                  </span>
                  <span className="px-[30px] w-full text-white text-[14px] font-[300] leading-[25px]">
                    1. 환불 접수된 NFT는{" "}
                    <span className="font-[500]">
                      환불 접수 기간 종료 직후{" "}
                    </span>
                    순차적으로 환불됩니다.
                    <br />
                    2. 환불을 위해{" "}
                    <span className="font-[500]">이더리움 지갑 주소</span>를
                    입력해주세요.{" "}
                    <span className="font-[500]">
                      주소 오입력에 대한 책임은 당사에서 지지 않습니다.
                    </span>
                  </span>
                </div>
                {/* 이더리움 지갑 주소 입력창 */}
                <div className="flex flex-col max-w-[580px] w-full px-[30px] pt-[4px] pb-[4px] items-center justify-center space-y-[8px]">
                  <div className="w-full flex items-center space-x-[10px]">
                    <span
                      className={
                        "text-white font-[700]" +
                        " " +
                        (isMobile ? "text-[16px]" : "text-[20px]")
                      }
                    >
                      • USDT 환불 이더리움 지갑 주소
                    </span>
                    <div className="flex w-[34px] h-[16px] justify-center items-center rounded-[5px] bg-[#FF5A5A] bg-opacity-[20%]">
                      <span className="text-center text-[12px] font-[700] text-[#FF5A5A]">
                        필수
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="이더리움 지갑 주소를 입력해주세요."
                    className="w-full min-w-[280px] h-[40px] rounded-[5px] bg-[#0A0A0A] text-white pl-[20px] text-[14px] font-[400] border border-white border-[0.5px]"
                    value={inputAddress}
                    onChange={handleAddressChange}
                  />
                </div>
                {/* 보유 stat NFT 목록 */}
                <div
                  className={
                    "w-full flex flex-col items-center px-[30px] space-y-[10px]" +
                    " " +
                    (isMobile ? "h-[160px]" : "h-[231px]")
                  }
                >
                  <div className="flex flex-col w-full min-w-[280px] py-[10px] px-[20px] justify-start items-center rounded-[10px] bg-[#0A0A0A] h-full overflow-y-auto">
                    <span
                      className={
                        "text-white flex items-center text-[16px] font-[400] leading-[40px]" +
                        " " +
                        (isMobile ? "h-[30px]" : "h-[40px]")
                      }
                    >
                      보유 Top Trader Card 번호
                    </span>
                    <div className="w-full min-h-[0.5px] bg-white mt-[2px] mb-[10px]" />
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
                  <div className="w-full flex px-[20px] space-x-[20px] justify-end">
                    <div
                      className={
                        "flex flex-col justify-center items-center px-[20px] bg-black rounded-[10px] font-[700] text-white" +
                        " " +
                        (isMobile ? "text-[20px]" : "text-[30px]")
                      }
                    >
                      {checkedToken?.refundAmount || 0}
                    </div>
                    <span
                      className={
                        "font-[500] text-white flex items-center" +
                        " " +
                        (isMobile ? "text-[16px]" : "text-[20px]")
                      }
                    >
                      상당의 USDT
                    </span>
                  </div>
                </div>
                {/* 취소하기 / 환불하기 버튼 */}
                <div
                  className={
                    "flex justify-center space-x-[5px] items-center w-full" +
                    " " +
                    (isMobile ? "py-[0px]" : "py-[10px]")
                  }
                >
                  {/* 취소하기 */}
                  <button
                    onClick={() => handleOutRefundModal()}
                    className="min-w-[124px] flex justify-center items-center h-[60px] py-[18px] px-[26px] text-[20px] font-[700] text-[#808080]"
                  >
                    취소하기
                  </button>
                  {/* 환불하기 */}
                  <button
                    onClick={handleRefundBtn}
                    className={
                      "flex items-center justify-center w-full rounded-[15px] bg-gradient-to-r from-[#47A9B1] via-[#4171A0] to-[#A25EF8] text-[20px] font-[700] text-[white]" +
                      " " +
                      (isMobile ? "h-[50px]" : "h-[62px]")
                    }
                  >
                    환불하기
                  </button>
                </div>
                {/* 환불 히스토리 */}
                <div
                  className={
                    "flex flex-col w-full space-y-[10px] px-[30px] pb-[20px]" +
                    " " +
                    (isMobile ? "h-[160px]" : "h-[231px]")
                  }
                >
                  <div className="flex flex-col w-full min-w-[280px] py-[10px] px-[20px] justify-start items-center rounded-[10px] bg-[#0A0A0A] h-full overflow-y-auto">
                    <span
                      className={
                        "text-white flex items-center text-[16px] font-[400] leading-[40px]" +
                        " " +
                        (isMobile ? "h-[30px]" : "h-[40px]")
                      }
                    >
                      환불 히스토리 ({refundHistories.length})
                    </span>
                    <div className="w-full min-h-[0.5px] bg-white mt-[2px] mb-[10px]" />
                    <div className="flex flex-col w-full -space-y-[10px] max-h-[100px]">
                      {
                        refundHistories.map((history, index) => {
                          return (
                            <div
                              key={index}
                              className="flex text-[13px] justify-between items-center w-full min-h-[40px] text-white space-x-[10px]"
                            >
                              <div className="flex flex-row space-x-[10px]">
                              <span className="font-[400] ">
                                {index + 1}{" "}
                              </span>
                              <span className="font-[400] ">
                                #{getFormattedTokenId(Number(history.nftId))}{" "}
                              </span>
                                </div>
                              <span className="font-[400] ">
                                {history.traderName}{" "}
                              </span>
                              <span className="font-[400] ">
                                {shortenAddress(history.ercWalletAddress)}{" "}
                              </span>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
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
