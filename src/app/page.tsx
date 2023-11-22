import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col min-w-[360px] max-w-screen min-h-[1047px] max-h-screen px-[50px] py-[30px] justify-center items-center gap-[37px] bg-[#101010]">
      <div className="min-w-[360px] max-w-[1200px] max-h-[920px] flex-grow flex-shrink-0 flex-basis-0">
        <Image
          src="/main_image.png"
          alt="main"
          width={4096}
          height={3750}
          quality={100}
        ></Image>
      </div>
      <div className="flex-grow flex-shrink-0 flex-basis-0">
        <p className="text-white text-center text-sm font-normal leading-[16px]">
          그동안 탑트레이더 카드를 사랑해주셔서 감사합니다.
          <br /> 곧 <span className="font-bold">새로운 스탯 트레이더 카드</span>
          로 돌아오겠습니다.
        </p>
      </div>

      <button className="flex flex-col justify-center items-center gap-2 flex-shrink-0 w-[270px] h-[50px] max-w-[386px] p-2 rounded-[10px] bg-gradient-to-r from-[#5EF8F8] via-[#5E9FF8] to-[#A25EF8] text-white text-center text-sm font-normal font-bold leading-normal">
        지갑 연결하기
      </button>
    </main>
  );
}
