export default function LoadingOverlay() {
  return (
    <>
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0f172a]">
        {/* Background Decoration - ทำให้หน้าจอดูมีมิติไม่โล่งเกินไป */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/20 rounded-full blur-[120px]"></div>

        <div className="relative flex flex-col items-center">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full border border-orange-500/30 blur-sm animate-pulse"></div>
          
          {/* Main Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-orange-500/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin [animation-duration:0.8s]"></div>
            
            {/* Inner Dot - เพิ่มจุดตรงกลางให้ดูไฮเทค */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Text Styling - ใช้ฟอนต์กว้างๆ และไล่เฉดสี */}
          <div className="mt-8 flex flex-col items-center space-y-2">
            <span className="text-sm font-medium tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-orange-500 animate-pulse">
              LOADING
            </span>
            {/* Loading Progress Line - เส้นใต้เล็กๆ ที่วิ่งไปมา */}
            <div className="w-24 h-[2px] bg-gray-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-orange-500 -translate-x-full animate-[loading_1.5s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
};