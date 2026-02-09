import { Car } from "lucide-react";

const PlayfulLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <div className="flex space-x-2">
        <Car className="w-8 h-8 text-yellow-500 animate-bounce [animation-delay:-0.3s]" />
        <Car className="w-8 h-8 text-yellow-500 animate-bounce [animation-delay:-0.15s]" />
        <Car className="w-8 h-8 text-yellow-500 animate-bounce" />
      </div>
      <p className="mt-4 text-slate-400 font-light tracking-widest uppercase text-xs">
        Finding your ride...
      </p>
    </div>
  );
};

export default PlayfulLoading;