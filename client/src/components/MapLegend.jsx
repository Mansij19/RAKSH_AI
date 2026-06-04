export default function MapLegend() {
  return (
    <div className="glass absolute bottom-5 left-5 z-[500] rounded-2xl p-4 text-sm">
      <p className="mb-2 font-black">Map Legend</p>
      <div className="space-y-2">
        <span className="flex items-center gap-2"><b className="h-3 w-3 rounded-full" style={{ backgroundColor: "#00C853" }} /> Safe Area</span>
        <span className="flex items-center gap-2"><b className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FFD600" }} /> Moderate Risk Area</span>
        <span className="flex items-center gap-2"><b className="h-3 w-3 rounded-full" style={{ backgroundColor: "#D50000" }} /> Dangerous Area</span>
      </div>
    </div>
  );
}
