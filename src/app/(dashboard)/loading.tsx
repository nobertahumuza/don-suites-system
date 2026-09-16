export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <i
          className="fas fa-spinner fa-spin text-3xl mb-3 block"
          style={{ color: '#c9a96e' }}
        ></i>
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
