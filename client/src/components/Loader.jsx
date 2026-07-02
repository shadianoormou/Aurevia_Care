// Simple reusable spinner shown during loading states
const Loader = ({ fullScreen = false }) => {
  const spinner = (
    <div className="flex items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-[60vh] flex items-center justify-center">{spinner}</div>;
  }

  return spinner;
};

export default Loader;
