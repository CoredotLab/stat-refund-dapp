"use client";

import axios from "axios";

export default function Home() {
  const handleTest = async () => {
    const prepareUrl = "https://a2a-api.klipwallet.com/v2/a2a/prepare";
    const prepareBody = {
      bapp: { name: "klip test" },
      type: "send_card",
      transaction: {
        contract: "0xa84cb2207cb80f8af82c44f7f41f804323f86289",
        from: "0xbd2a5960d60241e5b7d888c986f8fe4dbff986b1",
        to: "0x8b56758B52cC56A7a0aB4C9d7698C73737eDCcbA",
        card_id: "118717",
      },
    };
    const prepareRes = await axios.post(prepareUrl, prepareBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("prepareRes:", prepareRes);
    const { request_key } = prepareRes.data;

    window.location.href = `kakaotalk://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${request_key}`;

    const resultCheckInterval = setInterval(() => {
      checkSendCardResult(request_key)
        .then((res) => {
          if (res) clearInterval(resultCheckInterval);
        })
        .catch((err) => {
          console.error("인증 결과 확인 중 오류 발생:", err);
        });
    }, 3000);
  };

  const checkSendCardResult = async (request_key: string) => {
    const checkUrl = `https://a2a-api.klipwallet.com/v2/a2a/result?request_key=${request_key}`;
    const checkRes = await axios.get(checkUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { status } = checkRes.data;
    if (status === "completed") {
      const { result } = checkRes.data;
      console.log("인증 성공:", result);
      return true;
    } else if (status === "fali") {
      console.log("인증 거부");
      return false;
    } else {
      console.log("인증 중");
      return false;
    }
  };
  return (
    <div className="flex justify-center items-center w-screen h-screen">
      <button onClick={handleTest} className="text-white">
        button
      </button>
    </div>
  );
}
