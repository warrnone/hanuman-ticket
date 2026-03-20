
export const SectionLoader = ({ title, subtitle }) => {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-200/70" />
        <div className="flex-1">
          <div className="h-4 w-40 bg-blue-200/70 rounded mb-2" />
          <div className="h-3 w-28 bg-blue-100 rounded" />
        </div>
      </div>

      {title && (
        <div className="mb-3">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          {subtitle && <div className="h-3 w-36 bg-slate-100 rounded mt-2" />}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded-xl bg-white border border-slate-200" />
        <div className="h-12 rounded-xl bg-white border border-slate-200" />
        <div className="h-12 rounded-xl bg-white border border-slate-200" />
        <div className="h-12 rounded-xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}

export const  TaxiSelectLoader = () => {
  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-200/70" />
        <div className="flex-1">
          <div className="h-4 w-40 bg-amber-200/70 rounded mb-2" />
          <div className="h-3 w-28 bg-amber-100 rounded" />
        </div>
      </div>
      <div className="h-12 rounded-xl bg-white border border-slate-200" />
    </div>
  );
}

export const SurveyCardLoader = () => {
  return (
    <div className="mb-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-36 bg-violet-200/70 rounded" />
        <div className="h-6 w-24 bg-white border border-slate-200 rounded-full" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div className="h-11 rounded-xl bg-white border border-slate-200" />
        <div className="h-11 rounded-xl bg-white border border-slate-200" />
        <div className="h-11 rounded-xl bg-white border border-slate-200" />
        <div className="h-11 rounded-xl bg-white border border-slate-200" />
        <div className="h-11 rounded-xl bg-white border border-slate-200" />
        <div className="h-11 rounded-xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}