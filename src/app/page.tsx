import Image from "next/image";

export default function Home() {
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

      <button className="flex flex-col justify-center items-center gap-2 flex-shrink-0 w-[270px] h-[50px] max-w-[386px] p-2 rounded-[10px] bg-gradient-to-r from-[#5EF8F8] via-[#5E9FF8] to-[#A25EF8] text-white text-center text-sm font-normal font-bold leading-normal my-[37px]">
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
    </main>
  );
}
